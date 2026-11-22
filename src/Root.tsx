import React from "react";
import {Composition} from "remotion";
import {Movie} from "./Movie";
import type {Story} from "./types";

const empty: Story = {title: "Preview", hook: "", characters: [], scenes: [], totalFrames: 30};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Movie"
    component={Movie}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={30}
    defaultProps={empty}
    calculateMetadata={({props}) => ({durationInFrames: Math.max(1, props.totalFrames ?? 30)})}
  />
);
