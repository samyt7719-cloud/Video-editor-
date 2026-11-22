import React from "react";
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {World} from "../world/World";
import {CameraRig} from "../world/CameraRig";
import {Actor} from "../characters/Actor";
import {Captions, HookTitle} from "../components/Overlays";
import type {SceneDef, Story, Emotion} from "../types";

export const SceneView: React.FC<{story: Story; scene: SceneDef; index: number}> = ({story, scene, index}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const dur = scene.durationFrames ?? 90;
  const fadeIn = interpolate(frame, [0, 8], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const fadeOut = interpolate(frame, [dur - 8, dur], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const active = scene.lines.find((l) => frame >= (l.startFrame ?? 0) && frame < (l.startFrame ?? 0) + (l.durationFrames ?? 0));
  const lastLine = [...scene.lines].reverse().find((l) => frame >= (l.startFrame ?? 0));
  const emotion: Emotion = (active ?? lastLine)?.emotion ?? "neutral";

  return (
    <AbsoluteFill>
      <ThreeCanvas width={width} height={height} shadows camera={{fov: 40, position: [0, 3, 14], near: 0.1, far: 200}}>
        <CameraRig scene={scene} frame={frame} dur={dur} />
        <World kind={scene.environment} frame={frame} />
        {scene.cast.map((c, i) => {
          const def = story.characters.find((d) => d.id === c.id);
          if (!def) return null;
          const speaking = active && active.speaker === c.id ? active : undefined;
          const amp = speaking?.amp?.[frame - (speaking.startFrame ?? 0)] ?? 0;
          return <Actor key={c.id} item={c} def={def} frame={frame} dur={dur} amp={amp} emotion={emotion} seed={i + 1} />;
        })}
      </ThreeCanvas>
      {index === 0 && frame < 75 && <HookTitle text={story.hook} frame={frame} fps={fps} />}
      <Captions text={active?.text ?? ""} sinceStart={active ? frame - (active.startFrame ?? 0) : 0} />
      <AbsoluteFill style={{background: "#000", opacity: Math.max(fadeIn, fadeOut), pointerEvents: "none"}} />
      {scene.lines.map((l, i) =>
        l.file ? (
          <Sequence key={i} from={l.startFrame ?? 0} durationInFrames={Math.max(1, l.durationFrames ?? 1)}>
            <Audio src={staticFile(`audio/${l.file}`)} />
          </Sequence>
        ) : null
      )}
      {scene.sfx !== "none" && <Audio src={staticFile(`audio/sfx-${scene.sfx}.wav`)} volume={0.5} />}
    </AbsoluteFill>
  );
};
