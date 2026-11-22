// out/story.json -> public/audio/*.wav (voice, music, sfx) + out/props.json (timings + lip-sync envelopes).
import fs from "node:fs";
import path from "node:path";
import {execFileSync, spawnSync} from "node:child_process";

const FPS = 30, SR = 24000, MIN = 15 * FPS, MAX = 30 * FPS, LEAD = 8, GAP = 5, TAIL = 10;
const ENGINE = process.env.TTS_ENGINE || "auto"; // piper | edge | auto
const story = JSON.parse(fs.readFileSync("out/story.json", "utf8"));
const A = "public/audio", RAW = "out/raw";
fs.mkdirSync(A, {recursive: true}); fs.mkdirSync(RAW, {recursive: true}); fs.mkdirSync("models", {recursive: true});

const VOICE = {
  male: {piper: "hi_IN-pratham-medium", edge: "hi-IN-MadhurNeural", pitch: 1},
  deep: {piper: "hi_IN-rohan-medium", edge: "hi-IN-MadhurNeural", pitch: 0.88},
  female: {piper: "hi_IN-priyamvada-medium", edge: "hi-IN-SwaraNeural", pitch: 1},
  child: {piper: "hi_IN-priyamvada-medium", edge: "hi-IN-SwaraNeural", pitch: 1.28},
};
const voiceFor = (speaker) => VOICE[story.characters.find((c) => c.id === speaker)?.voice ?? "male"] ?? VOICE.male;
const ff = (args) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...args], {stdio: ["ignore", "inherit", "inherit"]});

async function ensureModel(name) {
  const onnx = `models/${name}.onnx`;
  if (fs.existsSync(onnx)) return onnx;
  const [lang, voice, q] = name.split("-");
  const base = `https://huggingface.co/rhasspy/piper-voices/resolve/main/${lang.split("_")[0]}/${lang}/${voice}/${q}/${name}`;
  for (const ext of [".onnx", ".onnx.json"]) {
    const r = await fetch(base + ext);
    if (!r.ok) throw new Error(`model download failed ${r.status}: ${base + ext}`);
    fs.writeFileSync(`models/${name}${ext}`, Buffer.from(await r.arrayBuffer()));
  }
  return onnx;
}

async function tts(text, voice, out) {
  if (ENGINE !== "edge") {
    try {
      const model = await ensureModel(voice.piper);
      const r = spawnSync("piper", ["--model", model, "--output_file", out], {input: text});
      if (r.status === 0 && fs.existsSync(out)) return "piper";
      console.warn("piper failed:", String(r.stderr ?? r.error).slice(0, 200));
    } catch (e) { console.warn("piper unavailable:", e.message.slice(0, 200)); }
    if (ENGINE === "piper") throw new Error("Piper TTS failed");
  }
  const mp3 = out.replace(/\.wav$/, ".mp3");
  const r = spawnSync("edge-tts", ["--voice", voice.edge, "--text", text, "--write-media", mp3], {stdio: "inherit"});
  if (r.status !== 0) throw new Error("No working TTS (piper and edge-tts both failed)");
  ff(["-i", mp3, out]);
  return "edge-tts";
}

function readWav(file) {
  const b = fs.readFileSync(file);
  let o = 12, sr = SR, data = null;
  while (o < b.length - 8) {
    const id = b.toString("ascii", o, o + 4), sz = b.readUInt32LE(o + 4);
    if (id === "fmt ") sr = b.readUInt32LE(o + 12);
    if (id === "data") { data = b.subarray(o + 8, Math.min(b.length, o + 8 + sz)); break; }
    o += 8 + sz + (sz % 2);
  }
  if (!data) throw new Error("bad wav " + file);
  const n = Math.floor(data.length / 2), s = new Int16Array(n);
  for (let i = 0; i < n; i++) s[i] = data.readInt16LE(i * 2);
  return {sr, s};
}

function envelope(s, sr) {
  const w = Math.floor(sr / FPS), rms = [];
  for (let i = 0; i + w <= s.length; i += w) {
    let a = 0; for (let j = 0; j < w; j++) a += (s[i + j] / 32768) ** 2;
    rms.push(Math.sqrt(a / w));
  }
  const sorted = [...rms].sort((x, y) => x - y), p95 = sorted[Math.floor(sorted.length * 0.95)] || 1e-4;
  return rms.map((v, i) => { const x = Math.min(1, v / p95); return +(x < 0.12 ? 0 : x ** 0.8).toFixed(2); });
}

// 1) synthesize raw lines
const jobs = [];
for (const [si, sc] of story.scenes.entries()) for (const [li, l] of sc.lines.entries()) jobs.push({si, li, l, raw: `${RAW}/s${si}l${li}.wav`});
let engine = "";
for (const j of jobs) engine = await tts(j.l.text, voiceFor(j.l.speaker), j.raw);
console.log("TTS engine:", engine);

