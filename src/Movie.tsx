import React from "react";
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile} from "remotion";
import {SceneView} from "./scenes/SceneView";
import type {Story} from "./types";

export const Movie: React.FC<Story> = (story) => {
  let from = 0;
  const total = story.totalFrames ?? 30;
  return (
    <AbsoluteFill style={{background: "#000"}}>
      {story.scenes.map((scene, i) => {
        const d = scene.durationFrames ?? 90;
        const el = (
          <Sequence key={scene.id} from={from} durationInFrames={d}>
            <SceneView story={story} scene={scene} index={i} />
          </Sequence>
        );
        from += d;
        return el;
      })}
      {story.scenes.length > 0 && (
        <Audio
          src={staticFile("audio/music.wav")}
          volume={(f) =>
            0.2 * interpolate(f, [0, 20, total - 30, total], [0, 1, 1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})
          }
        />
      )}
    </AbsoluteFill>
  );
};
