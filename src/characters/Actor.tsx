import React from "react";
import {spring, useVideoConfig} from "remotion";
import {Kid} from "./Kid";
import {Tree} from "./Tree";
import {Creature} from "./Creature";
import type {CastItem, CharacterDef, Emotion} from "../types";

export const Actor: React.FC<{item: CastItem; def: CharacterDef; frame: number; dur: number; amp: number; emotion: Emotion; seed: number}> = ({
  item, def, frame, dur, amp, emotion, seed,
}) => {
  const {fps} = useVideoConfig();
  const action = item.action ?? "idle";
  const e = Math.min(1, frame / Math.max(1, dur - 1));
  const ease = e * e * (3 - 2 * e);
  const floaty = action === "fly" || action === "ride";
  const bob = floaty ? Math.sin(frame / 18) * 0.25 : 0;
  const sx = floaty ? Math.sin(frame / 40) * 0.3 : 0;
  const walkZ = action === "walk" ? -3 + 3 * ease : 0;
  let scale = item.scale ?? 1;
  if (item.enter !== undefined) {
    scale *= frame < item.enter ? 0.0001 : Math.max(0.0001, spring({frame: frame - item.enter, fps, config: {damping: 9, stiffness: 120}}));
  }
  const props = {def, frame, amp, emotion, action, seed};
  return (
    <group position={[item.x + sx, (item.y ?? 0) + bob, (item.z ?? 0) + walkZ]} rotation={[0, item.rotY ?? 0, 0]} scale={scale}>
      {def.type === "kid" && <Kid {...props} />}
      {def.type === "tree" && <Tree {...props} />}
      {def.type === "creature" && <Creature {...props} />}
    </group>
  );
};
