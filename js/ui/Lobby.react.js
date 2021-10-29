// @flow

const React = require('react');
const AudioWidget = require('./Components/AudioWidget.react');
const Button = require('./components/Button.react');
const Modal = require('./components/Modal.react');
const {config} = require('../config');
const {getLevel, initDefaultLevel} = require('../state/levels');

const Lobby = (props) => {
  const {store, dispatch} = props;
  const levelNum = parseInt(localStorage.getItem('level')) || 0;
  const resetButton = (
    <div>
      <Button
        style={{width: 200, marginBottom: 5}}
        onClick={() => dispatch({type: 'CLEAR_CAMPAIGN'})}
        label="Reset Game"
      />
    </div>
  );
  const isMuted = store.getState().isMuted;
  return (<span>
    <div className="mainMenu">
      <div
        style={{
          margin: 100,
          marginLeft: 45,
        }}
      >
        <div>
        <Button
          style={{width: 200, marginBottom: 5}}
          label={"Start " + (levelNum == 1 ? '' : 'Level ' + (levelNum + 1))}
          onClick={() => {
            dispatch({
              type: 'SET_MODAL',
              modal: (<Modal
                body={'Welcome to Time Travel Understander!'
                  + 'Use the arrow keys to reach the time machine, '
                  + 'passing through open doors along the way. ' +
                  'Once you reach the time machine, travel'
                  + ' back in time and press the color-coded buttons ' +
                  'to open the doors just in time'
                  + ' for your original self to pass through them! ' +
                  'Press the spacebar any time after'
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
          }}
        />
        </div>
        <div>
        <Button
          style={{width: 200, marginBottom: 5}}
          label="Level Editor"
          onClick={() => {
            dispatch({type: 'SET_LEVEL', level: initDefaultLevel()});
            dispatch({type: 'SET_SCREEN', screen: 'EDITOR'});
          }}
        />
        </div>
        {levelNum == 0 ? resetButton : resetButton}
        <AudioWidget
          audioFiles={config.audioFiles}
          isShuffled={false}
          isMuted={isMuted}
          setIsMuted={() => {
            store.dispatch({type: 'SET_IS_MUTED', isMuted: !isMuted});
          }}
          style={{width: 200, marginBottom: 5}}
        />
      </div>
    </div>
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        display: 'inline',
        zIndex: -1,
        opacity: 0.85,
      }}
    >
      <img
        width={window.innerWidth}
        height={window.innerHeight}
        src={'img/background1.png'}
      />
    </div>
  </span>);
};

module.exports = Lobby;
