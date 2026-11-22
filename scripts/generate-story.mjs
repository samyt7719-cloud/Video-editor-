// Topic -> out/story.json (+ out/storyboard.md).
// Priority: STORY_JSON env / story/input.json (pasted) > Anthropic API (ANTHROPIC_API_KEY) > error.
import fs from "node:fs";
import {writeStoryboard} from "./storyboard.mjs";

const topic = process.argv.slice(2).join(" ").trim() || process.env.TOPIC || "";
const EMO = ["neutral", "happy", "surprised", "sad", "excited", "curious"];
const ENV = ["forest", "glowing_forest", "sky", "sunset"];
const CAM = ["push", "orbit", "pan", "crane"];
const SFX = ["whoosh", "sparkle", "magic", "none"];
fs.mkdirSync("out", {recursive: true});

function validate(s) {
  const err = [];
  if (!s || typeof s !== "object") throw new Error("Story is not an object");
  if (!Array.isArray(s.characters) || !s.characters.length) err.push("characters missing");
  if (!Array.isArray(s.scenes) || s.scenes.length < 4 || s.scenes.length > 8) err.push("need 4-8 scenes");
  const ids = new Set((s.characters ?? []).map((c) => c.id));
  let words = 0;
  (s.scenes ?? []).forEach((sc, i) => {
    sc.sfx ??= "none"; sc.camera ??= "push"; sc.visual ??= sc.title ?? ""; sc.id ??= `s${i + 1}`;
    if (!ENV.includes(sc.environment)) err.push(`scene ${i + 1}: bad environment ${sc.environment}`);
    if (!CAM.includes(sc.camera)) err.push(`scene ${i + 1}: bad camera`);
    if (!SFX.includes(sc.sfx)) err.push(`scene ${i + 1}: bad sfx`);
    (sc.cast ?? []).forEach((c) => !ids.has(c.id) && err.push(`scene ${i + 1}: unknown cast ${c.id}`));
    if (!sc.lines?.length) err.push(`scene ${i + 1}: no lines`);
    (sc.lines ?? []).forEach((l) => {
      if (l.speaker !== "narrator" && !ids.has(l.speaker)) err.push(`scene ${i + 1}: unknown speaker ${l.speaker}`);
      if (!EMO.includes(l.emotion)) l.emotion = "neutral";
      words += l.text.trim().split(/\s+/).length;
    });
  });
  if (words > 70) err.push(`too many words (${words}); keep it under ~50 so it fits 30 seconds`);
  if (err.length) throw new Error("Story validation failed:\n- " + err.join("\n- "));
  console.log(`Story OK: ${s.scenes.length} scenes, ${words} words`);
  return s;
}

const SYSTEM = `You are a screenwriter for 9:16 animated shorts. Reply with ONE JSON object only (no markdown).
Rules:
- All spoken text in Hindi (Devanagari). Short, simple sentences. Kid-friendly, original story.
- The FIRST line (narrator) is a powerful hook question/statement; also copy it into "hook".
- 4 to 8 scenes (5 is ideal). TOTAL spoken words across all lines must be 40-50 (the video must be 15-30 seconds).
- characters: 2-3 items {id (ascii), name, type: "kid"|"tree"|"creature", color, accent, skin?, hair?, voice: "male"|"female"|"child"|"deep"}.
- scene: {id, title, visual (English camera/action note), environment: ${ENV.join("|")}, camera: ${CAM.join("|")}, sfx: ${SFX.join("|")}, cast:[{id,x,y?,z?,rotY?,action?:"idle|walk|wave|jump|fly|ride",enter?}], lines:[{speaker:"narrator"|characterId, text, emotion:${EMO.join("|")}}]}
- Camera frames about 4 world units across: keep |x| <= 1.8 for characters. Never put two characters at the same x.
- A kid riding a tree: tree {x:0,y:1,action:"fly"}, kid {x:0,y:3.7,action:"ride"}.
- Use "enter" (frame number, e.g. 18) for a character that magically appears.
- Keep scene continuity: same characters keep the same colors in every scene.
Schema: {title, hook, characters:[...], scenes:[...]}`;

async function callClaude(withSearch) {
  const body = {
    model: process.env.STORY_MODEL || "claude-sonnet-5-5",
    max_tokens: 4000,
    system: SYSTEM,
    messages: [{role: "user", content: `Topic: ${topic}\nIf the topic involves real-world facts, research them first and keep the story accurate. Return the JSON.`}],
  };
  if (withSearch) body.tools = [{type: "web_search_20250305", name: "web_search", max_uses: 3}];
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {"content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01"},
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`API ${r.status}: ${await r.text()}`);
  const j = await r.json();
  const text = j.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
  const a = text.indexOf("{"), b = text.lastIndexOf("}");
  return JSON.parse(text.slice(a, b + 1));
}

let story;
const pasted = process.env.STORY_JSON?.trim() ? process.env.STORY_JSON : fs.existsSync("story/input.json") ? fs.readFileSync("story/input.json", "utf8") : null;
if (pasted) {
  console.log("Using pasted story JSON");
  story = validate(JSON.parse(pasted));
} else if (process.env.ANTHROPIC_API_KEY) {
  if (!topic) throw new Error("No topic given");
  console.log(`Writing story for: ${topic}`);
  let lastErr;
  for (const search of [true, false, false]) {
    try { story = validate(await callClaude(search)); break; } catch (e) { lastErr = e; console.warn("Attempt failed:", e.message.slice(0, 300)); }
  }
  if (!story) throw lastErr;
} else {
  throw new Error("No ANTHROPIC_API_KEY and no pasted story. Set the secret, or paste story JSON (see story/example.json).");
}
fs.writeFileSync("out/story.json", JSON.stringify(story, null, 2));
writeStoryboard(story, "out/storyboard.md");
console.log("Wrote out/story.json and out/storyboard.md");
