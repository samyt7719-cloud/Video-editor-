import React, {useLayoutEffect} from "react";
import {useThree} from "@react-three/fiber";
import type {SceneDef} from "../types";

export const CameraRig: React.FC<{scene: SceneDef; frame: number; dur: number}> = ({scene, frame, dur}) => {
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    const t = frame / Math.max(1, dur - 1);
    const e = t * t * (3 - 2 * t);
    const ys = scene.cast.map((c) => c.y ?? 0);
    const tx = scene.cast.length ? scene.cast.reduce((a, c) => a + c.x, 0) / scene.cast.length : 0;
    const ty = (ys.length ? Math.min(...ys) : 0) + 2.2;
    let p: [number, number, number];
    switch (scene.camera) {
      case "orbit": {
        const a = -0.55 + 1.1 * e;
        p = [tx + Math.sin(a) * 11, ty + 1.2, Math.cos(a) * 11];
        break;
      }
      case "pan": p = [tx - 2 + 4 * e, ty + 1.2, 12]; break;
      case "crane": p = [tx, ty - 1.2 + 4 * e, 12.5 - e]; break;
      default: p = [tx + 0.6 - 0.6 * e, ty + 1.0, 14 - 4.5 * e];
    }
    camera.position.set(p[0], p[1], p[2]);
    camera.lookAt(tx, ty, 0);
    camera.updateProjectionMatrix();
  });
  return null;
};
