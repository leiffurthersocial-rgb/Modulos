/** Seeded PRNG + value-noise helpers for deterministic world generation. */

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic hash of two ints + seed → float in [0,1). */
export function hash2(seed: number, x: number, y: number): number {
  let h = (seed ^ 0x9e3779b9) >>> 0;
  h = Math.imul(h ^ (x | 0), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (y | 0), 0xc2b2ae35) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0x27d4eb2f) >>> 0;
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

/** Bilinearly-interpolated value noise in [0,1). */
export function valueNoise2D(seed: number, x: number, y: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = smooth(x - x0);
  const fy = smooth(y - y0);
  const v00 = hash2(seed, x0, y0);
  const v10 = hash2(seed, x0 + 1, y0);
  const v01 = hash2(seed, x0, y0 + 1);
  const v11 = hash2(seed, x0 + 1, y0 + 1);
  const a = v00 + (v10 - v00) * fx;
  const b = v01 + (v11 - v01) * fx;
  return a + (b - a) * fy;
}

/** Fractal (octave) noise in ~[0,1). */
export function fbm2D(
  seed: number,
  x: number,
  y: number,
  octaves = 4,
  lacunarity = 2,
  gain = 0.5,
): number {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise2D(seed + i * 1013, x * freq, y * freq);
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm;
}

/** 1D fractal noise (uses a fixed y lane). */
export function fbm1D(seed: number, x: number, octaves = 4): number {
  return fbm2D(seed, x, 0.5, octaves);
}
