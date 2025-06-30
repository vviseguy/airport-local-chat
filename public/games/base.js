export class BaseGame {
  createGame(user) {
    throw new Error('createGame not implemented');
  }
  applyMove(state, move, user) {
    throw new Error('applyMove not implemented');
  }
  summary(state) {
    return '';
  }
  render(state, sendMove) {
    return document.createElement('div');
  }
}
