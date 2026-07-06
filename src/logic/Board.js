// Board: mine placement + adjacent count calculation
// cells[r][c] = { mine: bool, adjacent: number, revealed: bool, flagged: bool, powerup: bool }
export function generateBoard(cols, rows, numMines, rng = Math.random) {
  // 1. Place mines randomly
  const grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      mine: false, adjacent: 0, revealed: false, flagged: false, powerup: false,
    }))
  );

  let placed = 0;
  const cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push([r, c]);
  // Fisher-Yates shuffle
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  for (let i = 0; i < numMines; i++) {
    const [r, c] = cells[i];
    grid[r][c].mine = true;
    placed++;
  }

  // 2. Calculate adjacent counts
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].mine) count++;
        }
      }
      grid[r][c].adjacent = count;
    }
  }

  return grid;
}

// Flood-fill reveal for empty cells (adjacent = 0)
export function floodReveal(grid, startR, startC) {
  const rows = grid.length, cols = grid[0].length;
  const stack = [[startR, startC]];
  const visited = new Set();
  while (stack.length) {
    const [r, c] = stack.pop();
    const key = r * cols + c;
    if (visited.has(key)) continue;
    visited.add(key);
    if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
    const cell = grid[r][c];
    if (cell.flagged || cell.mine) continue;
    cell.revealed = true;
    if (cell.adjacent === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          stack.push([r + dr, c + dc]);
        }
      }
    }
  }
}

// Count remaining non-mine cells
export function countUnrevealedSafe(grid) {
  let count = 0;
  for (const row of grid) for (const cell of row) if (!cell.mine && !cell.revealed) count++;
  return count;
}
