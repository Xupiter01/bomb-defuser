// Stage 1-10 configurations
// Boss stages (3, 6, 9, 10) trigger BossScene after clear
export const STAGES = [
  { stage: 1, cols: 6, rows: 6, mines: 5, time: 120, lives: 3, isBoss: false },
  { stage: 2, cols: 6, rows: 6, mines: 5, time: 120, lives: 3, isBoss: false },
  { stage: 3, cols: 8, rows: 8, mines: 10, time: 120, lives: 3, isBoss: true },
  { stage: 4, cols: 8, rows: 8, mines: 12, time: 100, lives: 3, isBoss: false },
  { stage: 5, cols: 8, rows: 8, mines: 12, time: 100, lives: 3, isBoss: false },
  { stage: 6, cols: 10, rows: 10, mines: 18, time: 100, lives: 3, isBoss: true },
  { stage: 7, cols: 10, rows: 10, mines: 22, time: 80, lives: 3, isBoss: false },
  { stage: 8, cols: 10, rows: 10, mines: 22, time: 80, lives: 3, isBoss: false },
  { stage: 9, cols: 12, rows: 12, mines: 30, time: 80, lives: 3, isBoss: true },
  { stage: 10, cols: 12, rows: 12, mines: 35, time: 60, lives: 2, isBoss: true },
];

export function getStage(n) {
  return STAGES.find(s => s.stage === n) || STAGES[0];
}
