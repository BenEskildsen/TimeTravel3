// @flow

const {config} = require('../config');
const {subtract, equals} = require('../utils/vectors');
const {makeAnimation} = require('../entities/animations');
const {
  getPlayerAgent, hitsWall, getTarget, getKeyFromDir,
  getMoveDirFromPositions,
} = require('../selectors/selectors');
const {filterObj, forEachObj, deepCopy} = require('../utils/helpers');
const {Entities} = require('../entities/registry');
const {initMoveAttempts} = require('../state/state');

const makeAction = (type, payload) => {
  return {
    type,
    animation: makeAnimation(type),
    payload: payload || {},
  };
};

const doNextAction = (game, entity): Game => {
  const action = entity.actionQueue[0];
  if (!action) return game;

  startAnimationInterval(game);
  switch (action.type) {
    case 'MOVE':
      return doMove(game, entity, action);
    case 'REVERSE_TIME':
      return doReverseTime(game, entity);
    case 'STEP_TIME_BACKWARDS':
      return doStepTimeBackwards(game);
    case 'GO_BACK_IN_TIME':
    case 'WAIT':
      return game;
    case 'LEVEL_WON':
      console.log("level won");
      game.levelWon = true;
      return game;
  }

  console.log("unhandled entity action", action.type, action);
  return game;
};

const cancelAction = (game, entity): Game => {
  entity.actionQueue.shift();
  if (entity.actionQueue.length > 0) {
    doNextAction(game, entity);
  }
  return game;
}

const startAnimationInterval = (game) => {
  if (game.tickInterval == null) {
    game.prevTickTime = new Date().getTime();
    game.tickInterval = setInterval(
      // HACK: store is only available via window
      () => store.dispatch({type: 'STEP_ANIMATION'}),
      config.msPerTick,
    );
  }
};

///////////////////////////////////////////////////////////////////////////
// Reverse Time
///////////////////////////////////////////////////////////////////////////

const doStepTimeBackwards = (game): GameState => {
  const nextTime = game.time - 1;

  // shut all doors
  if (nextTime == 0 && game.numReversals == 1) {
    forEachObj(game.BUTTON, (button) => {
      button.pressed = false;
      forEachObj(game.DOOR, (door) => {
        if (door.doorID === button.doorID) {
          door.open = false;
        }
      });
    });
  }
  return {
    ...game,
    time: nextTime,
    prevTime: game.time,
    isTimeReversed: nextTime > 0,
  };
};

const doReverseTime = (game, entity): GameState => {
  // if (!entity.isPlayerAgent) return game; // this action is for animation only if
                                          // you're not the player character

  const latestPos = [...getPlayerAgent(game).history].pop();

  // can't reverse time if you haven't reached the target yet
  // if (getTarget(game).reached < 1) {
  //   return game;
  // }

  // check whether going back in time would cause a collision and prevent it
  let cantGoBack = false;
  forEachObj(game.AGENT, (agent) => {
    const agentPos = agent.history[0];
    if (latestPos.x == agentPos.x && latestPos.y == agentPos.y) {
      cantGoBack = true;
    }
  });
  if (cantGoBack) {
    console.log("no reverse time");
    return {
      ...game,
      // rumble: {
      //   shouldRumble: true,
      //   offset: {x: 0, y: 0},
      //   count: -1,
      // },
      moveAttempts: {
        ...game.moveAttempts,
        revTime: true,
      },
    };
  }

  const nextPlayerAgent = Entities.AGENT.make([latestPos], true);
  for (let i = 0; i < game.time; i++) {
    nextPlayerAgent.actionQueue.push(makeAction('GO_BACK_IN_TIME'));
  }
  // add reverse time actions to each agent
  forEachObj(game.AGENT, (agent) => {
    if (agent.id != nextPlayerAgent.id) {
      agent.isPlayerAgent = false;
    }
    // do one additional wait for all agents to match with the go_back_in_time
    // agent.actionQueue.push(makeAction('WAIT'));
    let curPos = agent.history[game.time] || agent.history[agent.history.length - 1];
    for (let i = game.time - 1; i >= 0; i--) {
      if (i > agent.history.length - 1) {
        agent.actionQueue.push(makeAction('WAIT'));
        continue;
      }
      if (i > agent.history.length - 2) {
        agent.actionQueue.push(makeAction('GO_BACK_IN_TIME'));
        continue;
      }
      const nextPos = agent.history[i];
      agent.actionQueue.push(makeAction('MOVE', getMoveDirFromPositions(curPos, nextPos)));
      curPos = nextPos;
    }
  });

  let isTimeReversed = true;
  // allow stepping backwards in time via the target
  if (game.time > 1) {
    for (let i = 0; i < game.time - 1; i++) {
      getTarget(game).actionQueue.push(makeAction('STEP_TIME_BACKWARDS'));
    }
  } else {
    isTimeReversed = false;
  }

  return {
    ...game,
    prevTime: game.time,
    time: game.time - 1,
    isTimeReversed,
    numReversals: game.numReversals + 1,
    AGENT: {[nextPlayerAgent.id]: nextPlayerAgent, ...game.AGENT},
    entities: {[nextPlayerAgent.id]: nextPlayerAgent, ...game.entities},
  }
};

