let audioCtx: AudioContext | null = null;

const MEOW_FILES = [
  'sounds/meow1.mp3',
  'sounds/meow2.mp3',
  'sounds/meow5.mp3',
  'sounds/meow6.mp3',
];

const GAMEOVER_FILES = [
  'sounds/gameover1.mp3',
  'sounds/gameover2.mp3',
];

// Level-specific merge sounds: key = level of merging cats (not the resulting cat)
const MERGE_LEVEL_FILES: Record<number, string> = {
  0: 'sounds/merge_lv0.mp3',   // 子猫(Lv0)同士の合体
  1: 'sounds/merge_lv1.mp3',   // ミケ猫(Lv1)同士の合体
  10: 'sounds/merge_lv10.mp3', // 猫神様(Lv10)ができたとき → Lv9同士の合体
};

const buffers: (AudioBuffer | null)[] = MEOW_FILES.map(() => null);
const gameoverBuffers: (AudioBuffer | null)[] = GAMEOVER_FILES.map(() => null);
const mergeLevelBuffers: Record<number, AudioBuffer | null> = {};
let loaded = false;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
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
  ]);
}

export function ensureAudioReady(): void {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  loadSounds();
}

export function playMeow(mergeFromLevel: number, newLevel: number): void {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  // Check for level-specific sound first
  // merge_lv10 triggers when newLevel is 10 (cat god created)
  const specificKey = newLevel === 10 ? 10 : mergeFromLevel;
  const specificBuffer = mergeLevelBuffers[specificKey];
  if (specificBuffer) {
    const source = ctx.createBufferSource();
    source.buffer = specificBuffer;
    const gain = ctx.createGain();
    gain.gain.value = 0.6;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    return;
  }

  // Fallback to generic meow sounds
  const index = newLevel % MEOW_FILES.length;
  const buffer = buffers[index];
  if (!buffer) return;

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  // Adjust playback rate: smaller cats = higher pitch, larger cats = lower pitch
  const rate = 1.3 - newLevel * 0.08;
  source.playbackRate.value = Math.max(0.5, Math.min(1.5, rate));

  const gain = ctx.createGain();
  gain.gain.value = 0.5;

  source.connect(gain);
  gain.connect(ctx.destination);
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

  const gain = ctx.createGain();
  gain.gain.value = 0.6;

  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}
