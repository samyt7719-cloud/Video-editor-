import React, {useLayoutEffect, useRef} from "react";
import {AbsoluteFill, interpolate, spring, useVideoConfig} from "remotion";
import {loadFont} from "@remotion/google-fonts/NotoSansDevanagari";
import gsap from "gsap";

const {fontFamily} = loadFont("normal", {weights: ["700"], subsets: ["devanagari", "latin"]});

export const Captions: React.FC<{text: string; sinceStart: number}> = ({text, sinceStart}) => {
  const {fps} = useVideoConfig();
  const pop = spring({frame: sinceStart, fps, config: {damping: 12, stiffness: 180}});
  if (!text) return null;
  return (
    <AbsoluteFill style={{justifyContent: "flex-end", alignItems: "center", paddingBottom: 300}}>
      <div
        style={{
          fontFamily, fontWeight: 700, fontSize: 68, lineHeight: 1.3, color: "#fff", textAlign: "center",
          padding: "0 70px", transform: `scale(${0.85 + 0.15 * pop})`, opacity: interpolate(sinceStart, [0, 4], [0, 1], {extrapolateRight: "clamp"}),
          textShadow: "0 4px 0 #000, 0 0 18px rgba(0,0,0,.8), 3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

// GSAP timeline, seeked per frame so rendering stays deterministic.
export const HookTitle: React.FC<{text: string; frame: number; fps: number}> = ({text, frame, fps}) => {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const tl = gsap.timeline({paused: true});
    tl.fromTo(ref.current, {y: -90, opacity: 0, scale: 0.6}, {y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)"}).to(ref.current, {opacity: 0, y: -50, duration: 0.4}, 2.0);
    tl.seek(frame / fps);
    return () => {
      tl.kill();
    };
  }, [frame, fps]);
  return (
    <AbsoluteFill style={{alignItems: "center", paddingTop: 200}}>
      <div ref={ref} style={{fontFamily, fontWeight: 700, fontSize: 88, lineHeight: 1.25, textAlign: "center", color: "#ffe14d", padding: "0 60px", textShadow: "0 6px 0 #7a3b00, 0 0 24px rgba(0,0,0,.6)", opacity: 0}}>
        {text}
      </div>
    </AbsoluteFill>
  );
};