///////////////////////////////////////////////////////////////////////////
// Do Move
///////////////////////////////////////////////////////////////////////////

const doMove = (game: GameState, entity: Entity, action: MoveAction): GameState => {
  const {dir, key} = action.payload;
  const playerAgent = getPlayerAgent(game);
  entity.facing = key;

  let curPos = entity.history[game.time];
  if (!curPos) {
    console.log("no curPos at time", game.time, entity.history.length);
    curPos = entity.history[entity.history.length - 1];
  }
  const nextPos = {
    x: curPos.x + (dir.x || 0),
    y: curPos.y + (dir.y || 0),
  };

  if (entity.isPlayerAgent) {
    // collisions with other agents
    const collisions = filterObj(game.AGENT, (agent) => {
      if (agent.id == entity.id) return false;
      const prevPos = agent.history[game.time] || {x: null, y: null};
      const pos = agent.history[game.time+1] || {x: null, y: null};
      return (pos.x === nextPos.x && pos.y === nextPos.y)
        // check for switching places (which is not allowed)
        || (
          prevPos.x === nextPos.x && prevPos.y === nextPos.y &&
          pos.x === curPos.x && pos.y === curPos.y
        );
    });
    if (Object.keys(collisions).length > 0) {
      console.log("collides with other agent", collisions);
      cancelAction(game, entity);
      return {
        ...game,
        // rumble: {
        //   shouldRumble: true,
        //   offset: {x: 0, y: 0},
        //   count: -1,
        // },
        moveAttempts: {
          ...game.moveAttempts,
          [key]: true,
        },
      }
    }

    if (hitsWall(game, curPos, nextPos)) {
      console.log("hits wall");
      cancelAction(game, entity);
      return {
        ...game,
        // rumble: {
        //   shouldRumble: true,
        //   offset: {x: 0, y: 0},
        //   count: -1,
        // },
        moveAttempts: {
          ...game.moveAttempts,
          [key]: true,
        },
      }
    }

    // check if any agent hits a door
    let stuck = false;
    forEachObj(game.AGENT, (agent) => {
      const cur = agent.history[game.time];
      const next = agent.history[game.time + 1];
      if (next && cur && hitsWall(game, cur, next)) {
        stuck = true;
      }
    });
    if (stuck) {
      console.log("other agent hits door");
      cancelAction(game, entity);
      return {
        ...game,
        // rumble: {
        //   shouldRumble: true,
        //   offset: {x: 0, y: 0},
        //   count: -1,
        // },
        moveAttempts: {
          ...game.moveAttempts,
          [key]: true,
        },
      }
    }
  }

  // update game
  if (!game.isTimeReversed && entity.id == playerAgent.id) {

    // check if reached target location
    const target = getTarget(game);
    if (target.reached == 0 && equals(nextPos, target.position)) {
      target.reached++;
    } else {
      forEachObj(game.AGENT, agent => {
        const agent1Pos = agent.history[game.time + 1];
        if (agent1Pos && equals(agent1Pos, target.position)) {
          target.reached++;
        }
      });
    }
    if (target.reached > 1 || (game.level < 2 && target.reached > 0)) {
      target.actionQueue.push(makeAction('WAIT'));
      target.actionQueue.push(makeAction('WAIT'));
      target.actionQueue.push(makeAction('LEVEL_WON'));
    }

    playerAgent.history.push(nextPos);
    game.prevTime = game.time;
    game.time++;

    // successfully moved, so reset moveAttempts
    game.moveAttempts = initMoveAttempts();

    // add the move action to each other agent
    forEachObj(game.AGENT, (agent) => {
      if (agent.id == playerAgent.id) return;
      const curPos = agent.history[game.prevTime];
      const nextPos = agent.history[game.time];
      if (curPos != null && nextPos != null) {
        const move = getMoveDirFromPositions(curPos, nextPos);
        agent.actionQueue.push(makeAction('MOVE', move));
        doNextAction(game, agent);
      } else if (curPos != null && nextPos == null) {
        agent.actionQueue.push(makeAction('GO_BACK_IN_TIME'));
        doNextAction(game, agent);
      }
    });
  }

  // check if any agent hit buttons
  let pos = nextPos;
  if (game.isTimeReversed || !entity.isPlayerAgent) {
    pos = curPos;
  }
  const pressed = !game.isTimeReversed;
  forEachObj(game.BUTTON, (button) => {
    if (pos.x === button.position.x && pos.y === button.position.y) {
      button.pressed = pressed;
      forEachObj(game.DOOR, (door) => {
        if (door.doorID === button.doorID) {
          door.open = pressed;
        }
      });
    }
  });

  return game;
};

module.exports = {
  makeAction,
  doNextAction,
  cancelAction,
  doReverseTime,
  doMove,
};
