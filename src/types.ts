export type Emotion = "neutral" | "happy" | "surprised" | "sad" | "excited" | "curious";
export type Action = "idle" | "walk" | "wave" | "jump" | "fly" | "ride";

export type CharacterDef = {
  id: string;
  name: string;
  type: "kid" | "tree" | "creature";
  color: string;
  accent: string;
  skin?: string;
  hair?: string;
  voice?: "male" | "female" | "child" | "deep";
};

export type CastItem = {
  id: string;
  x: number;
  y?: number;
  z?: number;
  rotY?: number;
  scale?: number;
  action?: Action;
  enter?: number; // frame at which the character pops in
};

export type Line = {
  speaker: string; // character id or "narrator"
  text: string;
  emotion: Emotion;
  file?: string;
  startFrame?: number;
  durationFrames?: number;
  amp?: number[]; // per-frame mouth openness 0..1 (from the real audio)
};

export type SceneDef = {
  id: string;
  title: string;
  visual: string;
  environment: "forest" | "glowing_forest" | "sky" | "sunset";
  camera: "push" | "orbit" | "pan" | "crane";
  sfx: "whoosh" | "sparkle" | "magic" | "none";
  cast: CastItem[];
  lines: Line[];
  durationFrames?: number;
};

export type Story = {
  title: string;
  hook: string;
  characters: CharacterDef[];
  scenes: SceneDef[];
  totalFrames?: number;
};
