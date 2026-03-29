import { createScreen, showScreen, hideScreen, el, materialIcon } from './shared';
import { getTheme, setTheme, type ThemeName } from '../theme';
import { getBgmVolume, getSeVolume, setBgmVolume, setSeVolume } from '../sound';

let screen: HTMLDivElement | null = null;
let onCloseCallback: (() => void) | null = null;
let onRestartCallback: (() => void) | null = null;
let onScreenshotCallback: (() => void) | null = null;
let onGoHomeCallback: (() => void) | null = null;

function buildScreen(): HTMLDivElement {
  screen = createScreen('settings-screen');
  screen.style.backgroundColor = 'var(--color-background)';

  const inner = el('div', { className: 'screen-inner' });

  // Header
  const header = el('div', { className: 'header-bar' });
  const backBtn = el('button', { className: 'btn-icon' });
  backBtn.appendChild(materialIcon('arrow_back'));
  backBtn.addEventListener('click', () => onCloseCallback?.());

  const title = el('span', { className: 'header-title', textContent: 'にゃんこゲーム' });
  const spacer = el('div');
  spacer.style.width = '40px';
  header.append(backBtn, title, spacer);

  // Settings title
  const settingsTitle = el('h1', { className: 'text-display' });
  settingsTitle.textContent = 'Settings';
  settingsTitle.style.marginTop = '8px';

  const settingsSubtitle = el('p', { className: 'text-body text-muted' });
  settingsSubtitle.textContent = 'Customize your feline adventure';
  settingsSubtitle.style.marginBottom = '20px';

  // BGM/SE sliders card
  const audioCard = el('div', { className: 'nyanmorphic' });
  audioCard.style.marginBottom = '16px';
  audioCard.append(
    createSliderRow('BGM', 'volume_up', getBgmVolume(), (v) => setBgmVolume(v)),
    createSliderRow('SE', 'music_note', getSeVolume(), (v) => setSeVolume(v)),
  );

  // Theme section
  const themeSection = el('div', { className: 'section-title', textContent: 'テーマ設定' });
  const themeContainer = el('div');
  themeContainer.style.display = 'flex';
  themeContainer.style.flexDirection = 'column';
  themeContainer.style.gap = '12px';
  themeContainer.style.marginBottom = '16px';

  const pastelCard = createThemeCard('pastel', 'Pastel Pattern', 'Soft pastels and playful paws', '#fafaf5', '#81d4fa');
  const darkCard = createThemeCard('dark', 'Dark Cosmic', 'Neon accents and starry skies', '#1a1a2e', '#81d4fa');
  themeContainer.append(pastelCard, darkCard);

  // Action buttons card
  const actionsCard = el('div', { className: 'nyanmorphic' });
  actionsCard.style.marginBottom = '16px';

  if (onGoHomeCallback) {
    const goHomeRow = createActionRow('home', 'ホームへ戻る', () => onGoHomeCallback?.());
    goHomeRow.style.color = 'var(--color-primary)';
    actionsCard.appendChild(goHomeRow);
  }
  const restartRow = createActionRow('restart_alt', 'やり直す', () => onRestartCallback?.());
  restartRow.style.color = 'var(--color-error)';
  const screenshotRow = createActionRow('photo_camera', 'スクリーンショット', () => onScreenshotCallback?.());
  actionsCard.append(restartRow, screenshotRow);

  // Info rows card
  const infoCard = el('div', { className: 'nyanmorphic' });
  infoCard.style.marginBottom = '24px';
  infoCard.append(
    createInfoRow('person', 'Account Info'),
    createInfoRow('shield', 'Privacy Policy'),
    createInfoRow('help', 'Support'),
  );

  // Version
  const version = el('p', { className: 'text-label text-muted text-center' });
  version.textContent = 'v1.0.0';
  version.style.marginBottom = '16px';

  inner.append(header, settingsTitle, settingsSubtitle, audioCard, themeSection, themeContainer, actionsCard, infoCard, version);
  screen.appendChild(inner);
  return screen;
}

