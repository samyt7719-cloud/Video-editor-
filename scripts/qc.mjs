// Verify out/movie.mp4: format, duration, audio, per-line audio sync, frame sanity. Exit 1 on failure.
import fs from "node:fs";
import crypto from "node:crypto";
import {execFileSync, spawnSync} from "node:child_process";

const MP4 = "out/movie.mp4", props = JSON.parse(fs.readFileSync("out/props.json", "utf8"));
const checks = [], add = (name, ok, detail) => { checks.push({name, ok, detail}); console.log(`${ok ? "PASS" : "FAIL"}  ${name}  ${detail ?? ""}`); };
if (!fs.existsSync(MP4)) { console.error("out/movie.mp4 missing"); process.exit(1); }

const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", MP4]).toString());
const v = probe.streams.find((s) => s.codec_type === "video"), a = probe.streams.find((s) => s.codec_type === "audio");
const dur = parseFloat(probe.format.duration), expect = props.totalFrames / 30;
add("codec h264", v?.codec_name === "h264", v?.codec_name);
add("resolution 1080x1920", v?.width === 1080 && v?.height === 1920, `${v?.width}x${v?.height}`);
add("fps 30", v?.r_frame_rate === "30/1", v?.r_frame_rate);
add("pix_fmt yuv420p", v?.pix_fmt === "yuv420p", v?.pix_fmt);
add("duration 15-30s", dur >= 15 && dur <= 30.05, dur.toFixed(2) + "s");
add("duration matches timeline", Math.abs(dur - expect) < 0.2, `video ${dur.toFixed(2)}s vs plan ${expect.toFixed(2)}s`);
add("audio stream (aac)", a?.codec_name === "aac", a?.codec_name);
add("file size sane (<50MB)", +probe.format.size < 50e6 && +probe.format.size > 100e3, (probe.format.size / 1e6).toFixed(2) + " MB");

const meanVol = (ss, t) => {
  const args = ["-hide_banner", ...(ss != null ? ["-ss", String(ss), "-t", String(t)] : []), "-i", MP4, "-vn", "-af", "volumedetect", "-f", "null", "-"];
  const m = /mean_volume: (-?[\d.]+) dB/.exec(spawnSync("ffmpeg", args, {encoding: "utf8"}).stderr);
  return m ? parseFloat(m[1]) : -99;
};
add("audio not silent", meanVol() > -45, meanVol().toFixed(1) + " dB");

// sync: every spoken line must be audible at its planned time window
let at = 0, bad = [];
props.scenes.forEach((sc, si) => {
  sc.lines.forEach((l, li) => {
    const t0 = (at + l.startFrame) / 30, d = (l.durationFrames - 5) / 30;
    const vol = meanVol(t0 + 0.05, Math.max(0.2, d - 0.1));
    if (vol < -42) bad.push(`s${si + 1}l${li + 1}(${vol.toFixed(0)}dB)`);
  });
  at += sc.durationFrames;
});
add("voice lines audible at planned times (sync)", bad.length === 0, bad.join(" ") || "all lines OK");

// frames: extract 2 per scene; must be non-blank and must differ (animation present)
fs.mkdirSync("out/frames", {recursive: true});
const hashes = [];
let start = 0, blank = [], still = [];
props.scenes.forEach((sc, i) => {
  const hs = [];
  for (const [tag, f] of [["a", 0.25], ["b", 0.75]]) {
    const t = ((start + sc.durationFrames * f) / 30).toFixed(3), file = `out/frames/scene${i + 1}_${tag}.png`;
    spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", t, "-i", MP4, "-frames:v", "1", file]);
    if (!fs.existsSync(file) || fs.statSync(file).size < 30000) blank.push(file);
    else hs.push(crypto.createHash("sha1").update(fs.readFileSync(file)).digest("hex"));
  }
  if (hs.length === 2 && hs[0] === hs[1]) still.push(`scene${i + 1}`);
  hashes.push(...hs);
  start += sc.durationFrames;
});
add("frames not blank", blank.length === 0, blank.join(" ") || `${hashes.length} frames`);
add("every scene animates (not static)", still.length === 0, still.join(" ") || "ok");
add("scenes visually distinct", new Set(hashes).size === hashes.length, `${new Set(hashes).size}/${hashes.length} unique`);

fs.writeFileSync("out/qc-report.json", JSON.stringify({file: MP4, duration: dur, checks}, null, 2));
const failed = checks.filter((c) => !c.ok);
if (failed.length) { console.error(`\nQC FAILED: ${failed.map((c) => c.name).join("; ")}`); process.exit(1); }
console.log("\nQC PASSED. Open out/frames/*.png to eyeball character consistency.");
