import { CATS, DROP_Y, DROP_COOLDOWN_MS, MAX_DROP_LEVEL, DEATH_LINE_Y, DEATH_GRACE_FRAMES, CONTAINER_X, CONTAINER_WIDTH } from './constants';
import { createCat } from './cats';
import { initPhysics, stepPhysics, addBody, getAllBodies, onMerge, clearCats, type MergeEvent } from './physics';
import { initInput, consumeDrop, getCursorX } from './input';
import { createCanvas, render } from './renderer';
import { addScore, getScore, resetScore, getHighScore, saveHighScore } from './score';
import { playMeow, ensureAudioReady } from './sound';

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

type GameState = 'title' | 'playing' | 'gameover';

let state: GameState = 'title';
let currentLevel = 0;
let nextLevel = 0;
let lastDropTime = 0;
let particles: Particle[] = [];
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let shakeOffset = 0;
let shakeDecay = 0;

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
  playMeow(event.newLevel);
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
}

function gameLoop(timestamp: number): void {
  requestAnimationFrame(gameLoop);

  if (state === 'title') {
    if (consumeDrop()) {
      startGame();
      return;
    }
    const bodies = getAllBodies();
    render(ctx, bodies, state, getCursorX(), currentLevel, getScore(), getHighScore(), particles);
    return;
  }

  if (state === 'gameover') {
    if (consumeDrop()) {
      startGame();
      return;
    }
    const bodies = getAllBodies();
    render(ctx, bodies, state, getCursorX(), currentLevel, getScore(), getHighScore(), particles);
    return;
  }

  // Playing state
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

  render(ctx, bodies, state, getCursorX(), currentLevel, getScore(), getHighScore(), particles);

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

  // Initial cursor position
  const initialX = CONTAINER_X + CONTAINER_WIDTH / 2;
  void initialX;

  requestAnimationFrame(gameLoop);
}
