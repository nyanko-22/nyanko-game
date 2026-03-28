import { createScreen, showScreen, hideScreen, el, materialIcon } from './shared';
import type { ScoreEntry } from '../firebase';

export interface RankingRenderData {
  scores: ScoreEntry[];
  loading: boolean;
  error: boolean;
  scrollOffset: number;
  selectedScreenshot: { url: string; img: HTMLImageElement | null } | null;
  submitting?: boolean;
}

let screen: HTMLDivElement | null = null;
let listEl: HTMLDivElement | null = null;
let onBackCallback: (() => void) | null = null;
let onPlayAgainCallback: (() => void) | null = null;
let modalEl: HTMLDivElement | null = null;

function clearEl(node: HTMLElement): void {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function buildScreen(): HTMLDivElement {
  screen = createScreen('ranking-screen');
  screen.style.background = 'var(--color-background)';

  const inner = el('div', { className: 'screen-inner' });

  // Header
  const header = el('div', { className: 'header-bar' });
  const backBtn = el('button', { className: 'btn-icon' });
  backBtn.appendChild(materialIcon('arrow_back'));
  backBtn.addEventListener('click', () => onBackCallback?.());
  const title = el('span', { className: 'header-title', textContent: 'ランキング' });
  const spacer = el('div');
  spacer.style.width = '40px';
  header.append(backBtn, title, spacer);

  // Ranking list
  listEl = el('div', { className: 'ranking-list-container' });

  // Footer buttons
  const footer = el('div', { className: 'ranking-footer' });
  const playAgainBtn = el('button', { className: 'btn btn-primary w-full' });
  playAgainBtn.append(materialIcon('replay'), document.createTextNode(' もう一度'));
  playAgainBtn.addEventListener('click', () => onPlayAgainCallback?.());
  footer.appendChild(playAgainBtn);

  inner.append(header, listEl, footer);
  screen.appendChild(inner);

  return screen;
}

function renderList(data: RankingRenderData): void {
  if (!listEl) return;
  clearEl(listEl);

  if (data.loading) {
    const msg = el('p', { className: 'ranking-status-msg text-body text-muted' });
    msg.textContent = '読み込み中...';
    listEl.appendChild(msg);
    return;
  }

  if (data.error) {
    const msg = el('p', { className: 'ranking-status-msg text-body' });
    msg.style.color = 'var(--color-error)';
    msg.textContent = '読み込みに失敗しました';
    listEl.appendChild(msg);
    return;
  }

  if (data.scores.length === 0) {
    const msg = el('p', { className: 'ranking-status-msg text-body text-muted' });
    msg.textContent = 'まだスコアがありません';
    listEl.appendChild(msg);
    return;
  }

  for (let i = 0; i < data.scores.length; i++) {
    const entry = data.scores[i];
    const item = el('div', { className: `ranking-item${i < 3 ? ' ranking-item--top' : ''}` });

    const rankEl = el('div', { className: `ranking-rank${i < 3 ? ' ranking-rank--gold' : ''}` });
    rankEl.textContent = `${i + 1}`;

    const nameEl = el('div', { className: 'text-label' });
    nameEl.textContent = entry.nickname;
    nameEl.style.flex = '1';

    const scoreEl = el('div', { className: 'ranking-score' });
    scoreEl.textContent = `${entry.score}`;
    const pts = el('span', { className: 'ranking-pts', textContent: ' pts' });
    scoreEl.appendChild(pts);

    item.append(rankEl, nameEl, scoreEl);

    if (entry.screenshotUrl) {
      const thumbBtn = el('button', { className: 'ranking-thumb-btn btn-icon' });
      thumbBtn.appendChild(materialIcon('photo'));
      thumbBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showScreenshotModal(entry.screenshotUrl);
      });
      item.appendChild(thumbBtn);
    }

    listEl.appendChild(item);
  }
}

function ensureModal(): void {
  if (modalEl) return;
  modalEl = el('div', { className: 'screenshot-modal' });
  modalEl.addEventListener('click', () => {
    if (modalEl) modalEl.style.display = 'none';
  });
  document.getElementById('overlay-container')!.appendChild(modalEl);
}

function showScreenshotModal(url: string): void {
  ensureModal();
  if (!modalEl) return;
  clearEl(modalEl);
  modalEl.style.display = 'flex';

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.className = 'screenshot-modal-img';
  img.src = url;

  const hint = el('p', { className: 'screenshot-modal-hint text-label text-muted' });
  hint.textContent = 'タップして閉じる';

  modalEl.append(img, hint);
}

export function showRankingScreen(
  data: RankingRenderData,
  callbacks: { onBack: () => void; onPlayAgain: () => void },
): void {
  onBackCallback = callbacks.onBack;
  onPlayAgainCallback = callbacks.onPlayAgain;

  if (!screen) {
    screen = buildScreen();
  }
  renderList(data);
  showScreen(screen);
}

export function hideRankingScreen(): void {
  if (screen) hideScreen(screen);
  if (modalEl) {
    modalEl.style.display = 'none';
    modalEl.remove();
    modalEl = null;
  }
}

export function updateRankingScreen(data: RankingRenderData): void {
  renderList(data);
}
