const BaseGame = require('./base');

class TicTacToe extends BaseGame {
  createGame(user) {
    return {
      game: 'tictactoe',
      board: Array(9).fill(null),
      players: [user],
      next: user.id,
      winner: null
    };
  }

  applyMove(state, move, user) {
    const { index } = move;
    if (state.winner || state.next !== user.id || state.board[index]) return state;

    if (!state.players.find(p => p.id === user.id)) {
      if (state.players.length < 2) {
        state.players.push(user);
      } else {
        return state;
      }
    }

    const symbol = state.players[0].id === user.id ? 'X' : 'O';
    state.board[index] = symbol;
    const lines = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];
    for (const [a,b,c] of lines) {
      if (state.board[a] && state.board[a] === state.board[b] && state.board[a] === state.board[c]) {
        state.winner = symbol;
      }
    }
    if (!state.winner && state.board.every(v => v)) {
      state.winner = 'draw';
    }
    if (!state.winner) {
      const other = state.players.find(p => p.id !== user.id);
      if (other) state.next = other.id;
    }
    return state;
  }

  summary(state) {
    if (state.winner) {
      if (state.winner === 'draw') return 'Draw!';
      const idx = state.winner === 'X' ? 0 : 1;
      const player = state.players[idx];
      return `${player ? player.name : state.winner} wins`;
    }
    const player = state.players.find(p => p.id === state.next);
    return player ? `${player.name}'s turn` : '';
  }
}

module.exports = new TicTacToe();
