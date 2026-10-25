"use strict";
// Live-style formant estimate: LPC by autocorrelation, roots by Durand-Kerner.
// Kept dependency-free so the same functions can be pasted into the browser tool.

function resample(samples, fromRate, toRate) {
  // Average blocks, a crude low-pass, then pick. Fine for speech below the 5.5 kHz ceiling.
  const ratio = fromRate / toRate;
  const out = new Float32Array(Math.floor(samples.length / ratio));
  for (let i = 0; i < out.length; i++) {
    const a = Math.floor(i * ratio), b = Math.max(a + 1, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let k = a; k < b; k++) sum += samples[k];
    out[i] = sum / (b - a);
  }
  return out;
}

function lpcCoefficients(frame, order) {
  const n = frame.length;
  const r = new Float64Array(order + 1);
  for (let lag = 0; lag <= order; lag++) {
    let sum = 0;
    for (let i = 0; i + lag < n; i++) sum += frame[i] * frame[i + lag];
    r[lag] = sum;
  }
  if (r[0] <= 0) return null;
  r[0] *= 1.0001; // tiny white-noise correction keeps the filter stable
  const a = new Float64Array(order + 1); a[0] = 1;
  let error = r[0];
  for (let i = 1; i <= order; i++) {
    let acc = r[i];
    for (let j = 1; j < i; j++) acc += a[j] * r[i - j];
    const k = -acc / error;
    const next = a.slice();
    for (let j = 1; j < i; j++) next[j] = a[j] + k * a[i - j];
    next[i] = k;
    a.set(next);
    error *= 1 - k * k;
    if (error <= 0) return null;
  }
  return a;
}

// Roots of 1 + a1 z^-1 + ... + ap z^-p, i.e. z^p + a1 z^(p-1) + ... + ap.
function polynomialRoots(a) {
  const p = a.length - 1;
  const re = new Float64Array(p), im = new Float64Array(p);
  for (let i = 0; i < p; i++) { // start on a circle, not on the real axis
    const angle = 2 * Math.PI * i / p + 0.4;
    re[i] = 0.9 * Math.cos(angle); im[i] = 0.9 * Math.sin(angle);
  }
  for (let iter = 0; iter < 100; iter++) {
    let moved = 0;
    for (let i = 0; i < p; i++) {
      // Evaluate polynomial at root i
      let pr = 1, pi = 0;
      for (let k = 1; k <= p; k++) {
        const nr = pr * re[i] - pi * im[i] + a[k];
        pi = pr * im[i] + pi * re[i]; pr = nr;
      }
      let dr = 1, di = 0;
      for (let j = 0; j < p; j++) {
        if (j === i) continue;
        const xr = re[i] - re[j], xi = im[i] - im[j];
        const nr = dr * xr - di * xi; di = dr * xi + di * xr; dr = nr;
      }
      const den = dr * dr + di * di;
      if (den === 0) continue;
      const stepR = (pr * dr + pi * di) / den, stepI = (pi * dr - pr * di) / den;
      re[i] -= stepR; im[i] -= stepI;
      moved = Math.max(moved, Math.abs(stepR) + Math.abs(stepI));
    }
    if (moved < 1e-9) break;
  }
  return { re, im };
}

// Returns [F1, F2, F3] in Hz for one frame sampled at `rate`, or null.
function frameFormants(frame, rate, order) {
  const windowed = new Float64Array(frame.length);
  for (let i = 0; i < frame.length; i++) {
    const w = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (frame.length - 1));
    windowed[i] = (i ? frame[i] - 0.97 * frame[i - 1] : frame[i]) * w;
  }
  const a = lpcCoefficients(windowed, order);
  if (!a) return null;
  const { re, im } = polynomialRoots(a);
  const found = [];
  for (let i = 0; i < re.length; i++) {
    if (im[i] <= 0) continue;
    const hz = Math.atan2(im[i], re[i]) * rate / (2 * Math.PI);
    const bandwidth = -Math.log(Math.hypot(re[i], im[i])) * rate / Math.PI;
    if (hz > 90 && hz < rate / 2 - 100 && bandwidth < Number(process.env.BW || 700)) found.push(hz);
  }
  found.sort((x, y) => x - y);
  return found.length >= 3 ? found.slice(0, 3) : null;
}

module.exports = { resample, frameFormants };
