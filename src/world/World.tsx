import React, {useMemo} from "react";
import {random} from "remotion";

type Env = {sky: string; fog: string; ground: string | null; leaf: string; sun: string; light: number; trees: number; fireflies: number; clouds: number; cloudSpeed: number};

const ENVS: Record<string, Env> = {
  forest: {sky: "#8fdcff", fog: "#c4f0d8", ground: "#4caf50", leaf: "#2e9b4e", sun: "#fff3cf", light: 1.1, trees: 22, fireflies: 0, clouds: 4, cloudSpeed: 0.02},
  glowing_forest: {sky: "#2a1c5c", fog: "#3b2b7d", ground: "#2f7d5b", leaf: "#1f8f7a", sun: "#b8a8ff", light: 0.55, trees: 22, fireflies: 45, clouds: 0, cloudSpeed: 0},
  sky: {sky: "#62c0ff", fog: "#d6f0ff", ground: null, leaf: "#2e9b4e", sun: "#fff6d8", light: 1.2, trees: 0, fireflies: 0, clouds: 16, cloudSpeed: 0.5},
  sunset: {sky: "#ff9c5c", fog: "#ffc690", ground: "#7a9b4a", leaf: "#3f8f45", sun: "#ffb070", light: 0.95, trees: 12, fireflies: 14, clouds: 7, cloudSpeed: 0.05},
};

export const World: React.FC<{kind: string; frame: number}> = ({kind, frame}) => {
  const cfg = ENVS[kind] ?? ENVS.forest;
  const t = frame / 30;
  const trees = useMemo(
    () =>
      Array.from({length: cfg.trees}, (_, i) => {
        const r1 = random(`tx${kind}${i}`), r2 = random(`tz${kind}${i}`), r3 = random(`ts${kind}${i}`);
        let x = (r1 * 2 - 1) * 16;
        if (Math.abs(x) < 3.2) x += x < 0 ? -3.5 : 3.5;
        return {x, z: -3 - r2 * 30, s: 0.8 + r3 * 0.9, h: r3};
      }),
    [kind, cfg.trees]
  );
  const clouds = Array.from({length: cfg.clouds}, (_, i) => {
    const r1 = random(`cx${i}`), r2 = random(`cy${i}`), r3 = random(`cz${i}`);
    const z = ((r3 * 60 + frame * cfg.cloudSpeed) % 60) - 48;
    return {x: (r1 * 2 - 1) * 15, y: cfg.ground ? 7 + r2 * 6 : -3 + r2 * 14, z, s: 0.9 + r2 * 1.2};
  });
  const flies = Array.from({length: cfg.fireflies}, (_, i) => ({
    x: (random(`fx${i}`) * 2 - 1) * 7 + Math.sin(t * 0.8 + i) * 0.5,
    y: 0.6 + random(`fy${i}`) * 5 + Math.sin(t * 1.3 + i * 2) * 0.4,
    z: -6 + random(`fz${i}`) * 9,
    s: 0.7 + 0.5 * Math.sin(t * 4 + i),
  }));
  const flowers = useMemo(
    () => (cfg.ground ? Array.from({length: 28}, (_, i) => ({x: (random(`wx${i}`) * 2 - 1) * 6, z: -5 + random(`wz${i}`) * 7, c: ["#ff7aa8", "#ffd84d", "#ffffff", "#b38cff"][i % 4]})) : []),
    [cfg.ground]
  );

  return (
    <>
      <color attach="background" args={[cfg.sky]} />
      <fog attach="fog" args={[cfg.fog, 14, 55]} />
      <ambientLight intensity={cfg.light * 0.5} />
      <hemisphereLight args={[cfg.sky, cfg.ground ?? "#ffffff", 0.5]} />
      <directionalLight
        position={[6, 12, 8]}
        intensity={cfg.light * 1.6}
        color={cfg.sun}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-near={1}
        shadow-camera-far={40}
      />
      {cfg.ground && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[60, 48]} />
            <meshStandardMaterial color={cfg.ground} />
          </mesh>
          {[-22, 0, 24].map((x, i) => (
            <mesh key={i} position={[x, -3, -42]} scale={[1, 0.5, 0.6]}>
              <sphereGeometry args={[18 + i * 2, 24, 16]} />
              <meshStandardMaterial color={cfg.ground} />
            </mesh>
          ))}
        </>
      )}
      {!cfg.ground && (
        <mesh position={[7, 10, -32]}>
          <sphereGeometry args={[4, 24, 16]} />
          <meshBasicMaterial color="#fff2b0" />
        </mesh>
      )}
      {trees.map((tr, i) => (
        <group key={i} position={[tr.x, 0, tr.z]} scale={tr.s} rotation={[0, 0, Math.sin(t * 1.2 + i) * 0.02]}>
          <mesh castShadow position={[0, 0.8, 0]}>
            <cylinderGeometry args={[0.25, 0.32, 1.6, 10]} />
            <meshStandardMaterial color="#7a4a2b" />
          </mesh>
          <mesh castShadow position={[0, 2.4, 0]}>
            <coneGeometry args={[1.3, 2.2, 12]} />
            <meshStandardMaterial color={cfg.leaf} emissive={cfg.leaf} emissiveIntensity={kind === "glowing_forest" ? 0.25 : 0.03} />
          </mesh>
          <mesh castShadow position={[0, 3.5, 0]}>
            <coneGeometry args={[1.0, 1.8, 12]} />
            <meshStandardMaterial color={cfg.leaf} emissive={cfg.leaf} emissiveIntensity={kind === "glowing_forest" ? 0.25 : 0.03} />
          </mesh>
        </group>
      ))}
      {flowers.map((f, i) => (
        <mesh key={i} position={[f.x, 0.1, f.z]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color={f.c} />
        </mesh>
      ))}
      {clouds.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]} scale={c.s}>
          {[[0, 0, 0, 1.6], [1.4, -0.2, 0, 1.2], [-1.4, -0.2, 0, 1.2]].map(([x, y, z, r], j) => (
            <mesh key={j} position={[x, y, z]}>
              <sphereGeometry args={[r, 16, 12]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.35} />
            </mesh>
          ))}
        </group>
      ))}
      {flies.map((f, i) => (
        <mesh key={i} position={[f.x, f.y, f.z]} scale={f.s}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color="#ffe98a" />
        </mesh>
      ))}
    </>
  );
};
