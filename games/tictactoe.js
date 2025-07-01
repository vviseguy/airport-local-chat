const BaseGame = require('./base');

class TicTacToe extends BaseGame {
  createGame(user) {
    return {
      game: 'tictactoe',
      board: Array(9).fill(null),
      players: [user], // first player is always X
      next: 'X',
      winner: null
    };
  }

  applyMove(state, move, user) {
    const { index } = move;
    if (state.winner || state.board[index]) return state;

    const xPlayer = state.players[0];
    const symbol = user.id === xPlayer.id ? 'X' : 'O';
    if ((state.next === 'X' && symbol !== 'X') || (state.next === 'O' && symbol !== 'O')) {
      return state;
    }

    if (symbol === 'O' && !state.players.find(p => p.id === user.id)) {
      state.players.push(user);
    }

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
      state.next = state.next === 'X' ? 'O' : 'X';
    }
    return state;
  }

  summary(state) {
    if (state.winner) {
      if (state.winner === 'draw') return 'Draw!';
      if (state.winner === 'X') return `${state.players[0].name} wins`;
      return 'Everyone else wins';
    }
    if (state.next === 'X') return `${state.players[0].name}'s turn`;
    return "Everyone else's turn";
  }
}

module.exports = new TicTacToe();