// 2) normalize + (optionally) tempo-fit to <= 30 s
function convert(tempo) {
  let total = 0;
  const scenes = story.scenes.map((sc) => ({...sc, lines: sc.lines.map((l) => ({...l}))}));
  for (const j of jobs) {
    const v = voiceFor(j.l.speaker), name = `s${j.si}l${j.li}.wav`;
    const filt = [];
    if (v.pitch !== 1) filt.push(`asetrate=${Math.round(22050 * v.pitch)}`, "aresample=22050", `atempo=${(1 / v.pitch).toFixed(4)}`);
    if (tempo > 1.001) filt.push(`atempo=${tempo.toFixed(4)}`);
    filt.push("loudnorm=I=-16:TP=-1.5:LRA=11");
    ff(["-i", j.raw, "-af", filt.join(","), "-ac", "1", "-ar", String(SR), "-c:a", "pcm_s16le", `${A}/${name}`]);
    const {sr, s} = readWav(`${A}/${name}`);
    const frames = Math.ceil((s.length / sr) * FPS);
    Object.assign(scenes[j.si].lines[j.li], {file: name, durationFrames: frames + GAP, amp: envelope(s, sr)});
  }
  for (const sc of scenes) {
    let cur = LEAD;
    for (const l of sc.lines) { l.startFrame = cur; cur += l.durationFrames; }
    sc.durationFrames = cur + TAIL;
    total += sc.durationFrames;
  }
  return {scenes, total};
}
let tempo = 1, res = convert(tempo);
if (res.total > MAX - 15) {
  tempo = Math.min(1.3, res.total / (MAX - 15));
  console.log(`Total ${res.total}f too long; speeding speech x${tempo.toFixed(2)}`);
  res = convert(tempo);
}
if (res.total > MAX) throw new Error(`Story is ${(res.total / FPS).toFixed(1)}s even after speed-up; shorten the script.`);
if (res.total < MIN) { const pad = MIN - res.total; res.scenes.at(-1).durationFrames += pad; res.total = MIN; console.log(`Padded last scene by ${pad} frames to reach 15s`); }
const total = res.total, dur = total / FPS;

// 3) music (own track in assets/music.* wins; otherwise a soft synthesized pad)
const own = ["assets/music.mp3", "assets/music.wav", "assets/music.ogg"].find((f) => fs.existsSync(f));
if (own) {
  ff(["-stream_loop", "-1", "-i", own, "-t", String(dur), "-ac", "2", "-ar", String(SR), `${A}/music.wav`]);
} else {
  const chords = [[261.63, 329.63, 392], [220, 261.63, 329.63], [174.61, 220, 261.63], [196, 246.94, 293.66]];
  const seg = 2.5, n = Math.ceil(dur / seg) + 1, inputs = [], parts = [];
  for (let i = 0; i < n; i++) for (const f of chords[i % 4]) inputs.push("-f", "lavfi", "-i", `sine=frequency=${f}:sample_rate=${SR}:duration=${seg}`);
  for (let i = 0; i < n; i++) parts.push(`[${i * 3}][${i * 3 + 1}][${i * 3 + 2}]amix=inputs=3:normalize=0,volume=0.45,afade=t=in:d=0.2,afade=t=out:st=${seg - 0.4}:d=0.4[c${i}]`);
  const cat = Array.from({length: n}, (_, i) => `[c${i}]`).join("");
  ff([...inputs, "-filter_complex", `${parts.join(";")};${cat}concat=n=${n}:v=0:a=1,tremolo=f=4:d=0.25,lowpass=f=1800,atrim=0:${dur},afade=t=out:st=${dur - 1}:d=1[m]`, "-map", "[m]", "-ac", "2", `${A}/music.wav`]);
}

// 4) sound effects
const lav = (expr, d, file, extra = "") => ff(["-f", "lavfi", "-i", `aevalsrc='${expr}':s=${SR}:d=${d}`, ...(extra ? ["-af", extra] : []), `${A}/${file}`]);
ff(["-f", "lavfi", "-i", `anoisesrc=d=1.4:c=pink:r=${SR}`, "-af", "highpass=f=300,lowpass=f=3500,afade=t=in:d=0.5,afade=t=out:st=0.5:d=0.9,volume=1.6", `${A}/sfx-whoosh.wav`]);
lav("0.25*(sin(2*PI*1319*t)*exp(-10*t)+gt(t,0.12)*sin(2*PI*1568*(t-0.12))*exp(-10*(t-0.12))+gt(t,0.24)*sin(2*PI*1976*(t-0.24))*exp(-10*(t-0.24))+gt(t,0.36)*sin(2*PI*2637*(t-0.36))*exp(-8*(t-0.36)))", 1.2, "sfx-sparkle.wav");
lav("0.4*sin(2*PI*(400*t+300*t*t))*min(1,t*8)*exp(-2*t)", 1.6, "sfx-magic.wav");

// 5) props for Remotion
const props = {...story, scenes: res.scenes, totalFrames: total};
fs.writeFileSync("out/props.json", JSON.stringify(props));
fs.writeFileSync("out/story.timed.json", JSON.stringify({...story, scenes: res.scenes.map((s) => ({...s, lines: s.lines.map(({amp, ...r}) => r)})), totalFrames: total}, null, 2));
console.log(`Audio ready: ${total} frames = ${dur.toFixed(2)}s, TTS=${engine}, tempo x${tempo.toFixed(2)}`);
