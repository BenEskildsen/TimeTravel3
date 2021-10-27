// @flow

const React = require('react');
const Modal = require('./components/Modal.react');
const {getLevel, initDefaultLevel} = require('../state/levels');

const Lobby = (props) => {
  const {store, dispatch} = props;
  const levelNum = parseInt(localStorage.getItem('level')) || 0;
  const resetButton = (
    <button onClick={() => dispatch({type: 'CLEAR_CAMPAIGN'})}>
      Reset Game to Level 1
    </button>
  );
  return (<span>
    <div className="mainMenu">
      <button onClick={() => {
        dispatch({
          type: 'SET_MODAL',
          modal: (<Modal
            body={'Welcome to Time Travel Understander!'
            + 'Use the arrow keys to reach the time machine, '
            + 'passing through open doors along the way. Once you reach the time machine, travel'
            + ' back in time and press the color-coded buttons to open the doors just in time'
            + ' for your original self to pass through them! Press the spacebar any time after'
            + ' you\'ve reached the time machine to go back in time again.'
            }
            buttons={[{
              label: 'I "Understand"',
              onClick: () => {
                dispatch({type: 'DISMISS_MODAL'});
                dispatch({type: 'SET_LEVEL', level: getLevel(levelNum)});
                dispatch({type: 'SET_SCREEN', screen: 'GAME'});
              },
            }]}
          />)
        });
      }}>
        Start {levelNum == 0 ? '' : 'at Level ' + (levelNum + 1)}
      </button>
      <button onClick={() => {
        dispatch({type: 'SET_LEVEL', level: initDefaultLevel()});
        dispatch({type: 'SET_SCREEN', screen: 'EDITOR'});
      }}>
        Level Editor
      </button>
      {levelNum == 0 ? null : resetButton}
    </div>
  </span>);
      // <input type="text" style={{width: '100%', marginTop: '50'}} id="levelPaste"></input>
      // TODO handle pasting custom levels
      // <button onClick={() => dispatch({type: 'CUSTOM'})}>
      //   Paste Custom Level
      // </button>
};

module.exports = Lobby;
