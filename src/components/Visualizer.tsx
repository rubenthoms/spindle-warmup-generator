import React from "react";
import { SpindleCommand } from "../App";

export type VisualizerProps = {
    maxRPM: number;
    spindleCommands: SpindleCommand[];
};

export function Visualizer(props: VisualizerProps): React.ReactNode {

    const height = 800
    const maxDurationMs = props.spindleCommands.reduce((acc, command) => acc + command.durationMs, 0);
    const widthPerMs = 720 / maxDurationMs;
    const heightPerRPM = height / props.maxRPM;

    return (
        <svg style={{
            width: 720,
            height,
        }}>
            <line x1={0} y1={0} x2={720} y2={0} stroke="black" />
            <text x={0} y={0} fontSize={12} fill="black">{props.maxRPM} rpm</text>
            {props.spindleCommands.map((command, index) => {
                const x = props.spindleCommands.slice(0, index).reduce((acc, c) => acc + c.durationMs, 0) * widthPerMs;
                const w = command.durationMs * widthPerMs;
                const h = command.rpm * heightPerRPM;
                return (
                    <rect key={command.id} x={x} y={height - h} width={w} height={h} fill="blue" />
                )
            })}
        </svg>
    )
}