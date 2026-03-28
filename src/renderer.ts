import type Matter from 'matter-js';
import {
  CATS, GAME_WIDTH, GAME_HEIGHT,
  CONTAINER_X, CONTAINER_Y, CONTAINER_WIDTH, CONTAINER_HEIGHT,
  WALL_THICKNESS, DEATH_LINE_Y, DROP_Y,
} from './constants';
import type { Particle } from './game';
import type { ScoreEntry } from './firebase';
import { getThumbnail } from './ranking';

export type GameState = 'title' | 'playing' | 'gameover' | 'nickname' | 'ranking';

export interface RankingRenderData {
  scores: ScoreEntry[];
  loading: boolean;
  error: boolean;
  scrollOffset: number;
  selectedScreenshot: { url: string; img: HTMLImageElement | null } | null;
  submitting?: boolean;
}

// Ranking layout constants
const RANKING_TITLE_Y = 40;
const RANKING_LIST_Y = 80;
const RANKING_LIST_H = 480;
const RANKING_ROW_H = 50;
const RANKING_BACK_BTN = { x: 30, y: GAME_HEIGHT - 50, w: 120, h: 36 };
const RANKING_PLAY_BTN = { x: GAME_WIDTH - 150, y: GAME_HEIGHT - 50, w: 120, h: 36 };
export const RANKING_LAYOUT = {
  listY: RANKING_LIST_Y, listH: RANKING_LIST_H, rowH: RANKING_ROW_H,
  backBtn: RANKING_BACK_BTN, playBtn: RANKING_PLAY_BTN,
};

// Nickname screen layout
const NICK_SUBMIT_BTN = { x: (GAME_WIDTH - 160) / 2, y: GAME_HEIGHT * 0.58, w: 160, h: 40 };
export const NICKNAME_LAYOUT = { submitBtn: NICK_SUBMIT_BTN };

// Title screen ranking button
const TITLE_RANKING_BTN = { x: (GAME_WIDTH - 140) / 2, y: GAME_HEIGHT / 2 + 190, w: 140, h: 40 };
export const TITLE_LAYOUT = { rankingBtn: TITLE_RANKING_BTN };

export function createCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;
  canvas.style.maxWidth = '100vw';
  canvas.style.maxHeight = '100vh';
  canvas.style.aspectRatio = `${GAME_WIDTH}/${GAME_HEIGHT}`;
  canvas.style.display = 'block';
  canvas.style.margin = '0 auto';
  canvas.style.touchAction = 'none';
  canvas.style.userSelect = 'none';
  canvas.style.cursor = 'pointer';
  return canvas;
}

