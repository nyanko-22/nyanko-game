let audioCtx: AudioContext | null = null;
let resumed = false;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (!resumed && audioCtx.state === 'suspended') {
    audioCtx.resume().then(() => { resumed = true; });
  }
  return audioCtx;
}

export function ensureAudioReady(): void {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume().then(() => { resumed = true; });
  }
}

export function playMeow(level: number): void {
  const ctx = getAudioContext();

  const now = ctx.currentTime;
  const duration = 0.25 + level * 0.03;

  // Lower pitch for larger cats, range: 700Hz (kitten) → 200Hz (cat god)
  const baseFreq = 700 - level * 45;

  // Main "meow" tone - frequency sweep mimics a meow
  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  // Rise then fall: "me-ow" contour
  osc1.frequency.setValueAtTime(baseFreq * 0.7, now);
  osc1.frequency.linearRampToValueAtTime(baseFreq, now + duration * 0.3);
  osc1.frequency.linearRampToValueAtTime(baseFreq * 0.5, now + duration);

  // Nasal harmonic for cat-like timbre
  const osc2 = ctx.createOscillator();
  osc2.type = 'sawtooth';
  osc2.frequency.setValueAtTime(baseFreq * 1.5 * 0.7, now);
  osc2.frequency.linearRampToValueAtTime(baseFreq * 1.5, now + duration * 0.3);
  osc2.frequency.linearRampToValueAtTime(baseFreq * 1.5 * 0.5, now + duration);

  // Third harmonic
  const osc3 = ctx.createOscillator();
  osc3.type = 'sine';
  osc3.frequency.setValueAtTime(baseFreq * 2 * 0.7, now);
  osc3.frequency.linearRampToValueAtTime(baseFreq * 2, now + duration * 0.3);
  osc3.frequency.linearRampToValueAtTime(baseFreq * 2 * 0.5, now + duration);

  // Bandpass filter for nasal quality
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(baseFreq * 1.2, now);
  filter.frequency.linearRampToValueAtTime(baseFreq * 0.8, now + duration);
  filter.Q.value = 5;

  // Volume envelope: quick attack, sustain, fade out
  const mainGain = ctx.createGain();
  mainGain.gain.setValueAtTime(0, now);
  mainGain.gain.linearRampToValueAtTime(0.4, now + 0.03);
  mainGain.gain.setValueAtTime(0.35, now + duration * 0.3);
  mainGain.gain.linearRampToValueAtTime(0.0001, now + duration);

  const harmonicGain = ctx.createGain();
  harmonicGain.gain.setValueAtTime(0, now);
  harmonicGain.gain.linearRampToValueAtTime(0.08, now + 0.03);
  harmonicGain.gain.linearRampToValueAtTime(0.0001, now + duration * 0.7);

  const thirdGain = ctx.createGain();
  thirdGain.gain.setValueAtTime(0, now);
  thirdGain.gain.linearRampToValueAtTime(0.04, now + 0.03);
  thirdGain.gain.linearRampToValueAtTime(0.0001, now + duration * 0.5);

  // Connect: oscillators → gains → filter → output
  osc1.connect(mainGain);
  osc2.connect(harmonicGain);
  osc3.connect(thirdGain);
  mainGain.connect(filter);
  harmonicGain.connect(filter);
  thirdGain.connect(filter);
  filter.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc3.start(now);
  osc1.stop(now + duration + 0.05);
  osc2.stop(now + duration + 0.05);
  osc3.stop(now + duration + 0.05);
}
