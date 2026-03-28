let audioCtx: AudioContext | null = null;

const MEOW_FILES = [
  'sounds/meow1.mp3',
  'sounds/meow2.mp3',
  'sounds/meow5.mp3',
  'sounds/meow6.mp3',
  'sounds/meow7.mp3',
  'sounds/meow8.mp3',
  'sounds/meow9.mp3',
  'sounds/meow10.mp3',
  'sounds/meow11.mp3',
];

const GAMEOVER_FILES = [
  'sounds/gameover1.mp3',
  'sounds/gameover2.mp3',
];

// Level-specific merge sounds: key = level of merging cats (not the resulting cat)
const MERGE_LEVEL_FILES: Record<number, string> = {
  0: 'sounds/merge_lv0.mp3',
  1: 'sounds/merge_lv1.mp3',
  10: 'sounds/merge_lv10.mp3',
};

const BGM_FILE = 'sounds/bgm.mp3';

const buffers: (AudioBuffer | null)[] = MEOW_FILES.map(() => null);
const gameoverBuffers: (AudioBuffer | null)[] = GAMEOVER_FILES.map(() => null);
const mergeLevelBuffers: Record<number, AudioBuffer | null> = {};
let bgmBuffer: AudioBuffer | null = null;
let bgmSource: AudioBufferSourceNode | null = null;
let bgmGainNode: GainNode | null = null;
let seGainNode: GainNode | null = null;
let bgmPlaying = false;
let loaded = false;

// Volume settings (0.0 - 1.0), persisted in localStorage
const STORAGE_KEY_BGM = 'nyanko-game-bgm-vol';
const STORAGE_KEY_SE = 'nyanko-game-se-vol';

let bgmVolume = parseFloat(localStorage.getItem(STORAGE_KEY_BGM) ?? '0.4');
let seVolume = parseFloat(localStorage.getItem(STORAGE_KEY_SE) ?? '0.6');

export function getBgmVolume(): number { return bgmVolume; }
export function getSeVolume(): number { return seVolume; }

export function setBgmVolume(v: number): void {
  bgmVolume = Math.max(0, Math.min(1, v));
  localStorage.setItem(STORAGE_KEY_BGM, bgmVolume.toString());
  if (bgmGainNode) {
    bgmGainNode.gain.value = bgmVolume;
  }
}

export function setSeVolume(v: number): void {
  seVolume = Math.max(0, Math.min(1, v));
  localStorage.setItem(STORAGE_KEY_SE, seVolume.toString());
  if (seGainNode) {
    seGainNode.gain.value = seVolume;
  }
}

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    bgmGainNode = audioCtx.createGain();
    bgmGainNode.gain.value = bgmVolume;
    bgmGainNode.connect(audioCtx.destination);
    seGainNode = audioCtx.createGain();
    seGainNode.gain.value = seVolume;
    seGainNode.connect(audioCtx.destination);
  }
  return audioCtx;
}

async function loadSounds(): Promise<void> {
  if (loaded) return;
  loaded = true;

  const ctx = getAudioContext();

  const allFiles = [
    ...MEOW_FILES.map((file, i) => ({ file, arr: buffers, i })),
    ...GAMEOVER_FILES.map((file, i) => ({ file, arr: gameoverBuffers, i })),
  ];

  const mergeLevelEntries = Object.entries(MERGE_LEVEL_FILES).map(([lvStr, file]) => ({
    level: parseInt(lvStr, 10),
    file,
  }));

  await Promise.all([
    ...allFiles.map(async ({ file, arr, i }) => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}${file}`);
        if (!res.ok) return;
        const data = await res.arrayBuffer();
        arr[i] = await ctx.decodeAudioData(data);
      } catch {
        // Sound loading failed silently
      }
    }),
    ...mergeLevelEntries.map(async ({ level, file }) => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}${file}`);
        if (!res.ok) return;
        const data = await res.arrayBuffer();
        mergeLevelBuffers[level] = await ctx.decodeAudioData(data);
      } catch {
        // Sound loading failed silently
      }
    }),
    (async () => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}${BGM_FILE}`);
        if (!res.ok) return;
        const data = await res.arrayBuffer();
        bgmBuffer = await ctx.decodeAudioData(data);
      } catch {
        // BGM loading failed silently
      }
    })(),
  ]);
}

export function ensureAudioReady(): void {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  loadSounds();
}

export function startBgm(): void {
  if (bgmPlaying) return;
  const ctx = getAudioContext();
  if (!bgmBuffer || !bgmGainNode) return;

  bgmSource = ctx.createBufferSource();
  bgmSource.buffer = bgmBuffer;
  bgmSource.loop = true;
  bgmSource.connect(bgmGainNode);
  bgmSource.start();
  bgmPlaying = true;
}

export function stopBgm(): void {
  if (!bgmPlaying || !bgmSource) return;
  try {
    bgmSource.stop();
  } catch {
    // already stopped
  }
  bgmSource = null;
  bgmPlaying = false;
}

export function playMeow(mergeFromLevel: number, newLevel: number): void {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  // Check for level-specific sound first
  const specificKey = newLevel === 10 ? 10 : mergeFromLevel;
  const specificBuffer = mergeLevelBuffers[specificKey];
  if (specificBuffer) {
    const source = ctx.createBufferSource();
    source.buffer = specificBuffer;
    source.connect(seGainNode!);
    source.start();
    return;
  }

  // Fallback to generic meow sounds
  const index = newLevel % MEOW_FILES.length;
  const buffer = buffers[index];
  if (!buffer) return;

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const rate = 1.3 - newLevel * 0.08;
  source.playbackRate.value = Math.max(0.5, Math.min(1.5, rate));

  source.connect(seGainNode!);
  source.start();
}

export function playGameOver(): void {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const index = Math.floor(Math.random() * GAMEOVER_FILES.length);
  const buffer = gameoverBuffers[index];
  if (!buffer) return;

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(seGainNode!);
  source.start();
}
