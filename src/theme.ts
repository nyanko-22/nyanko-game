import bgDarkUrl from './assets/bg-dark.svg?url';
import bgPastelUrl from './assets/bg-pastel.svg?url';

export type ThemeName = 'pastel' | 'dark';

const STORAGE_KEY = 'nyanko-theme';
let current: ThemeName = 'pastel';
const listeners: ((t: ThemeName) => void)[] = [];

export function getTheme(): ThemeName {
  return current;
}

function applyBgPattern(t: ThemeName): void {
  const url = t === 'pastel' ? bgPastelUrl : bgDarkUrl;
  document.documentElement.style.setProperty('--bg-pattern-url', `url('${url}')`);
}

export function setTheme(t: ThemeName): void {
  current = t;
  localStorage.setItem(STORAGE_KEY, t);
  document.documentElement.setAttribute('data-theme', t);
  applyBgPattern(t);
  listeners.forEach(fn => fn(t));
}

export function getBgPatternUrl(): string {
  return current === 'pastel' ? bgPastelUrl : bgDarkUrl;
}

export function onThemeChange(fn: (t: ThemeName) => void): void {
  listeners.push(fn);
}

export function initTheme(): void {
  current = (localStorage.getItem(STORAGE_KEY) as ThemeName) ?? 'pastel';
  document.documentElement.setAttribute('data-theme', current);
  applyBgPattern(current);
}
