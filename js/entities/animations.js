// @flow

const {config} = require('../config');

const makeAnimation = (type): Animation => {
  // type ignored for now, but different animations might have different durations
  return {
    duration: config.animationDuration,
    tick: config.animationDuration,
  };
};

module.exports = {
  makeAnimation,
};
