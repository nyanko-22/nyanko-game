import { GAME_WIDTH, GAME_HEIGHT } from './constants';

const STORAGE_KEY = 'nyanko-nickname';
let inputEl: HTMLInputElement | null = null;
let submitCallback: ((name: string) => void) | null = null;

export function getLastNickname(): string {
  return localStorage.getItem(STORAGE_KEY) ?? '';
}

function saveNickname(name: string): void {
  localStorage.setItem(STORAGE_KEY, name);
}

function positionInput(canvas: HTMLCanvasElement): void {
  if (!inputEl) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width / GAME_WIDTH;
  const scaleY = rect.height / GAME_HEIGHT;
  const inputW = 200 * scaleX;
  const inputH = 36 * scaleY;
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + GAME_HEIGHT * 0.48 * scaleY;

  inputEl.style.left = `${centerX - inputW / 2}px`;
  inputEl.style.top = `${centerY}px`;
  inputEl.style.width = `${inputW}px`;
  inputEl.style.height = `${inputH}px`;
  inputEl.style.fontSize = `${16 * scaleX}px`;
}

export function showNicknameInput(canvas: HTMLCanvasElement, onSubmit: (name: string) => void): void {
  submitCallback = onSubmit;

  if (!inputEl) {
    inputEl = document.createElement('input');
    inputEl.type = 'text';
    inputEl.className = 'nickname-input';
    inputEl.maxLength = 12;
    inputEl.placeholder = 'ニックネーム';
    document.body.appendChild(inputEl);
  }

  inputEl.value = getLastNickname();
  inputEl.style.display = 'block';
  positionInput(canvas);

  const resizeHandler = () => positionInput(canvas);
  window.addEventListener('resize', resizeHandler);
  inputEl.dataset.resizeHandler = 'active';

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      doSubmit();
    }
  });

  // Store cleanup reference
  (inputEl as HTMLInputElement & { _resizeHandler?: () => void })._resizeHandler = resizeHandler;

  setTimeout(() => inputEl?.focus(), 100);
}

function doSubmit(): void {
  if (!inputEl || !submitCallback) return;
  const name = inputEl.value.trim();
  if (name.length === 0) return;
  saveNickname(name);
  submitCallback(name);
}

export function triggerSubmit(): void {
  doSubmit();
}

export function hideNicknameInput(): void {
  if (!inputEl) return;
  inputEl.style.display = 'none';
  inputEl.blur();
  const handler = (inputEl as HTMLInputElement & { _resizeHandler?: () => void })._resizeHandler;
  if (handler) {
    window.removeEventListener('resize', handler);
  }
}

export function getNicknameValue(): string {
  return inputEl?.value.trim() ?? '';
}
