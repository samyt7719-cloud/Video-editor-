import fs from "node:fs";
export function writeStoryboard(story, file) {
  const names = Object.fromEntries(story.characters.map((c) => [c.id, c.name]));
  names.narrator = "Narrator";
  let md = `# ${story.title}\n\n**Hook:** ${story.hook}\n\n`;
  md += `## Characters\n` + story.characters.map((c) => `- **${c.name}** (${c.type}, voice: ${c.voice ?? "male"})`).join("\n") + "\n\n";
  story.scenes.forEach((s, i) => {
    md += `## Scene ${i + 1}: ${s.title}\n- Visual: ${s.visual}\n- Environment: ${s.environment} | Camera: ${s.camera} | SFX: ${s.sfx}\n- Cast: ${s.cast.map((c) => `${names[c.id]} (${c.action ?? "idle"})`).join(", ")}\n`;
    if (s.durationFrames) md += `- Duration: ${(s.durationFrames / 30).toFixed(1)}s\n`;
    md += s.lines.map((l) => `  - ${names[l.speaker] ?? l.speaker} [${l.emotion}]: ${l.text}`).join("\n") + "\n\n";
  });
  fs.writeFileSync(file, md);
}
