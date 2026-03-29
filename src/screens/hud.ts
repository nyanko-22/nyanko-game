import { el, materialIcon } from './shared';
import { CATS } from '../constants';
import { drawCatFace } from '../renderer';

const HUD_CONTAINER_ID = 'hud-container';

let hudEl: HTMLDivElement | null = null;
let scoreEl: HTMLDivElement | null = null;
let bestEl: HTMLDivElement | null = null;
let nextCatCanvas: HTMLCanvasElement | null = null;
let nextCatCtx: CanvasRenderingContext2D | null = null;
let onSettingsCallback: (() => void) | null = null;

function buildHud(): HTMLDivElement {
  const hud = document.getElementById(HUD_CONTAINER_ID) as HTMLDivElement;

  // Score panel (top-left)
  const scorePanel = el('div', { className: 'hud-score-panel' });
  scoreEl = el('div', { className: 'hud-score' });
  scoreEl.textContent = 'SCORE: 0';
  bestEl = el('div', { className: 'hud-best' });
  bestEl.textContent = 'BEST: 0';
  scorePanel.append(scoreEl, bestEl);

  // Next cat panel (top-right)
  const nextPanel = el('div', { className: 'hud-next-panel' });
  const nextLabel = el('div', { className: 'hud-next-label' });
  nextLabel.textContent = 'NEXT';
  nextCatCanvas = document.createElement('canvas');
  nextCatCanvas.width = 40;
  nextCatCanvas.height = 40;
  nextCatCanvas.className = 'hud-next-canvas';
  nextCatCtx = nextCatCanvas.getContext('2d');
  nextPanel.append(nextLabel, nextCatCanvas);

  // Settings button (top-right corner)
  const settingsBtn = el('button', { className: 'hud-settings-btn btn-icon' });
  settingsBtn.style.pointerEvents = 'auto';
  settingsBtn.appendChild(materialIcon('settings'));
  settingsBtn.addEventListener('click', () => onSettingsCallback?.());

  hud.append(scorePanel, nextPanel, settingsBtn);
  return hud;
}

function drawNextCat(level: number): void {
  if (!nextCatCtx || !nextCatCanvas) return;
  const ctx = nextCatCtx;
  const size = nextCatCanvas.width;
  const radius = size / 2 - 2;

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2, size / 2);
  drawCatFace(ctx, level, radius);
  ctx.restore();
}

export function initHud(callbacks: { onSettings: () => void }): void {
  onSettingsCallback = callbacks.onSettings;
  hudEl = buildHud();
}

export function updateHud(score: number, highScore: number, nextLevel: number): void {
  if (!scoreEl || !bestEl) return;
  scoreEl.textContent = `SCORE: ${score}`;
  bestEl.textContent = `BEST: ${highScore}`;
  drawNextCat(nextLevel);
}

export function showHud(): void {
  if (hudEl) hudEl.style.display = 'flex';
}

export function hideHud(): void {
  if (hudEl) hudEl.style.display = 'none';
}
