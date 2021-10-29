// @flow

const initSpriteSheetSystem = (store) => {
  const {dispatch} = store;
  const state = store.getState();

  loadSprite(dispatch, state, 'WALL', './img/Wall3.png');
  loadSprite(dispatch, state, 'CHARACTER', './img/characterSheet1.png');
  loadSprite(dispatch, state, 'FLOOR', './img/floorSheet1.png');
  loadSprite(dispatch, state, 'BUTTON', './img/buttonSheet2.png');
  loadSprite(dispatch, state, 'PRESSED_BUTTON', './img/pressedSheet2.png');
  loadSprite(dispatch, state, 'EXCLAMATION', './img/Exclamations1.png');
  loadSprite(dispatch, state, 'GATE', './img/Gate1.png');

  loadSprite(dispatch, state, 'PHEROMONE', './img/Pheromones.png');

  loadSprite(dispatch, state, 'BACKGROUND', './img/background1.png');
};

const loadSprite = (dispatch, state, name, src): void => {
  // if (
  //   state.game != null && state.game.sprites != null &&
  //   state.game.sprites[name] != null
  // ) return;
  const img = new Image();
  img.addEventListener('load', () => {
  //  console.log("loaded " + src + " spritesheet");
    dispatch({
      type: 'SET_SPRITE_SHEET',
      name,
      img,
    });
  }, false);
  img.src = src;
}

module.exports = {initSpriteSheetSystem};
