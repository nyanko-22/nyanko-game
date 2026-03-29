import { createScreen, showScreen, hideScreen, el, materialIcon } from './shared';

const STORAGE_KEY = 'nyanko-nickname';

let screen: HTMLDivElement | null = null;
let onSubmitCallback: ((name: string) => void) | null = null;
let inputEl: HTMLInputElement | null = null;

export function getLastNickname(): string {
  return localStorage.getItem(STORAGE_KEY) ?? '';
}

function saveNickname(name: string): void {
  localStorage.setItem(STORAGE_KEY, name);
}

function buildScreen(defaultName: string): HTMLDivElement {
  screen = createScreen('nickname-screen');
  screen.style.backgroundColor = 'var(--color-background)';

  const inner = el('div', { className: 'screen-inner nickname-inner' });

  const titleEl = el('h2', { className: 'nickname-title text-title' });
  titleEl.textContent = 'スコア登録';

  const hintEl = el('p', { className: 'text-body text-muted nickname-hint' });
  hintEl.textContent = 'ニックネームを入力してください (最大12文字)';

  inputEl = document.createElement('input');
  inputEl.type = 'text';
  inputEl.className = 'nickname-input-html';
  inputEl.maxLength = 12;
  inputEl.placeholder = 'ニックネーム';
  inputEl.value = defaultName;
  inputEl.setAttribute('autocomplete', 'off');
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSubmit();
  });

  const submitBtn = el('button', { className: 'btn btn-primary w-full' });
  submitBtn.append(materialIcon('send'), document.createTextNode(' 登録してランキングへ'));
  submitBtn.addEventListener('click', () => doSubmit());

  inner.append(titleEl, hintEl, inputEl, submitBtn);
  screen.appendChild(inner);
  return screen;
}

function doSubmit(): void {
  if (!inputEl || !onSubmitCallback) return;
  const name = inputEl.value.trim();
  if (name.length === 0) {
    inputEl.focus();
    return;
  }
  saveNickname(name);
  onSubmitCallback(name);
}

export function showNicknameScreen(
  defaultName: string,
  callbacks: { onSubmit: (name: string) => void },
): void {
  onSubmitCallback = callbacks.onSubmit;
  if (screen) {
    screen.remove();
    screen = null;
  }
  screen = buildScreen(defaultName);
  showScreen(screen);
  setTimeout(() => inputEl?.focus(), 150);
}

export function hideNicknameScreen(): void {
  if (screen) hideScreen(screen);
}
