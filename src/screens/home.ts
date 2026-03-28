import { createScreen, showScreen, hideScreen, el, materialIcon } from './shared';
import { drawCatFace } from '../renderer';
import { CATS } from '../constants';

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

  // Siamese cat canvas
  const catCanvas = document.createElement('canvas');
  catCanvas.width = 110;
  catCanvas.height = 120;
  catCanvas.className = 'home-cat-canvas';
  const catCtx = catCanvas.getContext('2d')!;
  catCtx.translate(55, 68);
  drawCatFace(catCtx, 2, CATS[2].radius * 1.1);

  const titleEl = el('h1', { className: 'home-title' });
  titleEl.textContent = 'にゃんこゲーム';

  const subtitleEl = el('p', { className: 'home-subtitle text-body text-muted' });
  subtitleEl.textContent = '同じ猫同士をくっつけて大きな猫を作ろう!';

  hero.append(catCanvas, titleEl, subtitleEl);

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
