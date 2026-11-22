import React from "react";
import {Face} from "./Face";
import type {ActorProps} from "./types";

export const Kid: React.FC<ActorProps> = ({def, frame, amp, emotion, action, seed}) => {
  const t = frame / 30;
  const skin = def.skin ?? "#f2c29b";
  const hair = def.hair ?? "#3a2415";
  const walk = action === "walk";
  const ride = action === "ride";
  const bob = walk ? Math.abs(Math.sin(t * 7)) * 0.08 : Math.sin(t * 2.2 + seed) * 0.025;
  const jumpY = action === "jump" ? Math.abs(Math.sin(t * 4)) * 0.6 : 0;
  const swing = walk ? Math.sin(t * 7) * 0.7 : 0;
  const cheer = emotion === "excited" || ride;
  const armR = action === "wave" ? 2.6 + Math.sin(t * 10) * 0.35 : cheer ? 2.4 + Math.sin(t * 6) * 0.25 : 0.12;
  const armL = cheer ? -(2.4 + Math.sin(t * 6 + 1) * 0.25) : -0.12;
  const legX = ride ? -1.35 : 0;
  return (
    <group position={[0, bob + jumpY, 0]}>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.2, 0.65, 0]} rotation={[ride ? legX : s * swing, 0, 0]}>
          <mesh castShadow position={[0, -0.28, 0]}>
            <capsuleGeometry args={[0.15, 0.3, 6, 12]} />
            <meshStandardMaterial color="#3f5fa8" />
          </mesh>
          <mesh castShadow position={[0, -0.62, 0.06]} scale={[1, 0.6, 1.4]}>
            <sphereGeometry args={[0.17, 12, 10]} />
            <meshStandardMaterial color="#f4f4f4" />
          </mesh>
        </group>
      ))}
      <mesh castShadow position={[0, 1.05, 0]}>
        <capsuleGeometry args={[0.38, 0.5, 8, 16]} />
        <meshStandardMaterial color={def.color} roughness={0.7} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.5, 1.45, 0]} rotation={[s === 1 ? (walk ? -swing : 0) : walk ? swing : 0, 0, s === 1 ? armR : armL]}>
          <mesh castShadow position={[0, -0.28, 0]}>
            <capsuleGeometry args={[0.12, 0.42, 6, 10]} />
            <meshStandardMaterial color={def.color} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.62, 0]}>
            <sphereGeometry args={[0.13, 12, 10]} />
            <meshStandardMaterial color={skin} />
          </mesh>
        </group>
      ))}
      <group position={[0, 2.05, 0]} rotation={[0, Math.sin(t * 1.3 + seed) * 0.08, Math.sin(t * 2 + seed) * 0.03]}>
        <mesh castShadow>
          <sphereGeometry args={[0.62, 32, 24]} />
          <meshStandardMaterial color={skin} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.04, -0.04]} rotation={[-0.3, 0, 0]}>
          <sphereGeometry args={[0.66, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial color={hair} roughness={0.8} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.62, -0.02, 0]}>
            <sphereGeometry args={[0.12, 12, 10]} />
            <meshStandardMaterial color={skin} />
          </mesh>
        ))}
        <Face emotion={emotion} amp={amp} frame={frame} seed={seed} />
      </group>
    </group>
  );
};
