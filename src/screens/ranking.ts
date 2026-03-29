import { createScreen, showScreen, hideScreen, el, materialIcon } from './shared';
import type { ScoreEntry } from '../firebase';

export interface RankingRenderData {
  scores: ScoreEntry[];
  loading: boolean;
  error: boolean;
  scrollOffset: number;
  selectedScreenshot: { url: string; img: HTMLImageElement | null } | null;
  submitting?: boolean;
  currentPlayer?: { nickname: string; score: number };
  personalHighScore?: number;
}

let screen: HTMLDivElement | null = null;
let listEl: HTMLDivElement | null = null;
let yourStatsEl: HTMLDivElement | null = null;
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

  // YOUR STATS card (hidden by default, shown when currentPlayer exists)
  yourStatsEl = el('div', { className: 'ranking-your-stats' });
  yourStatsEl.style.display = 'none';

  // Ranking list
  listEl = el('div', { className: 'ranking-list-container' });

  // Footer buttons
  const footer = el('div', { className: 'ranking-footer' });
  const playAgainBtn = el('button', { className: 'btn btn-primary w-full' });
  playAgainBtn.append(materialIcon('replay'), document.createTextNode(' もう一度'));
  playAgainBtn.addEventListener('click', () => onPlayAgainCallback?.());
  footer.appendChild(playAgainBtn);

  inner.append(header, yourStatsEl, listEl, footer);
  screen.appendChild(inner);

  return screen;
}

function renderYourStats(data: RankingRenderData): void {
  if (!yourStatsEl) return;
  const highScore = data.personalHighScore ?? 0;
  if (!highScore) {
    yourStatsEl.style.display = 'none';
    return;
  }
  yourStatsEl.style.display = 'flex';
  clearEl(yourStatsEl);

  const rank = data.loading
    ? null
    : data.scores.filter(s => s.score > highScore).length + 1;

  const rankStr = rank !== null ? `#${rank}` : '---';
  const highStr = highScore.toLocaleString();

  const rankBlock = el('div', { className: 'ranking-your-stat-block' });
  rankBlock.append(
    el('div', { className: 'ranking-your-stat-label', textContent: 'YOUR RANK' }),
    el('div', { className: 'ranking-your-stat-value', textContent: rankStr }),
  );

  const bestBlock = el('div', { className: 'ranking-your-stat-block' });
  bestBlock.append(
    el('div', { className: 'ranking-your-stat-label', textContent: 'HIGH SCORE' }),
    el('div', { className: 'ranking-your-stat-value', textContent: highStr }),
  );

  if (data.currentPlayer) {
    const scoreStr = data.currentPlayer.score.toLocaleString();
    const scoreBlock = el('div', { className: 'ranking-your-stat-block' });
    scoreBlock.append(
      el('div', { className: 'ranking-your-stat-label', textContent: 'SCORE' }),
      el('div', { className: 'ranking-your-stat-value', textContent: scoreStr }),
    );
    yourStatsEl.append(
      rankBlock,
      el('div', { className: 'ranking-stats-divider' }),
      scoreBlock,
      el('div', { className: 'ranking-stats-divider' }),
      bestBlock,
    );
  } else {
    yourStatsEl.append(rankBlock, el('div', { className: 'ranking-stats-divider' }), bestBlock);
  }
}

function renderList(data: RankingRenderData): void {
  if (!listEl) return;
  renderYourStats(data);
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
      // touchend handles mobile (preventDefault stops synthesized click double-fire)
      thumbBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showScreenshotModal(entry.screenshotUrl);
      });
      // click handles desktop
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
  const closeModal = () => { if (modalEl) modalEl.style.display = 'none'; };
  modalEl.addEventListener('click', closeModal);
  modalEl.addEventListener('touchend', (e) => { e.preventDefault(); closeModal(); });
  // Mount directly on body to avoid stacking context and pointer-events inheritance issues
  document.body.appendChild(modalEl);
}

function showScreenshotModal(url: string): void {
  ensureModal();
  if (!modalEl) return;
  clearEl(modalEl);
  modalEl.style.display = 'flex';

  const img = new Image();
  // Do NOT set crossOrigin='anonymous' — causes CORS block with Firebase Storage
  img.className = 'screenshot-modal-img';
  img.src = url;
  img.onerror = () => {
    const msg = el('p', { className: 'text-body text-muted' });
    msg.textContent = '画像の読み込みに失敗しました';
    if (modalEl) modalEl.insertBefore(msg, img);
    img.style.display = 'none';
  };

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
