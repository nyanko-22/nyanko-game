const HIGH_SCORE_KEY = 'nyanko-game-highscore';

let currentScore = 0;

export function addScore(points: number): void {
  currentScore += points;
}

export function getScore(): number {
  return currentScore;
}

export function resetScore(): void {
  currentScore = 0;
}

export function getHighScore(): number {
  const saved = localStorage.getItem(HIGH_SCORE_KEY);
  return saved ? parseInt(saved, 10) : 0;
}

export function saveHighScore(): void {
  const high = getHighScore();
  if (currentScore > high) {
    localStorage.setItem(HIGH_SCORE_KEY, currentScore.toString());
  }
}
