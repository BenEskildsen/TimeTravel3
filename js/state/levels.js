// @flow

const {Entities} = require('../entities/registry');
const {makeEntity} = require('../entities/entities');
const {initGameState} = require('./state');

const importLevel = (json) => {
  for (const entityType in Entities) {
    for (const entityID in json[entityType]) {
      json.entities[entityID] = json[entityType][entityID];
      // HACK: increment entityID
      makeEntity();
    }
  }

  return {
    ...initGameState(),
    ...json,
  };
};

const getLevel = (levelNum) => {
  const nextLevel = allLevels[Object.keys(allLevels)[levelNum]];
  return importLevel(nextLevel);
};

const initDefaultLevel = () => {
  const game = initGameState();

  addEntity(game, Entities.AGENT.make([{x: 3, y: 0}], true));

  addEntity(game, Entities.DOOR.make({x: 2, y: 4}, {x: 2, y: 5}, 0));
  addEntity(game, Entities.DOOR.make({x: 4, y: 2}, {x: 5, y: 2}, 1));

  addEntity(game, Entities.BUTTON.make({x: 1, y: 1}, 0));
  addEntity(game, Entities.BUTTON.make({x: 3, y: 3}, 1));

  for (let i = 0; i <= 6; i++) {
    addEntity(game, Entities.WALL.make({x: i, y: 0}, {x: i + 1, y: 0}));
    addEntity(game, Entities.WALL.make({x: i, y: 7}, {x: i + 1, y: 7}));
    addEntity(game, Entities.WALL.make({x: 0, y: i}, {x: 0, y: i + 1}));
    addEntity(game, Entities.WALL.make({x: 7, y: i}, {x: 7, y: i + 1}));
  }

  addEntity(game, Entities.TARGET.make({x: 6, y: 6}));
  return game;
}

const addEntity = (game, entity) => {
  game[entity.type][entity.id] = entity;
  game.entities[entity.id] = entity;
};

const allLevels = {
  testLevel2: initDefaultLevel(),
  testLevel: require('../levels/testLevel'),
};

module.exports = {
  getLevel,
  initDefaultLevel,
  importLevel,
  allLevels,
};