function drawCatFace(ctx: CanvasRenderingContext2D, level: number, radius: number): void {
  const cat = CATS[level];

  // Body circle
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = cat.color;
  ctx.fill();
  ctx.strokeStyle = cat.darkColor;
  ctx.lineWidth = Math.max(1, radius * 0.06);
  ctx.stroke();

  // Ears
  const earSize = radius * 0.45;
  const earOffset = radius * 0.55;
  ctx.fillStyle = cat.color;
  ctx.strokeStyle = cat.darkColor;

  // Left ear
  ctx.beginPath();
  ctx.moveTo(-earOffset - earSize * 0.5, -radius * 0.6);
  ctx.lineTo(-earOffset, -radius * 0.6 - earSize);
  ctx.lineTo(-earOffset + earSize * 0.5, -radius * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right ear
  ctx.beginPath();
  ctx.moveTo(earOffset - earSize * 0.5, -radius * 0.6);
  ctx.lineTo(earOffset, -radius * 0.6 - earSize);
  ctx.lineTo(earOffset + earSize * 0.5, -radius * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Inner ears (pink)
  const innerEarSize = earSize * 0.55;
  ctx.fillStyle = '#FFB6C1';

  ctx.beginPath();
  ctx.moveTo(-earOffset - innerEarSize * 0.4, -radius * 0.62);
  ctx.lineTo(-earOffset, -radius * 0.62 - innerEarSize);
  ctx.lineTo(-earOffset + innerEarSize * 0.4, -radius * 0.62);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(earOffset - innerEarSize * 0.4, -radius * 0.62);
  ctx.lineTo(earOffset, -radius * 0.62 - innerEarSize);
  ctx.lineTo(earOffset + innerEarSize * 0.4, -radius * 0.62);
  ctx.closePath();
  ctx.fill();

  // Eyes
  const eyeOffsetX = radius * 0.3;
  const eyeOffsetY = -radius * 0.1;
  const eyeWidth = radius * 0.18;
  const eyeHeight = radius * 0.22;

  // Siamese: darker face area
  if (level === 2) {
    ctx.beginPath();
    ctx.arc(0, radius * 0.1, radius * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = '#8B735580';
    ctx.fill();
  }

  // Scottish Fold: folded ears (override ear tips)
  if (level === 3) {
    ctx.fillStyle = cat.color;
    ctx.beginPath();
    ctx.moveTo(-earOffset - earSize * 0.5, -radius * 0.6);
    ctx.lineTo(-earOffset, -radius * 0.6 - earSize * 0.5);
    ctx.lineTo(-earOffset + earSize * 0.5, -radius * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(earOffset - earSize * 0.5, -radius * 0.6);
    ctx.lineTo(earOffset, -radius * 0.6 - earSize * 0.5);
    ctx.lineTo(earOffset + earSize * 0.5, -radius * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Calico patches
  if (level === 1) {
    ctx.beginPath();
    ctx.arc(-radius * 0.3, -radius * 0.3, radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = '#8B4513AA';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(radius * 0.25, radius * 0.2, radius * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#333333AA';
    ctx.fill();
  }

  // Lion mane
  if (level === 9) {
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.15, 0, Math.PI * 2);
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = radius * 0.15;
    ctx.stroke();
  }

  // Cat God crown/glow
  if (level === 10) {
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.1, 0, Math.PI * 2);
    ctx.strokeStyle = '#FFD70066';
    ctx.lineWidth = radius * 0.2;
    ctx.stroke();

    // Crown
    const crownY = -radius * 0.85;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(-radius * 0.4, crownY);
    ctx.lineTo(-radius * 0.3, crownY - radius * 0.3);
    ctx.lineTo(-radius * 0.1, crownY - radius * 0.1);
    ctx.lineTo(0, crownY - radius * 0.35);
    ctx.lineTo(radius * 0.1, crownY - radius * 0.1);
    ctx.lineTo(radius * 0.3, crownY - radius * 0.3);
    ctx.lineTo(radius * 0.4, crownY);
    ctx.closePath();
    ctx.fill();
  }

  // White eye background
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.ellipse(-eyeOffsetX, eyeOffsetY, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(eyeOffsetX, eyeOffsetY, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pupils
  ctx.fillStyle = '#333333';
  const pupilSize = eyeWidth * 0.55;
  ctx.beginPath();
  ctx.ellipse(-eyeOffsetX, eyeOffsetY, pupilSize, pupilSize * 1.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(eyeOffsetX, eyeOffsetY, pupilSize, pupilSize * 1.3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eye shine
  ctx.fillStyle = '#FFFFFF';
  const shineSize = pupilSize * 0.35;
  ctx.beginPath();
  ctx.arc(-eyeOffsetX - pupilSize * 0.2, eyeOffsetY - pupilSize * 0.3, shineSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(eyeOffsetX - pupilSize * 0.2, eyeOffsetY - pupilSize * 0.3, shineSize, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = '#FF8899';
  ctx.beginPath();
  const noseY = radius * 0.15;
  ctx.moveTo(0, noseY - radius * 0.06);
  ctx.lineTo(-radius * 0.06, noseY + radius * 0.04);
  ctx.lineTo(radius * 0.06, noseY + radius * 0.04);
  ctx.closePath();
  ctx.fill();

  // Mouth
  ctx.strokeStyle = '#FF8899';
  ctx.lineWidth = Math.max(1, radius * 0.03);
  ctx.beginPath();
  ctx.moveTo(0, noseY + radius * 0.04);
  ctx.lineTo(0, noseY + radius * 0.12);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-radius * 0.08, noseY + radius * 0.12, radius * 0.08, -Math.PI * 0.1, Math.PI * 0.8);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(radius * 0.08, noseY + radius * 0.12, radius * 0.08, Math.PI * 0.2, Math.PI * 1.1);
  ctx.stroke();

  // Whiskers
  ctx.strokeStyle = cat.darkColor;
  ctx.lineWidth = Math.max(0.5, radius * 0.02);
  const whiskerLen = radius * 0.5;
  const whiskerX = radius * 0.2;
  const whiskerY = noseY + radius * 0.06;

  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(-whiskerX, whiskerY + i * radius * 0.06);
    ctx.lineTo(-whiskerX - whiskerLen, whiskerY + i * radius * 0.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(whiskerX, whiskerY + i * radius * 0.06);
    ctx.lineTo(whiskerX + whiskerLen, whiskerY + i * radius * 0.1);
    ctx.stroke();
  }

  // Name label (only for larger cats)
  if (radius >= 30) {
    ctx.fillStyle = '#00000088';
    ctx.font = `bold ${Math.min(radius * 0.3, 14)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(cat.name, 0, radius - radius * 0.1);
  }
}

// Settings gear button position
export const SETTINGS_BUTTON = { x: GAME_WIDTH - 30, y: GAME_HEIGHT - 30, radius: 16 };

// Settings panel layout
const PANEL_W = 280;
const PANEL_H = 300;
const PANEL_X = (GAME_WIDTH - PANEL_W) / 2;
const PANEL_Y = (GAME_HEIGHT - PANEL_H) / 2;
const SLIDER_X = PANEL_X + 30;
const SLIDER_W = PANEL_W - 60;
const SLIDER_H = 8;
const BGM_SLIDER_Y = PANEL_Y + 80;
const SE_SLIDER_Y = PANEL_Y + 130;
const BTN_W = 200;
const BTN_H = 36;
const BTN_X = PANEL_X + (PANEL_W - BTN_W) / 2;
const RESTART_BTN_Y = PANEL_Y + 180;
const SCREENSHOT_BTN_Y = PANEL_Y + 230;

export const SETTINGS_LAYOUT = {
  panelX: PANEL_X, panelY: PANEL_Y, panelW: PANEL_W, panelH: PANEL_H,
  sliderX: SLIDER_X, sliderW: SLIDER_W, sliderH: SLIDER_H,
  bgmSliderY: BGM_SLIDER_Y, seSliderY: SE_SLIDER_Y,
  closeX: PANEL_X + PANEL_W - 30, closeY: PANEL_Y + 10, closeSize: 20,
  btnX: BTN_X, btnW: BTN_W, btnH: BTN_H,
  restartBtnY: RESTART_BTN_Y, screenshotBtnY: SCREENSHOT_BTN_Y,
};

function drawSettingsButton(ctx: CanvasRenderingContext2D): void {
  const { x, y, radius } = SETTINGS_BUTTON;
  // Gear icon
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#FFFFFF66';
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // Gear teeth
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  const teethCount = 6;
  const innerR = 5;
  const outerR = 10;
  for (let i = 0; i < teethCount; i++) {
    const angle = (Math.PI * 2 * i) / teethCount;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
    ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

export function drawSettingsPanel(ctx: CanvasRenderingContext2D, bgmVol: number, seVol: number): void {
  // Dim background
  ctx.fillStyle = '#000000AA';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Panel
  ctx.fillStyle = '#2a2a4e';
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 2;
  const r = 12;
  ctx.beginPath();
  ctx.moveTo(PANEL_X + r, PANEL_Y);
  ctx.lineTo(PANEL_X + PANEL_W - r, PANEL_Y);
  ctx.arcTo(PANEL_X + PANEL_W, PANEL_Y, PANEL_X + PANEL_W, PANEL_Y + r, r);
  ctx.lineTo(PANEL_X + PANEL_W, PANEL_Y + PANEL_H - r);
  ctx.arcTo(PANEL_X + PANEL_W, PANEL_Y + PANEL_H, PANEL_X + PANEL_W - r, PANEL_Y + PANEL_H, r);
  ctx.lineTo(PANEL_X + r, PANEL_Y + PANEL_H);
  ctx.arcTo(PANEL_X, PANEL_Y + PANEL_H, PANEL_X, PANEL_Y + PANEL_H - r, r);
  ctx.lineTo(PANEL_X, PANEL_Y + r);
  ctx.arcTo(PANEL_X, PANEL_Y, PANEL_X + r, PANEL_Y, r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Title
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Settings', GAME_WIDTH / 2, PANEL_Y + 30);

  // Close button (x)
  const { closeX, closeY, closeSize } = SETTINGS_LAYOUT;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(closeX, closeY);
  ctx.lineTo(closeX + closeSize, closeY + closeSize);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(closeX + closeSize, closeY);
  ctx.lineTo(closeX, closeY + closeSize);
  ctx.stroke();

  // BGM slider
  drawSlider(ctx, 'BGM', SLIDER_X, BGM_SLIDER_Y, SLIDER_W, SLIDER_H, bgmVol);

  // SE slider
  drawSlider(ctx, 'SE', SLIDER_X, SE_SLIDER_Y, SLIDER_W, SLIDER_H, seVol);

  // Restart button
  drawButton(ctx, 'やり直す', BTN_X, RESTART_BTN_Y, BTN_W, BTN_H, '#e74c3c');

  // Screenshot button
  drawButton(ctx, 'スクリーンショット', BTN_X, SCREENSHOT_BTN_Y, BTN_W, BTN_H, '#3498db');
}

function drawButton(
  ctx: CanvasRenderingContext2D,
  label: string, x: number, y: number, w: number, h: number, color: string,
): void {
  const r = 8;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2);
}

function drawSlider(
  ctx: CanvasRenderingContext2D,
  label: string, x: number, y: number, w: number, h: number, value: number,
): void {
  // Label
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText(label, x, y - 6);

  // Percentage
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.round(value * 100)}%`, x + w, y - 6);

  // Track
  ctx.fillStyle = '#555577';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();

  // Filled portion
  const filledW = w * value;
  if (filledW > 0) {
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.roundRect(x, y, filledW, h, h / 2);
    ctx.fill();
  }

  // Thumb
  const thumbX = x + filledW;
  const thumbR = h + 2;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(thumbX, y + h / 2, thumbR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 2;
  ctx.stroke();
}

export function render(
  ctx: CanvasRenderingContext2D,
  bodies: Matter.Body[],
  state: GameState,
  cursorX: number,
  currentLevel: number,
  nextLevel: number,
  score: number,
  highScore: number,
  particles: Particle[],
  settingsOpen: boolean,
  bgmVol: number,
  seVol: number,
  rankingData?: RankingRenderData,
): void {
  // Background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Container background
  ctx.fillStyle = '#16213e';
  ctx.fillRect(CONTAINER_X, CONTAINER_Y, CONTAINER_WIDTH, CONTAINER_HEIGHT);

  // Container walls
  ctx.fillStyle = '#4a3728';
  // Left wall
  ctx.fillRect(CONTAINER_X - WALL_THICKNESS, CONTAINER_Y, WALL_THICKNESS, CONTAINER_HEIGHT + WALL_THICKNESS);
  // Right wall
  ctx.fillRect(CONTAINER_X + CONTAINER_WIDTH, CONTAINER_Y, WALL_THICKNESS, CONTAINER_HEIGHT + WALL_THICKNESS);
  // Bottom wall
  ctx.fillRect(CONTAINER_X - WALL_THICKNESS, CONTAINER_Y + CONTAINER_HEIGHT, CONTAINER_WIDTH + WALL_THICKNESS * 2, WALL_THICKNESS);

  // Death line
  ctx.strokeStyle = '#FF444466';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 4]);
  ctx.beginPath();
  ctx.moveTo(CONTAINER_X, DEATH_LINE_Y);
  ctx.lineTo(CONTAINER_X + CONTAINER_WIDTH, DEATH_LINE_Y);
  ctx.stroke();
  ctx.setLineDash([]);

  if (state === 'title') {
    drawTitleScreen(ctx);
    return;
  }

  if (state === 'nickname') {
    drawNicknameScreen(ctx, score, rankingData?.submitting ?? false);
    return;
  }

  if (state === 'ranking' && rankingData) {
    drawRankingScreen(ctx, rankingData);
    if (rankingData.selectedScreenshot) {
      drawScreenshotModal(ctx, rankingData.selectedScreenshot);
    }
    return;
  }

  // Drop guide line
  if (state === 'playing') {
    ctx.strokeStyle = '#FFFFFF33';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cursorX, DROP_Y);
    ctx.lineTo(cursorX, CONTAINER_Y + CONTAINER_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Preview of current cat at drop position
    const previewCat = CATS[currentLevel];
    ctx.save();
    ctx.translate(cursorX, DROP_Y);
    drawCatFace(ctx, currentLevel, previewCat.radius);
    ctx.restore();
  }

  // Draw cat bodies
  for (const body of bodies) {
    if (body.isStatic) continue;
    const plugin = body.plugin as Record<string, unknown>;
    if (plugin.catLevel === undefined) continue;

    const level = plugin.catLevel as number;
    const cat = CATS[level];

    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);
    drawCatFace(ctx, level, cat.radius);
    ctx.restore();
  }

  // Particles
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Score display
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`SCORE: ${score}`, 10, 10);

  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#AAAAAA';
  ctx.fillText(`BEST: ${highScore}`, 10, 34);

  // Next cat preview (top right)
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('NEXT', GAME_WIDTH - 15, 10);

  const nextCat = CATS[nextLevel];
  ctx.save();
  ctx.translate(GAME_WIDTH - 40, 50);
  drawCatFace(ctx, nextLevel, Math.min(nextCat.radius, 18));
  ctx.restore();

  // Settings button
  drawSettingsButton(ctx);

  // Game over overlay
  if (state === 'gameover') {
    drawGameOverScreen(ctx, score, highScore);
  }

  // Settings panel (drawn on top of everything)
  if (settingsOpen) {
    drawSettingsPanel(ctx, bgmVol, seVol);
  }
}

function drawTitleScreen(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#00000088';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 40px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('にゃんこゲーム', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80);

  // Draw a cute cat icon
  ctx.save();
  ctx.translate(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
  drawCatFace(ctx, 0, 40);
  ctx.restore();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '20px sans-serif';
  ctx.fillText('タップしてスタート', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100);

  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#AAAAAA';
  ctx.fillText('同じ猫同士をくっつけて', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 140);
  ctx.fillText('大きな猫を作ろう!', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 160);

  // Ranking button
  const rbtn = TITLE_RANKING_BTN;
  ctx.fillStyle = '#3498db';
  ctx.beginPath();
  ctx.roundRect(rbtn.x, rbtn.y, rbtn.w, rbtn.h, 8);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ランキング', rbtn.x + rbtn.w / 2, rbtn.y + rbtn.h / 2);
}

function drawGameOverScreen(ctx: CanvasRenderingContext2D, score: number, highScore: number): void {
  ctx.fillStyle = '#000000AA';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.fillStyle = '#FF6666';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '24px sans-serif';
  ctx.fillText(`SCORE: ${score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2);

  if (score >= highScore && score > 0) {
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('NEW BEST!', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 35);
  }

  ctx.fillStyle = '#AAAAAA';
  ctx.font = '18px sans-serif';
  ctx.fillText('タップして続ける', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80);
}

function drawNicknameScreen(ctx: CanvasRenderingContext2D, score: number, submitting: boolean): void {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('スコア登録', GAME_WIDTH / 2, GAME_HEIGHT * 0.2);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '22px sans-serif';
  ctx.fillText(`SCORE: ${score}`, GAME_WIDTH / 2, GAME_HEIGHT * 0.3);

  ctx.fillStyle = '#AAAAAA';
  ctx.font = '14px sans-serif';
  ctx.fillText('ニックネームを入力してください', GAME_WIDTH / 2, GAME_HEIGHT * 0.4);

  // Submit button
  const btn = NICK_SUBMIT_BTN;
  ctx.fillStyle = submitting ? '#555555' : '#e67e22';
  ctx.beginPath();
  ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 8);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(submitting ? '送信中...' : '送信', btn.x + btn.w / 2, btn.y + btn.h / 2);
}

function drawRankingScreen(ctx: CanvasRenderingContext2D, data: RankingRenderData): void {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Title
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ランキング', GAME_WIDTH / 2, RANKING_TITLE_Y);

  if (data.loading) {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px sans-serif';
    ctx.fillText('読み込み中...', GAME_WIDTH / 2, GAME_HEIGHT / 2);
    drawRankingButtons(ctx);
    return;
  }

  if (data.error) {
    ctx.fillStyle = '#FF6666';
    ctx.font = '18px sans-serif';
    ctx.fillText('読み込みに失敗しました', GAME_WIDTH / 2, GAME_HEIGHT / 2);
    drawRankingButtons(ctx);
    return;
  }

  if (data.scores.length === 0) {
    ctx.fillStyle = '#AAAAAA';
    ctx.font = '18px sans-serif';
    ctx.fillText('まだスコアがありません', GAME_WIDTH / 2, GAME_HEIGHT / 2);
    drawRankingButtons(ctx);
    return;
  }

  // Clipping region for scrollable list
  ctx.save();
  ctx.beginPath();
  ctx.rect(10, RANKING_LIST_Y, GAME_WIDTH - 20, RANKING_LIST_H);
  ctx.clip();

  const startY = RANKING_LIST_Y - data.scrollOffset;

  for (let i = 0; i < data.scores.length; i++) {
    const entry = data.scores[i];
    const rowY = startY + i * RANKING_ROW_H;

    // Skip rows outside visible area
    if (rowY + RANKING_ROW_H < RANKING_LIST_Y || rowY > RANKING_LIST_Y + RANKING_LIST_H) continue;

    // Row background
    ctx.fillStyle = i % 2 === 0 ? '#16213e' : '#1a2744';
    ctx.fillRect(10, rowY, GAME_WIDTH - 20, RANKING_ROW_H - 2);

    // Rank
    ctx.fillStyle = i < 3 ? '#FFD700' : '#FFFFFF';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${i + 1}.`, 20, rowY + RANKING_ROW_H / 2);

    // Nickname
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '15px sans-serif';
    ctx.fillText(entry.nickname, 55, rowY + RANKING_ROW_H / 2);

    // Score
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${entry.score}`, GAME_WIDTH - 70, rowY + RANKING_ROW_H / 2);

    // Thumbnail
    const thumb = getThumbnail(entry.screenshotUrl);
    if (thumb) {
      const thumbH = RANKING_ROW_H - 8;
      const thumbW = thumbH * (GAME_WIDTH / GAME_HEIGHT);
      ctx.drawImage(thumb, GAME_WIDTH - 55, rowY + 4, thumbW, thumbH);
      ctx.strokeStyle = '#FFD70066';
      ctx.lineWidth = 1;
      ctx.strokeRect(GAME_WIDTH - 55, rowY + 4, thumbW, thumbH);
    }
  }

  ctx.restore();

  // Scroll indicator
  if (data.scores.length * RANKING_ROW_H > RANKING_LIST_H) {
    const totalH = data.scores.length * RANKING_ROW_H;
    const barH = Math.max(20, (RANKING_LIST_H / totalH) * RANKING_LIST_H);
    const barY = RANKING_LIST_Y + (data.scrollOffset / (totalH - RANKING_LIST_H)) * (RANKING_LIST_H - barH);
    ctx.fillStyle = '#FFFFFF33';
    ctx.fillRect(GAME_WIDTH - 14, barY, 4, barH);
  }

  drawRankingButtons(ctx);
}

function drawRankingButtons(ctx: CanvasRenderingContext2D): void {
  // Back button
  const back = RANKING_BACK_BTN;
  ctx.fillStyle = '#555555';
  ctx.beginPath();
  ctx.roundRect(back.x, back.y, back.w, back.h, 8);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('戻る', back.x + back.w / 2, back.y + back.h / 2);

  // Play again button
  const play = RANKING_PLAY_BTN;
  ctx.fillStyle = '#e67e22';
  ctx.beginPath();
  ctx.roundRect(play.x, play.y, play.w, play.h, 8);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('もう一度', play.x + play.w / 2, play.y + play.h / 2);
}

function drawScreenshotModal(
  ctx: CanvasRenderingContext2D,
  screenshot: { url: string; img: HTMLImageElement | null },
): void {
  // Dim background
  ctx.fillStyle = '#000000DD';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  if (!screenshot.img || !screenshot.img.complete) {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('読み込み中...', GAME_WIDTH / 2, GAME_HEIGHT / 2);
  } else {
    // Draw screenshot centered, scaled to fit
    const img = screenshot.img;
    const maxW = GAME_WIDTH - 40;
    const maxH = GAME_HEIGHT - 100;
    const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const x = (GAME_WIDTH - w) / 2;
    const y = (GAME_HEIGHT - h) / 2;
    ctx.drawImage(img, x, y, w, h);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
  }

  // Close hint
  ctx.fillStyle = '#AAAAAA';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('タップして閉じる', GAME_WIDTH / 2, GAME_HEIGHT - 20);
}
