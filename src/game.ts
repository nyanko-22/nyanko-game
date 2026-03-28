import { CATS, DROP_Y, DROP_COOLDOWN_MS, MAX_DROP_LEVEL, DEATH_LINE_Y, DEATH_GRACE_FRAMES, SCREENSHOT_QUALITY } from './constants';
import { createCat } from './cats';
import { initPhysics, stepPhysics, addBody, getAllBodies, onMerge, clearCats, type MergeEvent } from './physics';
import { initInput, consumeDrop, getCursorX } from './input';
import { createCanvas, render, type GameState } from './renderer';
import { showSettingsScreen, hideSettingsScreen } from './screens/settings';
import { showHomeScreen, hideHomeScreen } from './screens/home';
import { showRankingScreen, hideRankingScreen, updateRankingScreen } from './screens/ranking';
import { showGameOverScreen, hideGameOverScreen } from './screens/gameover';
import { showNicknameScreen, hideNicknameScreen, getLastNickname } from './screens/nickname';
import { initHud, updateHud, showHud, hideHud } from './screens/hud';
import { addScore, getScore, resetScore, getHighScore, saveHighScore } from './score';
import { playMeow, playGameOver, ensureAudioReady, startBgm, stopBgm } from './sound';
import { submitScore } from './firebase';
import { loadRanking, getRankingData, resetRanking } from './ranking';

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
  showHud();
  updateHud(0, getHighScore(), nextLevel);
}


function openHomeScreen(): void {
  showHomeScreen({
    onStart: () => {
      hideHomeScreen();
      startGame();
    },
    onRanking: () => {
      hideHomeScreen();
      goToRankingFromTitle();
    },
    onSettings: () => openSettings(),
  });
}

export function openSettings(fromHud = false): void {
  settingsOpen = true;
  showSettingsScreen({
    onClose: () => {
      settingsOpen = false;
      hideSettingsScreen();
    },
    onRestart: () => {
      settingsOpen = false;
      hideSettingsScreen();
      stopBgm();
      startGame();
    },
    onScreenshot: () => {
      takeScreenshot();
    },
    ...(fromHud ? {
      onGoHome: () => {
        settingsOpen = false;
        hideSettingsScreen();
        stopBgm();
        hideHud();
        state = 'title';
        openHomeScreen();
      },
    } : {}),
  });
}

function takeScreenshot(): void {
  const bodies = getAllBodies();
  render(ctx, bodies, state, getCursorX(), currentLevel, particles);

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


function captureGameOverScreenshot(): void {
  const bodies = getAllBodies();
  render(ctx, bodies, 'gameover', getCursorX(), currentLevel, particles);
  canvas.toBlob((blob) => {
    gameOverScreenshotBlob = blob;
  }, 'image/jpeg', SCREENSHOT_QUALITY);
}

function goToNickname(): void {
  state = 'nickname';
  submitting = false;
  showNicknameScreen(getLastNickname(), {
    onSubmit: (nickname) => {
      hideNicknameScreen();
      handleNicknameSubmit(nickname);
    },
  });
}

async function handleNicknameSubmit(nickname: string): Promise<void> {
  if (submitting) return;
  submitting = true;

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
  showRankingScreen(getRankingData(), {
    onBack: () => {
      hideRankingScreen();
      state = 'title';
      openHomeScreen();
    },
    onPlayAgain: () => {
      hideRankingScreen();
      startGame();
    },
  });
}

function goToRankingFromTitle(): void {
  state = 'ranking';
  resetRanking();
  loadRanking();
  showRankingScreen(getRankingData(), {
    onBack: () => {
      hideRankingScreen();
      state = 'title';
      openHomeScreen();
    },
    onPlayAgain: () => {
      hideRankingScreen();
      startGame();
    },
  });
}



function gameLoop(timestamp: number): void {
  requestAnimationFrame(gameLoop);

  if (state === 'title') {
    render(ctx, getAllBodies(), state, getCursorX(), currentLevel, particles);
    return;
  }

  if (state === 'gameover') {
    render(ctx, getAllBodies(), state, getCursorX(), currentLevel, particles);
    return;
  }

  if (state === 'nickname') {
    render(ctx, getAllBodies(), state, 0, 0, []);
    return;
  }

  if (state === 'ranking') {
    updateRankingScreen(getRankingData());
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
        hideHud();
        captureGameOverScreenshot();
        const finalScore = getScore();
        const isNewBest = finalScore >= getHighScore() && finalScore > 0;
        showGameOverScreen(finalScore, isNewBest, {
          onSubmit: () => {
            hideGameOverScreen();
            goToNickname();
          },
        });
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

  updateHud(getScore(), getHighScore(), nextLevel);
  render(ctx, bodies, 'playing', getCursorX(), currentLevel, particles);

  if (shakeOffset > 0.1) {
    ctx.restore();
  }
}

export function initGame(): void {
  canvas = createCanvas();
  const wrapper = document.getElementById('game-wrapper')!;
  wrapper.appendChild(canvas);

  ctx = canvas.getContext('2d')!;

  initPhysics();
  onMerge(handleMerge);
  initInput(canvas, () => CATS[currentLevel].radius);
  initHud({ onSettings: () => openSettings(true) });
  openHomeScreen();

  requestAnimationFrame(gameLoop);
}
