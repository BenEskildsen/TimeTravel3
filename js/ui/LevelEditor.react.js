// @flow

const React = require('react');
const {Entities} = require('../entities/registry');
const Button = require('./Components/Button.react');
const Checkbox = require('./Components/Checkbox.react');
const Dropdown = require('./Components/Dropdown.react');
const Divider = require('./Components/Divider.react');
const NumberField = require('./Components/NumberField.react');
const Slider = require('./Components/Slider.react');
const {getEmptyLevel, importLevel} = require('../state/levels');
const {config} = require('../config');
const {getDoors} = require('../selectors/selectors');
const {useState, useEffect, useMemo} = React;
const {render} = require('../render/render');
const {forEachObj} = require('../utils/helpers');
const {add, subtract, equals} = require('../utils/vectors');

document.addEventListener('click', ev => ev.preventDefault);
document.addEventListener('keyDown', ev => ev.preventDefault);

const Editor = (props) => {
  const {store} = props;
  const state = store.getState();
  const dispatch = store.dispatch;

  const [importedLevel, setImportedLevel] = useState('');
  const [deleteSelected, setDeleteSelected] = useState(false);
  const [doorID, setDoorID] = useState(0);

  const levelEditorButtons = (
    <span>
      <Button
        onClick={() => dispatch({type: 'SET_START_LOCATION'})}
        label="Set Start Position"
      />
      <Checkbox label="Delete" onChange={() => setDeleteSelected(!deleteSelected)} />
      {wallOrDoorButtons(deleteSelected, doorID)}
      <div>
        <Dropdown
          options={[0, 1, 2, 3, 4, 5, 6, 7, 8]}
          displayOptions={config.buttonColors}
          selected={doorID}
          onChange={(val) => setDoorID(parseInt(val))}
        />
      </div>
      {addButtons(deleteSelected, doorID)}
      <Button
        label={deleteSelected ? "Delete Target" : "Add Target"}
        onClick={() => {
          const game = store.getState().game;
          let entity = null;
          if (deleteSelected) {
            for (const id in game.TARGET) {
              if (equals(game.TARGET[id].position, game.selectedPosition)) {
                entity = game.TARGET[id];
              }
            }
          } else {
            entity = Entities.TARGET.make(game.selectedPosition);
          }
          dispatch({type: deleteSelected ? 'REMOVE_ENTITY' : 'ADD_ENTITY', entity});
          render(game);
        }}
      />
    </span>
  );

  return (
    <div
      style={{
        width: 500,
        float: 'right',
        backgroundColor: 'white',
      }}
    >
      <Button
        label="Reset Level"
        onClick={() => dispatch({type: 'RESET_LEVEL'})}
      />
      <div>
        Set Step Limit:
        <NumberField
          value={state.game.stepLimit}
          onlyInt={true}
          submitOnBlur={true}
          onChange={(val) => dispatch({type: 'SET_STEP_LIMIT', stepLimit: val})}
        />
      </div>
      <Divider style={{marginTop: 4, marginBottom: 4}} />
      {state.game.selectedPosition
        ? levelEditorButtons
        : 'Select anywhere to add walls, doors, and buttons'}
      <Divider style={{marginTop: 4, marginBottom: 4}} />
      <button
        onClick={() => outputLevel(state.game)}
      >
        Output Level Data to Console
      </button>
      <div>
        <Button label="Import Level"
          onClick={() => {
            dispatch({
              type: 'SET_LEVEL',
              level: importLevel(JSON.parse(importedLevel)), isExperimental: true,
            });
            render(state.game);
          }}
        />
        <input type="text"
          value={importedLevel}
          onChange={(ev) => {
            setImportedLevel(ev.target.value);
          }}
        />
      </div>
    </div>
  );
};

const outputLevel = (game) => {
  store.dispatch({type: 'RESET_LEVEL'});
  let output = {};
  output.gridWidth = game.gridWidth;
  output.gridHeight = game.gridHeight;
  output.stepLimit = game.stepLimit;
  for (const entityType in Entities) {
    output[entityType] = game[entityType];
  }
  console.log(JSON.stringify(output));
}

const addButtons = (deleteSelected, doorID) => {
  const dispatch = store.dispatch;
  return (
    <div>
      <Button
        label={deleteSelected ? "Delete Button" : "Add Button"}
        onClick={() => {
          const game = store.getState().game;
          let entity = null;
          if (deleteSelected) {
            for (const id in game.BUTTON) {
              if (equals(game.BUTTON[id].position, game.selectedPosition)) {
                entity = game.BUTTON[id];
              }
            }
          } else {
            entity = Entities.BUTTON.make(game.selectedPosition, doorID);
          }
          dispatch({type: deleteSelected ? 'REMOVE_ENTITY' : 'ADD_ENTITY', entity});
          render(game);
        }}
      />
    </div>
  );
}

const wallOrDoorButtons = (deleteSelected, doorID) => {
  const [doorSelected, setDoorSelected] = useState(false);

  let wallOrDoorOrDelete = 'Add Wall';
  if (doorSelected) {
    wallOrDoorOrDelete = 'Add Door';
  }
  if (deleteSelected) {
    wallOrDoorOrDelete = 'Delete';
  }
  return (
    <div>
      <Checkbox label="Door" onChange={() => setDoorSelected(!doorSelected)} />
      <div>
        <button
          onClick={() => addWall('top', doorID, deleteSelected)}>
          {wallOrDoorOrDelete} Top
        </button>
        <button
          onClick={() => addWall('bottom', doorID, deleteSelected)}>
          {wallOrDoorOrDelete} Bottom
        </button>
        <button
          onClick={() => addWall('left', doorID, deleteSelected)}>
          {wallOrDoorOrDelete} Left
        </button>
        <button
          onClick={() => addWall('right', doorID, deleteSelected)}>
          {wallOrDoorOrDelete} Right
        </button>
      </div>
    </div>
  );
}

const addWall = (side, doorID, shouldDelete) => {
  const {x, y} = store.getState().game.selectedPosition;
  const {dispatch} = store;
  let doorIDParam = doorID == null ? true : doorID;
  const entityType = doorID == null ? 'WALL' : 'DOOR';
  let start = {x, y};
  let end = {x: x + 1, y: y};
  switch (side) {
    case 'top': {
      start = {x, y};
      end = {x: x + 1, y: y};
      break;
    }
    case 'bottom': {
      start = {x, y: y + 1};
      end = {x: x + 1, y: y + 1};
      break;
    }
    case 'left': {
      start = {x, y: y};
      end = {x: x, y: y + 1};
      break;
    }
    case 'right': {
      start = {x: x + 1, y: y};
      end = {x: x + 1, y: y + 1};
      break;
    }
  }
  let entity = null;
  if (shouldDelete) {
    entity = findWall(store.getState().game, start, end);
    console.log(entity);
  } else {
    entity = Entities[entityType].make(start, end, doorIDParam);
  }
  if (entity != null) {
    dispatch({type: shouldDelete ? 'REMOVE_ENTITY' : 'ADD_ENTITY', entity});
    render(store.getState().game);
  }
}

const findWall = (game, start, end) => {
  let found = null;
  forEachObj({...game.WALL, ...game.DOOR}, wall => {
    if (equals(wall.start, start) && equals(wall.end, end)) {
      found = wall;
    }
  });
  return found;
}

module.exports = Editor;
