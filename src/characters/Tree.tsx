import React from "react";
import {Face} from "./Face";
import type {ActorProps} from "./types";

export const Tree: React.FC<ActorProps> = ({def, frame, amp, emotion, action, seed}) => {
  const t = frame / 30;
  const fly = action === "fly";
  const sway = Math.sin(t * 1.6 + seed) * (fly ? 0.07 : 0.03);
  const leaf = def.color;
  const glow = def.accent;
  const armUp = action === "wave" || emotion === "excited" ? 0.9 + Math.sin(t * 8) * 0.3 : 0.5;
  const blobs: number[][] = [[0, 2.9, 0, 1.3], [-0.9, 2.5, 0.1, 0.85], [0.95, 2.55, 0, 0.85], [0.2, 3.6, -0.2, 0.8]];
  return (
    <group rotation={[0, 0, sway]}>
      <mesh castShadow position={[0, 1.0, 0]}>
        <capsuleGeometry args={[0.6, 0.8, 8, 20]} />
        <meshStandardMaterial color="#8a5a35" roughness={0.9} />
      </mesh>
      <group position={[0, 1.2, 0.06]}>
        <Face emotion={emotion} amp={amp} frame={frame} seed={seed} />
      </group>
      {blobs.map(([x, y, z, r], i) => (
        <mesh key={i} castShadow position={[x, y + Math.sin(t * 2 + i) * 0.03, z]}>
          <sphereGeometry args={[r, 24, 18]} />
          <meshStandardMaterial color={leaf} roughness={0.8} emissive={glow} emissiveIntensity={0.18} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.55, 1.4, 0]} rotation={[0, 0, s * armUp]}>
          <mesh castShadow position={[s * 0.35, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.09, 0.5, 4, 8]} />
            <meshStandardMaterial color="#8a5a35" />
          </mesh>
        </group>
      ))}
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        const dang = fly ? Math.sin(t * 3 + i) * 0.25 : 0;
        return (
          <group key={i} position={[Math.cos(a) * 0.35, 0.1, Math.sin(a) * 0.35]} rotation={[dang, 0, fly ? 0 : Math.cos(a) * 1.0]}>
            <mesh position={[0, fly ? -0.5 : -0.05, 0]} rotation={[fly ? 0 : Math.PI / 2.3, 0, 0]}>
              <capsuleGeometry args={[0.09, fly ? 0.8 : 0.5, 4, 8]} />
              <meshStandardMaterial color="#6e4528" />
            </mesh>
          </group>
        );
      })}
      <pointLight position={[0, 3, 1]} color={glow} intensity={fly ? 14 : 6} distance={9} />
      {Array.from({length: 7}, (_, i) => {
        const a = t * 1.5 + (i / 7) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.9, 2.8 + Math.sin(t * 2 + i) * 0.5, Math.sin(a) * 1.9]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshBasicMaterial color={glow} />
          </mesh>
        );
      })}
    </group>
  );
};
