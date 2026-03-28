import { CATS, DROP_Y, DROP_COOLDOWN_MS, MAX_DROP_LEVEL, DEATH_LINE_Y, DEATH_GRACE_FRAMES, GAME_WIDTH, GAME_HEIGHT, SCREENSHOT_QUALITY } from './constants';
import { createCat } from './cats';
import { initPhysics, stepPhysics, addBody, getAllBodies, onMerge, clearCats, type MergeEvent } from './physics';
import { initInput, consumeDrop, getCursorX, suppressDrop } from './input';
import { createCanvas, render, SETTINGS_BUTTON, SETTINGS_LAYOUT, NICKNAME_LAYOUT, RANKING_LAYOUT, TITLE_LAYOUT, type GameState, type RankingRenderData } from './renderer';
import { addScore, getScore, resetScore, getHighScore, saveHighScore } from './score';
import { playMeow, playGameOver, ensureAudioReady, startBgm, stopBgm, getBgmVolume, getSeVolume, setBgmVolume, setSeVolume } from './sound';
import { submitScore } from './firebase';
import { showNicknameInput, hideNicknameInput, triggerSubmit } from './nickname';
import { loadRanking, getRankingData, scrollRanking, selectScreenshot, closeScreenshot, resetRanking } from './ranking';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  decay: number;
}

let state: GameState = 'title';
let currentLevel = 0;
let nextLevel = 0;
let lastDropTime = 0;
let particles: Particle[] = [];
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let shakeOffset = 0;
let shakeDecay = 0;
let settingsOpen = false;
let draggingSlider: 'bgm' | 'se' | null = null;
let gameOverScreenshotBlob: Blob | null = null;
let submitting = false;

function pickLevel(): number {
  const weights = [35, 25, 20, 12, 8];
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i <= MAX_DROP_LEVEL; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return 0;
}

function spawnParticles(x: number, y: number, color: string): void {
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.3;
    const speed = 1 + Math.random() * 3;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 3,
      color,
      life: 1,
      decay: 0.02 + Math.random() * 0.02,
    });
  }
}

function updateParticles(): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05;
    p.life -= p.decay;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function handleMerge(event: MergeEvent): void {
  const cat = CATS[event.newLevel];
  addScore(cat.score);
  spawnParticles(event.x, event.y, cat.color);
  shakeOffset = 3 + event.newLevel * 0.5;
  shakeDecay = 0.85;
  playMeow(event.fromLevel, event.newLevel);
}

function startGame(): void {
  ensureAudioReady();
  state = 'playing';
  resetScore();
  clearCats();
  particles = [];
  currentLevel = pickLevel();
  nextLevel = pickLevel();
  lastDropTime = 0;
  startBgm();
}

// Convert canvas client coordinates to game coordinates
function canvasToGame(clientX: number, clientY: number): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * GAME_WIDTH,
    y: ((clientY - rect.top) / rect.height) * GAME_HEIGHT,
  };
}

function isInSettingsButton(gx: number, gy: number): boolean {
  const dx = gx - SETTINGS_BUTTON.x;
  const dy = gy - SETTINGS_BUTTON.y;
  return dx * dx + dy * dy <= SETTINGS_BUTTON.radius * SETTINGS_BUTTON.radius;
}

function isInCloseButton(gx: number, gy: number): boolean {
  const { closeX, closeY, closeSize } = SETTINGS_LAYOUT;
  return gx >= closeX && gx <= closeX + closeSize && gy >= closeY && gy <= closeY + closeSize;
}

function hitSlider(gx: number, gy: number): 'bgm' | 'se' | null {
  const { sliderX, sliderW, bgmSliderY, seSliderY, sliderH } = SETTINGS_LAYOUT;
  const margin = 14;
  if (gx >= sliderX - margin && gx <= sliderX + sliderW + margin) {
    if (gy >= bgmSliderY - margin && gy <= bgmSliderY + sliderH + margin) return 'bgm';
    if (gy >= seSliderY - margin && gy <= seSliderY + sliderH + margin) return 'se';
  }
  return null;
}

function hitButton(gx: number, gy: number, btnY: number): boolean {
  const { btnX, btnW, btnH } = SETTINGS_LAYOUT;
  return gx >= btnX && gx <= btnX + btnW && gy >= btnY && gy <= btnY + btnH;
}

