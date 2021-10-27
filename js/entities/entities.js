// @flow

let entityID = 0;

const makeEntity = () => {
  return {
    id: entityID++,
    actionQueue: [],
  };
};

module.exports = {
  makeEntity,
};
