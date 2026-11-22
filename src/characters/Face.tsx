import React from "react";
import type {Emotion} from "../types";

const R = 0.62;
const zOn = (x: number, y: number) => Math.sqrt(Math.max(0.01, R * R - x * x - y * y));

export const Face: React.FC<{emotion: Emotion; amp: number; frame: number; seed?: number}> = ({emotion, amp, frame, seed = 0}) => {
  const f = (frame + seed * 17) % 96;
  const blink = f >= 92 ? 0.12 : 1;
  const surprised = emotion === "surprised";
  const sad = emotion === "sad";
  const happy = emotion === "happy" || emotion === "excited";
  const eyeS = (surprised ? 1.25 : sad ? 0.9 : 1) * blink;
  const browRot = happy ? 0.14 : sad ? -0.32 : emotion === "curious" ? 0.22 : 0;
  const browY = surprised ? 0.24 : 0.17;
  const open = Math.min(1, (surprised ? 0.55 : emotion === "excited" ? 0.22 : 0) + amp * 0.95);
  const look = Math.sin(frame / 40 + seed) * 0.02;
  const mz = zOn(0, -0.22) + 0.01;

  return (
    <group>
      {[-1, 1].map((s) => {
        const x = s * 0.22;
        const y = 0.06;
        return (
          <group key={s}>
            <group position={[x, y, zOn(x, y) - 0.02]}>
              <mesh scale={[1, eyeS, 0.6]}>
                <sphereGeometry args={[0.13, 20, 16]} />
                <meshStandardMaterial color="#ffffff" roughness={0.3} />
              </mesh>
              <mesh position={[look, 0, 0.07]} scale={[1, eyeS, 0.5]}>
                <sphereGeometry args={[0.075, 16, 12]} />
                <meshStandardMaterial color="#1b1020" />
              </mesh>
              <mesh position={[look + 0.025, 0.03 * eyeS, 0.1]}>
                <sphereGeometry args={[0.025, 8, 8]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>
            <group position={[x, y + browY, zOn(x, y + browY)]} rotation={[0, 0, s * browRot]}>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <capsuleGeometry args={[0.02, 0.12, 4, 8]} />
                <meshStandardMaterial color="#2a1a12" />
              </mesh>
            </group>
            <mesh position={[s * 0.4, -0.13, zOn(s * 0.4, -0.13) - 0.01]} scale={[1, 0.7, 0.3]}>
              <sphereGeometry args={[0.09, 12, 10]} />
              <meshStandardMaterial color="#ff8f9a" transparent opacity={0.6} />
            </mesh>
          </group>
        );
      })}
      {open > 0.1 ? (
        <mesh position={[0, -0.22, mz]} scale={[(happy ? 1.4 : 1) * (0.9 - open * 0.25), 0.4 + open * 1.6, 0.3]}>
          <sphereGeometry args={[0.11, 16, 12]} />
          <meshStandardMaterial color="#5a1620" />
        </mesh>
      ) : (
        <mesh position={[0, sad ? -0.24 : -0.2, mz]} rotation={[0, 0, sad ? 0 : Math.PI]}>
          <torusGeometry args={[0.13, 0.022, 8, 20, Math.PI]} />
          <meshStandardMaterial color="#5a1620" />
        </mesh>
      )}
    </group>
  );
};
