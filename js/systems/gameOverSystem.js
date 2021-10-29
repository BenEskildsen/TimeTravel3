// @flow

const React = require('react');
// const axios = require('axios');
const Divider = require('../ui/components/Divider.react');
const Modal = require('../ui/components/Modal.react');
const Button = require('../ui/components/Button.react');
const {render} = require('../render/render');
const {getLevel} = require('../state/levels');

/**
 * Checks the state every tick for game-over conditions, then orchestrates
 * transition out of the level on win or loss
 *
 * Can short-circuit the game-over checks by setting the gameOver flag on the
 * game directly or with the SET_GAME_OVER action
 */
const initGameOverSystem = (store) => {
  const {dispatch} = store;
  store.subscribe(() => {
    const state = store.getState();
    const {game} = state;
    if (!game) return;
    if (game.paused) return;

    // handle game win conditions
    if (false) {
      handleGameWon(store, dispatch, state, 'win');
    }

    // handle level won
    if (game.levelWon) {
      const nextLevelNum = game.level + 1;
      if (state.screen != 'EDITOR') {
        dispatch({type: 'SET_LEVEL', level: getLevel(nextLevelNum), num: nextLevelNum});
        setTimeout(() => render(store.getState().game), 500);
      } else {
        console.log("level won");
      }
    }

    // LOSS CONDITIONS

    let reason = '';
    // no more move attempts
    const {left, right, up, down, reverseTime} = game.moveAttempts;
    const noMovesLeft = left && right && up && down && reverseTime;
    if (noMovesLeft) reason = "You're stuck! You'll run into yourself if you" +
      " move left, right, up, down, or go back in time!";

    // run out of steps
    const noMoreSteps = game.time > game.stepLimit;
    if (noMoreSteps) reason = 'You ran out of steps!';

    // TODO: each loss condition should queue an action to animate the paradox
    // Then that action will have a large effectIndex that will flip a flag
    // that THIS condition checks for
    if (noMovesLeft || noMoreSteps) {
      dispatch({type: 'SET', property: 'paused', value: true});
      handleGameLoss(store, dispatch, state, reason);
    }

  });
};


const handleGameLoss = (store, dispatch, state, reason): void => {
  const {game} = state;

  const returnButton = {
    label: 'Back to Main Menu',
    onClick: () => {
      dispatch({type: 'DISMISS_MODAL'});
      dispatch({type: 'RETURN_TO_LOBBY'});
    }
  };
  const resetButton = {
    label: 'Restart Level',
    onClick: () => {
      dispatch({type: 'DISMISS_MODAL'});
      dispatch({type: 'RESET_LEVEL'});
      if (state.screen == 'EDITOR') {
        render(store.getState().game); // HACK for level editor
      }
    },
  };
  const buttons = [resetButton, returnButton];

  const body = (
    <div>
      {reason}
    </div>
  );

  dispatch({type: 'SET_MODAL',
    modal: (<Modal
      title={'Game Over'}
      body={body}
      buttons={buttons}
    />),
  });
};

const handleGameWon = (store, dispatch, state, reason): void => {
  const {game} = state;

  // set screen size  to be zoomed out
  // let ratio = game.viewHeight / game.viewWidth;
  // let viewWidth = game.gridWidth;
  // let viewHeight = viewWidth * ratio;
  // dispatch({type: 'SET_VIEW_POS',
  //   viewPos: {x: 0, y: 0}, viewWidth, viewHeight, rerender: true,
  // });

  const contButton = {
    label: 'Continue',
    onClick: () => {
      dispatch({type: 'DISMISS_MODAL'});
      dispatch({type: 'START_TICK'});
    }
  };
  const returnButton = {
    label: 'Back to Main Menu',
    onClick: () => {
      dispatch({type: 'DISMISS_MODAL'});
      dispatch({type: 'RETURN_TO_LOBBY'});
    }
  };
  const resetButton = {
    label: 'Reset',
    onClick: () => {
      dispatch({type: 'DISMISS_MODAL'});
      dispatch({type: 'SET_PLAYERS_AND_SIZE'});
      render(store.getState().game); // HACK for level editor
    },
  };
  const buttons = [contButton, returnButton];
  if (state.screen == 'EDITOR') {
    buttons.push(resetButton);
  }

  dispatch({type: 'SET_MODAL',
    modal: (<Modal
      title={'Level Won'}
      body={'Level Won'}
      buttons={buttons}
    />),
  });
};

module.exports = {initGameOverSystem};
