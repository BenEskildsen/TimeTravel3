// @flow

const React = require('react');
const Button = require('./Components/Button.react');
const Canvas = require('./Canvas.react');
const TopBar = require('./TopBar.react');
const BottomBar = require('./BottomBar.react');
const {initGameOverSystem} = require('../systems/gameOverSystem');
const {initSpriteSheetSystem} = require('../systems/spriteSheetSystem');
const {initKeyboardControlsSystem} = require('../systems/keyboardControlsSystem');
const {initMouseControlsSystem} = require('../systems/mouseControlsSystem');
const {useEffect, useState, useMemo, Component, memo} = React;
const {getPlayerAgent, getTarget} = require('../selectors/selectors');
const {makeAction} = require('../entities/actions');

import type {Action, State} from '../types';

type Props = {
  dispatch: (action: Action) => Action,
  store:  Object,
  isInLevelEditor: boolean,
  topBar: mixed,
  controlButtons: mixed,
};

function Game(props: Props): React.Node {
  const {dispatch, store, isInLevelEditor, gameID, tickInterval} = props;
  const state = store.getState();

  // init systems
  useEffect(() => {
    // trying to prevent pinch zoom
    document.addEventListener('touchmove', function (ev) {
      if (ev.scale !== 1) { ev.preventDefault(); }
    }, {passive: false});
    document.addEventListener('gesturestart', function (ev) {
      ev.preventDefault();
    }, {passive: false});
  }, []);
  useEffect(() => {
    initKeyboardControlsSystem(store);
    if (state.game.isExperimental) {
      initMouseControlsSystem(store,
        {leftDown: (s, d, gridPos) => {
          d({type: 'SET_SELECTED_POSITION', pos: gridPos});
        }}
      );
    }
    initGameOverSystem(store);
    registerHotkeys(dispatch);
  }, [gameID]);

  // ---------------------------------------------
  // memoizing UI stuff here
  // ---------------------------------------------
  const {game} = state;

  const elem = document.getElementById('background');
  const dims = useMemo(() => {
    const dims = {width: window.innerWidth, height: window.innerHeight};
    if (isInLevelEditor && elem != null) {
      const slider = document.getElementById('sliderBar');
      const editor = document.getElementById('levelEditor');
      let sliderWidth = slider != null ? slider.getBoundingClientRect().width : 0;
      let editorWidth = editor != null ? editor.getBoundingClientRect().width : 0;
      dims.width = dims.width - sliderWidth - editorWidth;
    }
    return dims;
  }, [window.innerWidth, window.innerHeight, elem != null]);

  return (
    <div
      className="background" id="background"
      style={{
        position: 'relative',
        display: 'inline-block',
        width: '100%',
      }}
    >
      <Canvas
        dispatch={dispatch}
        innerWidth={dims.width}
        innerHeight={dims.height}
        isExperimental={state.screen == 'EDITOR'}
      />
      <TopBar dispatch={dispatch}
        isExperimental={props.isInLevelEditor}
        modal={state.modal}
        canvasWidth={dims.width}
        isMuted={state.isMuted}
        stepsRemaining={game.stepLimit - game.time}
        isTimeReversed={game.isTimeReversed}
        numReversals={game.numReversals}
        level={game.level}
      />
      <Controls
        dispatch={dispatch}
        isInLevelEditor={props.isInLevelEditor}
        store={store}
      />
    </div>
  );
}

const Controls = (props) => {
  const {store, dispatch, isInLevelEditor} = props;
  if (isInLevelEditor) return null;

  return (
    <span>
      <div
        style={{
          position: 'absolute',
          bottom: 70,
          left: 30,
        }}
      >
        <Button
          label="Reverse Time"
          onClick={() => reverseTime(store)}
          style={{maxWidth: 90}}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          right: 40,
        }}
      >
        <div
          style={{
            padding: 10,
            textAlign: 'center',
          }}
        >
          <Button
            label="^"
            onClick={() => up(store)}
          />
        </div>
        <div>
          <Button
            label="<"
            onClick={() => left(store)}
            style={{
              marginRight: 10,
            }}
          />
          <Button
            label=">"
            onClick={() => right(store)}
          />
        </div>
        <div
          style={{
            padding: 10,
            textAlign: 'center',
          }}
        >
          <Button
            label="v"
            onClick={() => down(store)}
          />
        </div>
      </div>
    </span>
  );
};

// ------------------------------------------------------------
// Hotkeys
// -------------------------------------------------------------

function registerHotkeys(dispatch) {
  dispatch({
    type: 'SET_HOTKEY', press: 'onKeyDown',
    key: 'space',
    fn: reverseTime,
  });
  dispatch({
    type: 'SET_HOTKEY', press: 'onKeyDown',
    key: 'up',
    fn: up,
  });
  dispatch({
    type: 'SET_HOTKEY', press: 'onKeyDown',
    key: 'down',
    fn: down,
  });
  dispatch({
    type: 'SET_HOTKEY', press: 'onKeyDown',
    key: 'left',
    fn: left,
  });
  dispatch({
    type: 'SET_HOTKEY', press: 'onKeyDown',
    key: 'right',
    fn: right,
  });
}

const up = (s) => {
  const game = s.getState().game;
  const dispatch = s.dispatch;
  if (game.paused) return;
  const action = makeAction('MOVE', {dir: {y: -1}, key: 'up'});
  dispatch({type: 'ENQUEUE_ACTION', entityID: getPlayerAgent(game).id, action});
};

const down = (s) => {
  const game = s.getState().game;
  const dispatch = s.dispatch;
  if (game.paused) return;
  const action = makeAction('MOVE', {dir: {y: 1}, key: 'down'});
  dispatch({type: 'ENQUEUE_ACTION', entityID: getPlayerAgent(game).id, action});
};

const left = (s) => {
  const game = s.getState().game;
  const dispatch = s.dispatch;
  if (game.paused) return;
  const action = makeAction('MOVE', {dir: {x: -1}, key: 'left'});
  dispatch({type: 'ENQUEUE_ACTION', entityID: getPlayerAgent(game).id, action});
};

const right = (s) => {
  const game = s.getState().game;
  const dispatch = s.dispatch;
  if (game.paused) return;
  const action = makeAction('MOVE', {dir: {x: 1}, key: 'right'});
  dispatch({type: 'ENQUEUE_ACTION', entityID: getPlayerAgent(game).id, action});
};

const reverseTime = (s) => {
  const game = s.getState().game;
  const dispatch = s.dispatch;
  const playerChar = getPlayerAgent(game);
  if (!playerChar) return;
  if (game.isTimeReversed) return;
  if (playerChar.actionQueue.length > 0) return;
  if (game.paused) return;

  const action = makeAction('REVERSE_TIME');
  dispatch({type: 'ENQUEUE_ACTION', entityID: getTarget(game).id, action});
  // dispatch({type: 'ENQUEUE_ACTION', entityID: playerChar.id, action});
};

module.exports = Game;
