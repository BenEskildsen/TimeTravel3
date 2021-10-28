// @flow

const config = {
  cellWidth: 32,
  cellHeight: 32,
  canvasWidth: 640,
  canvasHeight: 640,
  useFullScreen: true,

  msPerTick: 40,
  animationDuration: 500, // in ms

  buttonColors: [
    'red', 'teal', 'green',
    'pink', 'orange', 'blue',
    'brown', 'beige', 'purple',
  ],

  audioFiles: [
    {path: 'audio/TimeTravelMainMenu1Ext.mp3', type: 'mp3'},
  ],
};

module.exports = {config};
