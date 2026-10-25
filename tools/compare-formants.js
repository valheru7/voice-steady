"use strict";
const fs = require("fs");
const { resample, frameFormants } = require("./formants");

const html = fs.readFileSync(require("path").join(__dirname, "..", "index.html"), "utf8");
const grab = (name) => html.match(new RegExp(`function ${name}\\b[\\s\\S]*?\\n}\\n`))[0];
const MIN_HZ = 75, MAX_HZ = 400;
eval(grab("detectPitch") + grab("median") + "globalThis.detectPitch = detectPitch; globalThis.median = median;");

function readWav(path) {
  const b = fs.readFileSync(path);
  const rate = b.readUInt32LE(24);
  let off = 12;
  while (b.toString("ascii", off, off + 4) !== "data") off += 8 + b.readUInt32LE(off + 4);
  const n = b.readUInt32LE(off + 4) / 2;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = b.readInt16LE(off + 8 + i * 2) / 32768;
  return { samples: out, rate };
}

const [,, wavPath, ...spanArgs] = process.argv;
const { samples, rate } = readWav(wavPath);
const ORDER = Number(process.env.ORDER || 12), CEIL = Number(process.env.CEIL || 5000);
const out = [];
for (const arg of spanArgs) {
  const [label, from, to] = arg.split(":");
  const rows = [];
  for (let at = Math.floor(from * rate); at + 2048 <= Math.floor(to * rate); at += 1024) {
    const win = samples.subarray(at, at + 2048);
    let sq = 0; for (const v of win) sq += v * v;
    const level = Math.sqrt(sq / win.length) * 1000;
    const p = detectPitch(win, rate);
    if (!p || p.clarity < 0.8) continue;
    rows.push({ win, level, hz: p.hz });
  }
  const cut = rows.map(r => r.level).sort((a, b) => a - b)[Math.floor(rows.length * 0.6)];
  const f = [[], [], []];
  for (const r of rows) {
    if (r.level < cut) continue;
    const low = resample(r.win, rate, 2 * CEIL);
    const mid = Math.floor(low.length / 2), half = Math.floor(0.0125 * 2 * CEIL);
    const res = frameFormants(low.subarray(mid - half, mid + half), 2 * CEIL, ORDER);
    if (res) res.forEach((v, i) => f[i].push(v));
  }
  out.push(`${label}: pitch ${Math.round(median(rows.map(r => r.hz)))} Hz, F1 ${Math.round(median(f[0]))}, F2 ${Math.round(median(f[1]))}, F3 ${Math.round(median(f[2]))} (${f[0].length} frames)`);
}
console.log(out.join("\n"));
