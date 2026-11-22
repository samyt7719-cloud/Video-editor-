import React from "react";
import {Face} from "./Face";
import type {ActorProps} from "./types";

export const Creature: React.FC<ActorProps> = ({def, frame, amp, emotion, seed}) => {
  const t = frame / 30;
  const flap = Math.sin(t * 16 + seed) * 0.7;
  return (
    <group position={[0, 1.3 + Math.sin(t * 2.4 + seed) * 0.18, 0]}>
      <mesh castShadow scale={[1, 0.95, 0.95]}>
        <sphereGeometry args={[0.62, 28, 20]} />
        <meshStandardMaterial color={def.color} roughness={0.6} />
      </mesh>
      <Face emotion={emotion} amp={amp} frame={frame} seed={seed} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 0.35, 0.68, 0]} rotation={[0, 0, -s * 0.35]}>
            <coneGeometry args={[0.16, 0.4, 12]} />
            <meshStandardMaterial color={def.accent} />
          </mesh>
          <group position={[s * 0.6, 0.1, -0.1]} rotation={[0, 0, s * (0.5 + flap)]}>
            <mesh position={[s * 0.4, 0, 0]} scale={[1, 0.14, 0.6]}>
              <sphereGeometry args={[0.5, 16, 12]} />
              <meshStandardMaterial color={def.accent} transparent opacity={0.85} emissive={def.accent} emissiveIntensity={0.3} />
            </mesh>
          </group>
        </group>
      ))}
      <mesh position={[0, -0.1, -0.65]}>
        <sphereGeometry args={[0.16, 12, 10]} />
        <meshBasicMaterial color={def.accent} />
      </mesh>
      <pointLight color={def.accent} intensity={3} distance={5} />
    </group>
  );
};
