import { createScreen, showScreen, hideScreen, el, materialIcon } from './shared';

let screen: HTMLDivElement | null = null;
let onStartCallback: (() => void) | null = null;
let onRankingCallback: (() => void) | null = null;
let onSettingsCallback: (() => void) | null = null;

function buildScreen(): HTMLDivElement {
  screen = createScreen('home-screen');
  screen.style.background = 'var(--color-background)';

  const inner = el('div', { className: 'screen-inner' });

  // Header (settings icon)
  const header = el('div', { className: 'home-header' });
  const settingsBtn = el('button', { className: 'btn-icon' });
  settingsBtn.appendChild(materialIcon('settings'));
  settingsBtn.addEventListener('click', () => onSettingsCallback?.());
  header.appendChild(settingsBtn);

  // Hero section
  const hero = el('div', { className: 'home-hero' });

  // CSS cat face
  const catWrap = el('div', { className: 'home-cat' });
  const catBody = el('div', { className: 'home-cat-body' });
  const eyeLeft = el('div', { className: 'home-cat-eye home-cat-eye--left' });
  const eyeRight = el('div', { className: 'home-cat-eye home-cat-eye--right' });
  const nose = el('div', { className: 'home-cat-nose' });
  catBody.append(eyeLeft, eyeRight, nose);
  catWrap.appendChild(catBody);

  const titleEl = el('h1', { className: 'home-title' });
  titleEl.textContent = 'にゃんこゲーム';

  const subtitleEl = el('p', { className: 'home-subtitle text-body text-muted' });
  subtitleEl.textContent = '同じ猫同士をくっつけて大きな猫を作ろう!';

  hero.append(catWrap, titleEl, subtitleEl);

  // Action buttons
  const actions = el('div', { className: 'home-actions' });

  const startBtn = el('button', { className: 'btn btn-primary w-full' });
  startBtn.append(materialIcon('play_circle'), document.createTextNode(' スタート'));
  startBtn.addEventListener('click', () => onStartCallback?.());

  const rankingBtn = el('button', { className: 'btn btn-secondary w-full' });
  rankingBtn.append(materialIcon('leaderboard'), document.createTextNode(' ランキング'));
  rankingBtn.addEventListener('click', () => onRankingCallback?.());

  actions.append(startBtn, rankingBtn);

  inner.append(header, hero, actions);
  screen.appendChild(inner);
  return screen;
}

export function showHomeScreen(callbacks: {
  onStart: () => void;
  onRanking: () => void;
  onSettings: () => void;
}): void {
  onStartCallback = callbacks.onStart;
  onRankingCallback = callbacks.onRanking;
  onSettingsCallback = callbacks.onSettings;

  if (!screen) {
    screen = buildScreen();
  }
  showScreen(screen);
}

export function hideHomeScreen(): void {
  if (screen) hideScreen(screen);
}
