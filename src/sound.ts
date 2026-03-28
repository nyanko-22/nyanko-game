let audioCtx: AudioContext | null = null;

const MEOW_FILES = [
  'sounds/meow1.mp3',
  'sounds/meow2.mp3',
  'sounds/meow5.mp3',
  'sounds/meow6.mp3',
];

const buffers: (AudioBuffer | null)[] = MEOW_FILES.map(() => null);
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

  await Promise.all(
    MEOW_FILES.map(async (file, i) => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}${file}`);
        if (!res.ok) return;
        const data = await res.arrayBuffer();
        buffers[i] = await ctx.decodeAudioData(data);
      } catch {
        // Sound loading failed silently - game continues without sound
      }
    })
  );
}

export function ensureAudioReady(): void {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  loadSounds();
}

export function playMeow(level: number): void {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  // Pick a sound file based on level, cycling through available sounds
  const index = level % MEOW_FILES.length;
  const buffer = buffers[index];
  if (!buffer) return;

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  // Adjust playback rate: smaller cats = higher pitch, larger cats = lower pitch
  const rate = 1.3 - level * 0.08;
  source.playbackRate.value = Math.max(0.5, Math.min(1.5, rate));

  const gain = ctx.createGain();
  gain.gain.value = 0.5;

  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}
