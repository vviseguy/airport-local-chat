const BaseGame = require('./base');

class Connect4 extends BaseGame {
  createGame(user) {
    return {
      game: 'connect4',
      board: Array.from({ length: 6 }, () => Array(7).fill(null)),
      players: [user], // first player is Red
      next: 'R',
      winner: null
    };
  }

  applyMove(state, move, user) {
    const { column } = move;
    if (state.winner || column < 0 || column > 6) return state;

    const redPlayer = state.players[0];
    const symbol = user.id === redPlayer.id ? 'R' : 'Y';

    if ((state.next === 'R' && symbol !== 'R') || (state.next === 'Y' && symbol !== 'Y')) {
      return state;
    }

    if (symbol === 'Y' && !state.players.find(p => p.id === user.id)) {
      state.players.push(user);
    }

    // find lowest empty row in column
    let row = -1;
    for (let r = state.board.length - 1; r >= 0; r--) {
      if (!state.board[r][column]) {
        row = r;
        break;
      }
    }
    if (row === -1) return state; // column full

    state.board[row][column] = symbol;

    const checkDir = (dr, dc) => {
      let count = 0;
      let r = row, c = column;
      while (r >= 0 && r < 6 && c >= 0 && c < 7 && state.board[r][c] === symbol) {
        count++; r += dr; c += dc;
      }
      r = row - dr; c = column - dc;
      while (r >= 0 && r < 6 && c >= 0 && c < 7 && state.board[r][c] === symbol) {
        count++; r -= dr; c -= dc;
      }
      return count >= 4;
    };

    if (checkDir(1, 0) || checkDir(0, 1) || checkDir(1, 1) || checkDir(1, -1)) {
      state.winner = symbol;
    } else if (state.board.every(row => row.every(cell => cell))) {
      state.winner = 'draw';
    } else {
      state.next = state.next === 'R' ? 'Y' : 'R';
    }
    return state;
  }

  summary(state) {
    if (state.winner) {
      if (state.winner === 'draw') return 'Draw!';
      if (state.winner === 'R') return `${state.players[0].name} wins`;
      return 'Everyone else wins';
    }
    if (state.next === 'R') return `${state.players[0].name}'s turn`;
    return "Everyone else's turn";
  }
}

module.exports = new Connect4();
