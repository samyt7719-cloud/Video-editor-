# Autonomous 3D Cartoon Movie Studio

One topic in -> researched Hindi story -> storyboard -> 3D animated scenes -> Hindi voice + music + SFX -> 1080x1920, 30 fps H.264 MP4 -> automatic QC.

## Use it from your phone (GitHub Actions)
1. Copy this folder's contents to the root of your repo, commit, push.
2. (Recommended) Repo -> Settings -> Secrets -> Actions -> add `ANTHROPIC_API_KEY`. Optional repo variable: set `STORY_MODEL` in `generate-story.mjs` env if you want another model.
   No key? Paste a story JSON (format: `story/example.json`) into the `story_json` input and the studio skips the LLM.
3. Actions -> **Render Cartoon Movie** -> Run workflow -> type your topic.
4. When finished, open the run -> **Artifacts -> cartoon-movie** -> `movie.mp4`, `story.json`, `storyboard.md`, `qc-report.json`, `frames/`.

## Local
```
npm install
pip install piper-tts edge-tts      # + ffmpeg installed
export ANTHROPIC_API_KEY=...        # or: cp story/example.json story/input.json
TOPIC="A little boy discovers a magical flying tree" npm run studio
npm run preview                      # Remotion Studio (after `story` + `audio`)
```

## Pipeline
| Step | File | Output |
|---|---|---|
| Story + research | `scripts/generate-story.mjs` (Claude + web search, validated) | `out/story.json`, `out/storyboard.md` |
| Audio | `scripts/make-audio.mjs` (Piper Hindi TTS -> edge-tts fallback; ffmpeg music/SFX) | `public/audio/*`, `out/props.json` (exact timings + lip-sync envelopes) |
| Animation | `src/` (Remotion + React Three Fiber, GSAP title) | frames |
| Render | `npm run render` (`--gl=swangle`, h264, crf 20) | `out/movie.mp4` |
| QC | `scripts/qc.mjs` | `out/qc-report.json`, `out/frames/*.png` |

QC fails the workflow unless: h264, 1080x1920, 30 fps, yuv420p, 15-30 s, duration equals the plan, AAC audio present and not silent, **every voice line is audible at its planned time (sync)**, frames not blank, every scene animates, scenes differ.

## Customize
- Characters: `src/characters/` (kid, tree, creature; all share `Face.tsx` for expressions; mouth is driven by the real audio loudness).
- Worlds: `src/world/World.tsx`. Cameras: `src/world/CameraRig.tsx`.
- Own music: put `assets/music.mp3` in the repo (it replaces the synthesized pad).
- Paid APIs: none are required. Only the story step uses the Anthropic API, and only if you add the key.

## Known limits
- Software WebGL on GitHub runners is slow: expect roughly 20-60 min per video.
- Music/SFX are simple synthesized sounds; drop in CC0 files for richer audio.
- Remotion packages are pinned to `4.0.250`; if npm cannot find it, change all four `remotion`/`@remotion/*` versions to the same existing one.