function takeScreenshot(): void {
  // Re-render without settings panel for clean screenshot
  const wasOpen = settingsOpen;
  settingsOpen = false;
  const bodies = getAllBodies();
  render(ctx, bodies, state, getCursorX(), currentLevel, nextLevel, getScore(), getHighScore(), particles, false, getBgmVolume(), getSeVolume());
  settingsOpen = wasOpen;

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nyanko-game-${getScore()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

function updateSliderValue(gx: number): void {
  const { sliderX, sliderW } = SETTINGS_LAYOUT;
  const value = Math.max(0, Math.min(1, (gx - sliderX) / sliderW));
  if (draggingSlider === 'bgm') {
    setBgmVolume(value);
  } else if (draggingSlider === 'se') {
    setSeVolume(value);
  }
}

function captureGameOverScreenshot(): void {
  // Render clean frame for screenshot
  const bodies = getAllBodies();
  render(ctx, bodies, 'gameover', getCursorX(), currentLevel, nextLevel, getScore(), getHighScore(), particles, false, getBgmVolume(), getSeVolume());
  canvas.toBlob((blob) => {
    gameOverScreenshotBlob = blob;
  }, 'image/jpeg', SCREENSHOT_QUALITY);
}

function goToNickname(): void {
  state = 'nickname';
  submitting = false;
  showNicknameInput(canvas, (nickname) => {
    handleNicknameSubmit(nickname);
  });
}

async function handleNicknameSubmit(nickname: string): Promise<void> {
  if (submitting) return;
  submitting = true;
  hideNicknameInput();

  try {
    if (gameOverScreenshotBlob) {
      await submitScore(nickname, getScore(), gameOverScreenshotBlob);
    }
  } catch {
    // Continue to ranking even on upload error
  }

  submitting = false;
  gameOverScreenshotBlob = null;
  state = 'ranking';
  resetRanking();
  loadRanking();
}

function goToRankingFromTitle(): void {
  state = 'ranking';
  resetRanking();
  loadRanking();
}

function setupRankingInput(): void {
  const handleDown = (clientX: number, clientY: number): boolean => {
    const { x: gx, y: gy } = canvasToGame(clientX, clientY);

    if (state === 'nickname') {
      const btn = NICKNAME_LAYOUT.submitBtn;
      if (gx >= btn.x && gx <= btn.x + btn.w && gy >= btn.y && gy <= btn.y + btn.h) {
        triggerSubmit();
        return true;
      }
      return false;
    }

    if (state === 'ranking') {
      const rd = getRankingData();

      // Screenshot modal open - close on tap
      if (rd.selectedScreenshot) {
        closeScreenshot();
        return true;
      }

      // Back button
      const back = RANKING_LAYOUT.backBtn;
      if (gx >= back.x && gx <= back.x + back.w && gy >= back.y && gy <= back.y + back.h) {
        state = 'title';
        return true;
      }

      // Play again button
      const play = RANKING_LAYOUT.playBtn;
      if (gx >= play.x && gx <= play.x + play.w && gy >= play.y && gy <= play.y + play.h) {
        startGame();
        return true;
      }

      // Tap on ranking row to view screenshot
      if (gy >= RANKING_LAYOUT.listY && gy < RANKING_LAYOUT.listY + RANKING_LAYOUT.listH) {
        const rowIndex = Math.floor((gy - RANKING_LAYOUT.listY + rd.scrollOffset) / RANKING_LAYOUT.rowH);
        if (rowIndex >= 0 && rowIndex < rd.scores.length) {
          selectScreenshot(rd.scores[rowIndex].screenshotUrl);
          return true;
        }
      }

      return true;
    }

    if (state === 'title') {
      const rbtn = TITLE_LAYOUT.rankingBtn;
      if (gx >= rbtn.x && gx <= rbtn.x + rbtn.w && gy >= rbtn.y && gy <= rbtn.y + rbtn.h) {
        goToRankingFromTitle();
        return true;
      }
    }

    return false;
  };

  canvas.addEventListener('mousedown', (e) => {
    if (handleDown(e.clientX, e.clientY)) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);

  canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    if (handleDown(touch.clientX, touch.clientY)) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, { capture: true, passive: false });

  // Scroll handling for ranking
  canvas.addEventListener('wheel', (e) => {
    if (state === 'ranking' && !getRankingData().selectedScreenshot) {
      scrollRanking(e.deltaY);
      e.preventDefault();
    }
  }, { passive: false });

  // Touch scroll for ranking
  let touchStartY = 0;
  canvas.addEventListener('touchstart', (e) => {
    if (state === 'ranking') {
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    if (state === 'ranking' && !getRankingData().selectedScreenshot) {
      const touchY = e.touches[0].clientY;
      const rect = canvas.getBoundingClientRect();
      const delta = (touchStartY - touchY) / rect.height * GAME_HEIGHT;
      scrollRanking(delta);
      touchStartY = touchY;
      e.preventDefault();
    }
  }, { passive: false });
}

function setupSettingsInput(): void {
  const handleDown = (clientX: number, clientY: number) => {
    const { x: gx, y: gy } = canvasToGame(clientX, clientY);

    if (settingsOpen) {
      // Close button
      if (isInCloseButton(gx, gy)) {
        settingsOpen = false;
        return true;
      }
      // Restart button
      if (hitButton(gx, gy, SETTINGS_LAYOUT.restartBtnY)) {
        settingsOpen = false;
        stopBgm();
        startGame();
        return true;
      }
      // Screenshot button
      if (hitButton(gx, gy, SETTINGS_LAYOUT.screenshotBtnY)) {
        takeScreenshot();
        return true;
      }
      // Slider drag start
      const slider = hitSlider(gx, gy);
      if (slider) {
        draggingSlider = slider;
        updateSliderValue(gx);
        return true;
      }
      // Click outside panel closes it
      const { panelX, panelY, panelW, panelH } = SETTINGS_LAYOUT;
      if (gx < panelX || gx > panelX + panelW || gy < panelY || gy > panelY + panelH) {
        settingsOpen = false;
        return true;
      }
      return true; // Consume all clicks when settings open
    }

    // Settings button
    if (isInSettingsButton(gx, gy)) {
      settingsOpen = true;
      return true;
    }
    return false;
  };

  const handleMove = (clientX: number, _clientY: number) => {
    if (draggingSlider) {
      const { x: gx } = canvasToGame(clientX, _clientY);
      updateSliderValue(gx);
    }
  };

  const handleUp = () => {
    draggingSlider = null;
  };

  canvas.addEventListener('mousedown', (e) => {
    if (handleDown(e.clientX, e.clientY)) {
      e.stopPropagation();
      suppressDrop();
    }
  }, true);

  canvas.addEventListener('mousemove', (e) => {
    handleMove(e.clientX, e.clientY);
  });

  canvas.addEventListener('mouseup', handleUp);

  canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    if (handleDown(touch.clientX, touch.clientY)) {
      e.preventDefault();
      e.stopPropagation();
      suppressDrop();
    }
  }, { capture: true, passive: false });

  canvas.addEventListener('touchmove', (e) => {
    if (draggingSlider) {
      e.preventDefault();
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    }
  }, { passive: false });

  canvas.addEventListener('touchend', handleUp);
}

function gameLoop(timestamp: number): void {
  requestAnimationFrame(gameLoop);

  const bgmVol = getBgmVolume();
  const seVol = getSeVolume();

  if (state === 'title') {
    if (!settingsOpen && consumeDrop()) {
      startGame();
      return;
    }
    const bodies = getAllBodies();
    render(ctx, bodies, state, getCursorX(), currentLevel, nextLevel, getScore(), getHighScore(), particles, settingsOpen, bgmVol, seVol);
    return;
  }

  if (state === 'gameover') {
    if (!settingsOpen && consumeDrop()) {
      goToNickname();
      return;
    }
    const bodies = getAllBodies();
    render(ctx, bodies, state, getCursorX(), currentLevel, nextLevel, getScore(), getHighScore(), particles, settingsOpen, bgmVol, seVol);
    return;
  }

  if (state === 'nickname') {
    const rd: RankingRenderData = { ...getRankingData(), submitting };
    render(ctx, getAllBodies(), state, 0, 0, 0, getScore(), getHighScore(), [], false, bgmVol, seVol, rd);
    return;
  }

  if (state === 'ranking') {
    const rd: RankingRenderData = { ...getRankingData(), submitting: false };
    render(ctx, getAllBodies(), state, 0, 0, 0, getScore(), getHighScore(), [], false, bgmVol, seVol, rd);
    return;
  }

  // Playing state
  if (!settingsOpen) {
    const dropped = consumeDrop();
    const now = timestamp;

    if (dropped && now - lastDropTime > DROP_COOLDOWN_MS) {
      const x = getCursorX();
      const cat = createCat(currentLevel, x, DROP_Y);
      addBody(cat);
      lastDropTime = now;
      currentLevel = nextLevel;
      nextLevel = pickLevel();
    }
  } else {
    consumeDrop(); // Discard drops while settings open
  }

  stepPhysics(1000 / 60);

  // Death line check
  const bodies = getAllBodies();
  for (const body of bodies) {
    if (body.isStatic) continue;
    const plugin = body.plugin as Record<string, unknown>;
    if (plugin.catLevel === undefined) continue;
    if (plugin.markedForRemoval) continue;

    if (body.position.y - (CATS[plugin.catLevel as number].radius) < DEATH_LINE_Y) {
      if (plugin.graceFrames === undefined) plugin.graceFrames = 0;
      (plugin.graceFrames as number)++;
      if ((plugin.graceFrames as number) > DEATH_GRACE_FRAMES) {
        state = 'gameover';
        saveHighScore();
        playGameOver();
        stopBgm();
        // Capture screenshot for ranking
        captureGameOverScreenshot();
        break;
      }
    } else {
      plugin.graceFrames = 0;
    }
  }

  updateParticles();

  // Screen shake
  if (shakeOffset > 0.1) {
    ctx.save();
    const sx = (Math.random() - 0.5) * shakeOffset * 2;
    const sy = (Math.random() - 0.5) * shakeOffset * 2;
    ctx.translate(sx, sy);
    shakeOffset *= shakeDecay;
  }

  render(ctx, bodies, state, getCursorX(), currentLevel, nextLevel, getScore(), getHighScore(), particles, settingsOpen, bgmVol, seVol);

  if (shakeOffset > 0.1) {
    ctx.restore();
  }
}

export function initGame(): void {
  canvas = createCanvas();
  const app = document.getElementById('app')!;
  app.appendChild(canvas);

  ctx = canvas.getContext('2d')!;

  initPhysics();
  onMerge(handleMerge);
  initInput(canvas, () => CATS[currentLevel].radius);
  setupSettingsInput();
  setupRankingInput();

  requestAnimationFrame(gameLoop);
}
