export function render(state, sendMove, userId) {
  const wrapper = document.createElement('div');
  wrapper.className = 'ttt';
  const table = document.createElement('table');
  for (let r = 0; r < 3; r++) {
    const row = document.createElement('tr');
    for (let c = 0; c < 3; c++) {
      const idx = r * 3 + c;
      const cell = document.createElement('td');
      cell.textContent = state.board[idx] || '';
      if (!state.board[idx] && state.next === userId && !state.winner) {
        cell.style.cursor = 'pointer';
        cell.onclick = () => sendMove({ index: idx });
      }
      row.appendChild(cell);
    }
    table.appendChild(row);
  }
  wrapper.appendChild(table);
  if (state.winner) {
    const div = document.createElement('div');
    if (state.winner === 'draw') {
      div.textContent = 'Draw!';
    } else {
      const idx = state.winner === 'X' ? 0 : 1;
      const player = state.players[idx];
      div.textContent = `${player ? player.name : state.winner} wins`;
    }
    wrapper.appendChild(div);
  }
  return wrapper;
}

export function summary(state) {
  if (state.winner) {
    if (state.winner === 'draw') return 'Draw!';
    const idx = state.winner === 'X' ? 0 : 1;
    const player = state.players[idx];
    return `${player ? player.name : state.winner} wins`;
  }
  const idx = state.players[0].id === state.next ? 0 : 1;
  const player = state.players[idx];
  return `${player ? player.name : 'Player ' + (idx + 1)}'s turn`;
}
