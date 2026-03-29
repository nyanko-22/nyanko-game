import { CONTAINER_X, CONTAINER_WIDTH, GAME_WIDTH, GAME_HEIGHT } from './constants';

export interface InputState {
  cursorX: number;
  dropped: boolean;
}

const state: InputState = {
  cursorX: CONTAINER_X + CONTAINER_WIDTH / 2,
  dropped: false,
};

let suppressNextDrop = false;
let spaceHeld = false;

export function suppressDrop(): void {
  suppressNextDrop = true;
}

function canvasToGame(canvas: HTMLCanvasElement, clientX: number, clientY: number): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * GAME_WIDTH,
    y: ((clientY - rect.top) / rect.height) * GAME_HEIGHT,
  };
}

function clampX(x: number, catRadius: number): number {
  const minX = CONTAINER_X + catRadius;
  const maxX = CONTAINER_X + CONTAINER_WIDTH - catRadius;
  return Math.max(minX, Math.min(maxX, x));
}

export function initInput(canvas: HTMLCanvasElement, catRadiusFn: () => number): void {
  canvas.addEventListener('mousemove', (e) => {
    const pos = canvasToGame(canvas, e.clientX, e.clientY);
    state.cursorX = clampX(pos.x, catRadiusFn());
  });

  canvas.addEventListener('click', () => {
    state.dropped = true;
  });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const pos = canvasToGame(canvas, touch.clientX, touch.clientY);
    state.cursorX = clampX(pos.x, catRadiusFn());
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    state.dropped = true;
  }, { passive: false });

  // Debug: hold Space to continuously drop
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); spaceHeld = true; }
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') spaceHeld = false;
  });
}

export function consumeDrop(): boolean {
  if (suppressNextDrop) {
    suppressNextDrop = false;
    state.dropped = false;
    return false;
  }
  if (state.dropped) {
    state.dropped = false;
    return true;
  }
  return false;
}

export function getCursorX(): number {
  return state.cursorX;
}

export function isSpaceHeld(): boolean {
  return spaceHeld;
}
