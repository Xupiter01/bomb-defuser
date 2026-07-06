const STORAGE_KEY = 'bombDefuserProgress.v1';

export function defaultProgress() {
  return {
    unlocked: 1,
    stars: {},
  };
}

export function loadProgress() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw);
    return {
      unlocked: Math.max(1, Math.min(10, Number(parsed.unlocked) || 1)),
      stars: parsed.stars && typeof parsed.stars === 'object' ? parsed.stars : {},
    };
  } catch (err) {
    return defaultProgress();
  }
}

export function saveProgress(progress) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function isStageUnlocked(stage) {
  return stage <= loadProgress().unlocked;
}

export function recordStageClear(stage, stars) {
  const progress = loadProgress();
  const safeStars = Math.max(1, Math.min(3, Number(stars) || 1));
  const key = String(stage);
  progress.stars[key] = Math.max(Number(progress.stars[key]) || 0, safeStars);
  progress.unlocked = Math.max(progress.unlocked, Math.min(10, stage + 1));
  saveProgress(progress);
  return progress;
}

export function calculateStars({ timeRemaining = 0, totalTime = 1, lives = 0, maxLives = 3, mineHits = 0, bossAttempts = 0, bossSequence = 0 } = {}) {
  const timeRatio = totalTime > 0 ? timeRemaining / totalTime : 0;
  const tookDamage = mineHits > 0 || lives < maxLives;

  const bossClean = !bossSequence || bossAttempts <= bossSequence * 3;

  // Perfect clear: fast + no explosion damage.
  if (!tookDamage && timeRatio >= 0.55 && bossClean) return 3;

  // Solid clear: either safe but slower, or one mistake with decent time.
  if ((mineHits <= 1 && lives >= Math.max(1, maxLives - 1) && timeRatio >= 0.25) || (!tookDamage && timeRatio >= 0.2)) return 2;

  return 1;
}
