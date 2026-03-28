import { el, materialIcon } from './shared';
import { CATS } from '../constants';

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
  const cat = CATS[level];
  const radius = Math.min(cat.radius, 16);
  const size = nextCatCanvas.width;

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2, size / 2);

  // Draw cat body
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = cat.color;
  ctx.fill();
  ctx.strokeStyle = cat.darkColor;
  ctx.lineWidth = Math.max(1, radius * 0.06);
  ctx.stroke();

  // Eyes
  const eyeOffsetX = radius * 0.3;
  const eyeOffsetY = -radius * 0.1;
  const eyeWidth = radius * 0.18;
  const eyeHeight = radius * 0.22;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.ellipse(-eyeOffsetX, eyeOffsetY, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(eyeOffsetX, eyeOffsetY, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#333333';
  ctx.beginPath();
  ctx.ellipse(-eyeOffsetX, eyeOffsetY, eyeWidth * 0.55, eyeHeight * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(eyeOffsetX, eyeOffsetY, eyeWidth * 0.55, eyeHeight * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();

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
