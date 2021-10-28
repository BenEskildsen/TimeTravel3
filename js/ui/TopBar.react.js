
const React = require('react');
const AudioWidget = require('./Components/AudioWidget.react');
const Button = require('./Components/Button.react');
const Divider = require('./Components/Divider.react');
const Modal = require('./Components/Modal.react');
const QuitButton = require('../ui/components/QuitButton.react');
const {config} = require('../config');
const {getDisplayTime, isElectron} = require('../utils/helpers');
const {memo, useState, useEffect, useMemo} = React;

function TopBar(props) {
  const {
    dispatch,
    isExperimental,
    modal,
    canvasWidth,
    isMuted,
    isTimeReversed,
  } = props;

  const height = 100;
  const topPadding = 8;
  const leftPadding = canvasWidth / 2 - 100;


  return (
    <div
      id="topBar"
      style={{
        position: 'absolute',
        top: topPadding,
        height,
        width: isExperimental ? '400px' : '100%',
        zIndex: 2,
        pointerEvents: isExperimental ? 'none' : 'auto',
        // textShadow: '-1px -1px 0 #FFF, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff',
      }}
    >
      <ButtonStack {...props} />
      <InfoStack {...props} />
    </div>
  );
}

function InfoStack(props) {
  const {
    dispatch,
    isExperimental,
    modal,
    canvasWidth,
    isMuted,
    isTimeReversed,
    stepsRemaining,
    numReversals,
    level,
  } = props;

  const [flickerIndex, setFlickerIndex] = useState(0);

  // useEffect(() => {
  //   const flickerFunc = (f) => {
  //     setFlickerIndex(f - 1);
  //     if (f > 1) {
  //       setTimeout(() => flickerFunc(f - 1), 100);
  //     }
  //   }
  //   if (stepsRemaining <= 2 && !isTimeReversed) {
  //     flickerFunc(8);
  //   }
  // }, [stepsRemaining, isTimeReversed]);

  return (
    <div
      style={{
        display: 'inline-block',
        verticalAlign: 'top',
        fontSize: flickerIndex % 2 == 0 ? '13' : '15',
        float: 'right',
        marginRight: 8,
        color: flickerIndex % 2 == 0 ? 'white' : 'red',
      }}
    >
      Level: {level + 1}
      <div></div>
      Steps Left: {stepsRemaining}
      <div></div>
      Time Reversals: {numReversals}
    </div>
  );
}

function ButtonStack(props) {
  const {
    dispatch,
    isExperimental,
    modal,
    canvasWidth,
    isMuted,
  } = props;

  return (
    <div
      style={{
        // float: 'left',
        paddingLeft: 8,
        display: 'inline-block',
        color: 'black',
      }}
    >
      <QuitButton
        isInGame={true} dispatch={dispatch}
        style={{width: 135, marginBottom: 5}}
      />
      <AudioWidget
        audioFiles={config.audioFiles}
        isShuffled={false}
        isMuted={isMuted}
        setIsMuted={() => {
          store.dispatch({type: 'SET_IS_MUTED', isMuted: !isMuted});
        }}
        style={{width: 135, marginBottom: 5}}
      />
      <div>
        <Button
          label="Instructions"
          style={{width: 135, marginBottom: 5}}
          onClick={() => {
            instructionsModal(dispatch);
          }}
        />
      </div>
    </div>
  );
}

function instructionsModal(dispatch) {
  dispatch({type: 'STOP_TICK'});
  dispatch({
    type: 'SET_HOTKEY', press: 'onKeyUp',
    key: 'enter',
    fn: (s) => dismissModal(s.dispatch),
  });
  dispatch({
    type: 'SET_MODAL',
    modal: (<Modal
      title="Instructions"
      body={(<span style={{textAlign: 'initial'}}>
        <div>
          <div style={{textAlign: 'center'}}><b>Controls:</b></div>
          <div>Arrow Keys: move character</div>
          <div>Space bar: go back in time</div>
        </div>
        <Divider style={{
          marginTop: 6,
          marginBottom: 6,
        }} />
        <div>
          <div style={{textAlign: 'center'}}><b>Goal:</b></div>
          <div>TBD</div>
        </div>
      </span>)}
      buttons={[{label: 'Dismiss (Enter)', onClick: () => {
        dismissModal(dispatch);
      }}]}
    />),
  });
}

function dismissModal(dispatch) {
  dispatch({type: 'DISMISS_MODAL'});
  dispatch({
    type: 'SET_HOTKEY', press: 'onKeyUp',
    key: 'enter',
    fn: (s) => {},
  });
}


module.exports = TopBar;