function createSliderRow(label: string, icon: string, value: number, onChange: (v: number) => void): HTMLDivElement {
  const row = el('div', { className: 'settings-row settings-slider-row' });

  const labelContainer = el('div', { className: 'settings-row-label' });
  labelContainer.append(materialIcon(icon), document.createTextNode(label));

  const input = document.createElement('input');
  input.type = 'range';
  input.className = 'settings-slider';
  input.min = '0';
  input.max = '1';
  input.step = '0.05';
  input.value = String(value);
  input.addEventListener('input', () => onChange(parseFloat(input.value)));

  row.append(labelContainer, input);
  return row;
}

function createThemeCard(theme: ThemeName, title: string, subtitle: string, bgColor: string, accentColor: string): HTMLDivElement {
  const isActive = getTheme() === theme;
  const card = el('div', { className: `theme-card nyanmorphic${isActive ? ' theme-card--active' : ''}` });

  // Preview strip
  const preview = el('div');
  preview.style.cssText = `
    width: 100%; height: 48px; border-radius: 10px; margin-bottom: 10px;
    background: ${bgColor}; border: 1px solid ${accentColor}44;
    display: flex; align-items: center; justify-content: center;
  `;
  const previewIcon = materialIcon('pets');
  previewIcon.style.color = accentColor;
  previewIcon.style.fontSize = '24px';
  preview.appendChild(previewIcon);

  const titleEl = el('div', { className: 'text-label', textContent: title });
  titleEl.style.fontWeight = '600';
  const subtitleEl = el('div', { className: 'text-label text-muted', textContent: subtitle });
  subtitleEl.style.fontSize = '11px';

  card.append(preview, titleEl, subtitleEl);

  if (isActive) {
    const badge = el('span', { className: 'theme-card-badge', textContent: 'ACTIVE' });
    card.appendChild(badge);
  }

  card.addEventListener('click', () => {
    setTheme(theme);
    refreshThemeCards();
  });

  card.dataset.theme = theme;
  return card;
}

function refreshThemeCards(): void {
  if (!screen) return;
  const cards = screen.querySelectorAll('.theme-card') as NodeListOf<HTMLDivElement>;
  cards.forEach(card => {
    const isActive = getTheme() === card.dataset.theme;
    card.classList.toggle('theme-card--active', isActive);
    const existingBadge = card.querySelector('.theme-card-badge');
    if (isActive && !existingBadge) {
      card.appendChild(el('span', { className: 'theme-card-badge', textContent: 'ACTIVE' }));
    } else if (!isActive && existingBadge) {
      existingBadge.remove();
    }
  });
}

function createActionRow(icon: string, label: string, onClick: () => void): HTMLDivElement {
  const row = el('div', { className: 'settings-row' });
  row.style.cursor = 'pointer';
  const labelContainer = el('div', { className: 'settings-row-label' });
  labelContainer.append(materialIcon(icon), document.createTextNode(label));
  const chevron = materialIcon('chevron_right');
  chevron.style.color = 'var(--color-outline)';
  row.append(labelContainer, chevron);
  row.addEventListener('click', onClick);
  return row;
}

function createInfoRow(icon: string, label: string): HTMLDivElement {
  const row = el('div', { className: 'settings-row' });
  row.style.cursor = 'pointer';
  row.style.opacity = '0.6';
  const labelContainer = el('div', { className: 'settings-row-label' });
  labelContainer.append(materialIcon(icon), document.createTextNode(label));
  const chevron = materialIcon('chevron_right');
  chevron.style.color = 'var(--color-outline)';
  row.append(labelContainer, chevron);
  return row;
}

export function showSettingsScreen(callbacks: {
  onClose: () => void;
  onRestart: () => void;
  onScreenshot: () => void;
  onGoHome?: () => void;
}): void {
  onCloseCallback = callbacks.onClose;
  onRestartCallback = callbacks.onRestart;
  onScreenshotCallback = callbacks.onScreenshot;
  onGoHomeCallback = callbacks.onGoHome ?? null;

  // Rebuild each time so "ホームへ戻る" button reflects current context
  if (screen) {
    screen.remove();
    screen = null;
  }
  screen = buildScreen();

  // Refresh slider values
  const sliders = screen.querySelectorAll('input[type="range"]') as NodeListOf<HTMLInputElement>;
  if (sliders.length >= 2) {
    sliders[0].value = String(getBgmVolume());
    sliders[1].value = String(getSeVolume());
  }
  refreshThemeCards();
  showScreen(screen);
}

export function hideSettingsScreen(): void {
  if (screen) hideScreen(screen);
}
