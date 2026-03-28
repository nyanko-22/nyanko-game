export type ThemeName = 'pastel' | 'dark';

const STORAGE_KEY = 'nyanko-theme';
let current: ThemeName = 'pastel';
const listeners: ((t: ThemeName) => void)[] = [];

export function getTheme(): ThemeName {
  return current;
}

function applyBgPattern(t: ThemeName): void {
  const base = import.meta.env.BASE_URL;
  const file = t === 'pastel' ? 'bg-pastel.svg' : 'bg-dark.svg';
  document.documentElement.style.setProperty('--bg-pattern-url', `url('${base}${file}')`);
}

export function setTheme(t: ThemeName): void {
  current = t;
  localStorage.setItem(STORAGE_KEY, t);
  document.documentElement.setAttribute('data-theme', t);
  applyBgPattern(t);
  listeners.forEach(fn => fn(t));
}

export function onThemeChange(fn: (t: ThemeName) => void): void {
  listeners.push(fn);
}

export function initTheme(): void {
  current = (localStorage.getItem(STORAGE_KEY) as ThemeName) ?? 'pastel';
  document.documentElement.setAttribute('data-theme', current);
  applyBgPattern(current);
}
