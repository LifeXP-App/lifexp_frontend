let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  ctx ??= new AudioContextClass();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

// Short, quiet "pssh" -- high-passed white noise with a fast attack and a
// decaying tail, synthesized so no audio asset is needed. Must be called
// from a user gesture (autoplay policy); silently no-ops otherwise.
export function playHiss() {
  try {
    const ctx = getContext();
    if (!ctx) return;

    // Small per-play variation (about +/-10%) so it stays recognizably the
    // same hiss but never sounds copy-pasted.
    const vary = (base: number, spread: number) => base * (1 + (Math.random() * 2 - 1) * spread);
    const duration = vary(0.5, 0.1);
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = vary(3500, 0.12);

    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(vary(0.07, 0.1), now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    source.connect(highpass).connect(gain).connect(ctx.destination);
    source.start(now);
    source.stop(now + duration);
  } catch {
    // Audio is a nicety; never let it break the freeze interaction.
  }
}

// Ice cracking: a burst of irregular, brittle, glassy clicks -- a strong
// first snap, then a quick scatter of smaller high-pitched cracks that
// thin out, each with a tiny resonant ring. All high-frequency; no thud.
export function playCrack() {
  try {
    const ctx = getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const crack = (at: number, level: number) => {
      const length = Math.floor(ctx.sampleRate * (0.012 + Math.random() * 0.02));
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp((-8 * i) / length);
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      // High Q makes each click ring slightly like glass instead of a dull tick.
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = "bandpass";
      bandpass.frequency.value = 3000 + Math.random() * 6000;
      bandpass.Q.value = 4 + Math.random() * 4;
      const gain = ctx.createGain();
      gain.gain.value = level;
      source.connect(bandpass).connect(gain).connect(ctx.destination);
      source.start(now + at);
    };

    crack(0, 0.9);
    let t = 0.03;
    for (let i = 0; i < 9; i++) {
      t += 0.012 + Math.random() * 0.045;
      crack(t, 0.5 * (1 - i / 11) * (0.6 + Math.random() * 0.4));
    }

    // Two faint high pings on the biggest cracks.
    for (const [at, freq] of [[0, 4200], [0.07, 5600]] as const) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq + Math.random() * 600;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.05, now + at);
      g.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.09);
      osc.connect(g).connect(ctx.destination);
      osc.start(now + at);
      osc.stop(now + at + 0.1);
    }
  } catch {
    // Audio is a nicety; never let it break the freeze interaction.
  }
}
