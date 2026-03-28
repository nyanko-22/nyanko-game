import { createScreen, showScreen, hideScreen, el } from './shared';

let screen: HTMLDivElement | null = null;
let onSubmitCallback: (() => void) | null = null;

function buildScreen(score: number, isNewBest: boolean): HTMLDivElement {
  screen = createScreen('gameover-screen');
  screen.style.background = 'rgba(0,0,0,0.75)';
  screen.style.backdropFilter = 'blur(4px)';

  const inner = el('div', { className: 'screen-inner gameover-inner' });

  const title = el('h2', { className: 'gameover-title' });
  title.textContent = 'GAME OVER';

  const scoreEl = el('p', { className: 'gameover-score' });
  scoreEl.textContent = `SCORE: ${score}`;

  inner.append(title, scoreEl);

  if (isNewBest) {
    const badge = el('div', { className: 'gameover-best-badge' });
    badge.textContent = '🏆 NEW BEST!';
    inner.appendChild(badge);
  }

  const hint = el('p', { className: 'gameover-hint text-body text-muted' });
  hint.textContent = 'スコアを登録しますか?';
  inner.appendChild(hint);

  const submitBtn = el('button', { className: 'btn btn-primary w-full gameover-btn' });
  submitBtn.textContent = 'ニックネームを入力して登録';
  submitBtn.addEventListener('click', () => onSubmitCallback?.());
  inner.appendChild(submitBtn);

  screen.appendChild(inner);
  return screen;
}

export function showGameOverScreen(
  score: number,
  isNewBest: boolean,
  callbacks: { onSubmit: () => void },
): void {
  onSubmitCallback = callbacks.onSubmit;
  // Rebuild each time to update score/newBest
  if (screen) {
    screen.remove();
    screen = null;
  }
  screen = buildScreen(score, isNewBest);
  showScreen(screen);
}

export function hideGameOverScreen(): void {
  if (screen) hideScreen(screen);
}
