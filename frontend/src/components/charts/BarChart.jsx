import React, { useState } from 'react';
import { AXIS, GRID } from './palette';

// Vertical bar chart drawn as plain SVG.
//
// Bars carry 4px rounded ends at the top only, anchored to the baseline, and a
// 2px surface gap between neighbours. Values are labelled directly above each
// bar, which is also what discharges the contrast relief rule for the lighter
// fills.

const BarChart = ({
    data,
    color,
    height = 260,
    valueFormat = (value) => value,
    labelFormat = (label) => label,
    emptyMessage = 'No data yet',
    // Rotates the category labels when they are too long to sit side by side.
    rotateLabels = false,
}) => {
    const [hovered, setHovered] = useState(null);

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center text-sm text-gray-500" style={{ height }}>
                {emptyMessage}
            </div>
        );
    }

    const width = 640;
    // Rotated labels need more room beneath the axis.
    const padding = { top: 28, right: 12, bottom: rotateLabels ? 62 : 34, left: 44 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    const max = Math.max(...data.map((point) => point.value), 1);
    const slot = plotWidth / data.length;
    const barWidth = Math.max(2, slot - 2); // the 2px gap between fills

    // A value above every bar needs roughly 22px of slot to stay legible.
    const showEveryValue = slot >= 22;

    // Four gridlines are enough to read a level without competing with the bars.
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(max * ratio));

    return (
        <div className="relative">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full"
                style={{ height }}
                role="img"
                aria-label="Bar chart"
            >
                {ticks.map((tick) => {
                    const y = padding.top + plotHeight - (tick / max) * plotHeight;
                    return (
                        <g key={tick}>
                            <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke={GRID} strokeWidth="1" />
                            <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill={AXIS}>
                                {tick}
                            </text>
                        </g>
                    );
                })}

                {data.map((point, index) => {
                    const barHeight = (point.value / max) * plotHeight;
                    const x = padding.left + index * slot + (slot - barWidth) / 2;
                    const y = padding.top + plotHeight - barHeight;
                    const isHovered = hovered === index;

                    return (
                        <g
                            key={point.label}
                            onMouseEnter={() => setHovered(index)}
                            onMouseLeave={() => setHovered(null)}
                        >
                            {/* Full-height hit target, so hovering a short bar is easy. */}
                            <rect
                                x={padding.left + index * slot}
                                y={padding.top}
                                width={slot}
                                height={plotHeight}
                                fill="transparent"
                            />
                            <rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={Math.max(barHeight, point.value > 0 ? 2 : 0)}
                                rx="4"
                                fill={point.color || color}
                                opacity={hovered === null || isHovered ? 1 : 0.55}
                            />
                            {/* Direct value labels, thinned when the bars get
                                narrow so they never collide. The hovered bar
                                always shows its own value. */}
                            {(showEveryValue || isHovered) && (
                                <text
                                    x={x + barWidth / 2}
                                    y={y - 7}
                                    textAnchor="middle"
                                    fontSize="11"
                                    fill={isHovered ? '#111827' : '#6b7280'}
                                    fontWeight={isHovered ? 600 : 400}
                                >
                                    {valueFormat(point.value)}
                                </text>
                            )}
                            <text
                                x={x + barWidth / 2}
                                y={height - padding.bottom + (rotateLabels ? 12 : 16)}
                                textAnchor={rotateLabels ? 'end' : 'middle'}
                                fontSize="10"
                                fill={AXIS}
                                transform={
                                    rotateLabels
                                        ? `rotate(-45 ${x + barWidth / 2} ${height - padding.bottom + 12})`
                                        : undefined
                                }
                            >
                                {labelFormat(point.label)}
                            </text>
                        </g>
                    );
                })}

                <line
                    x1={padding.left}
                    x2={width - padding.right}
                    y1={padding.top + plotHeight}
                    y2={padding.top + plotHeight}
                    stroke={AXIS}
                    strokeWidth="1"
                />
            </svg>

            {hovered !== null && data[hovered].tooltip && (
                <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg">
                    {data[hovered].tooltip}
                </div>
            )}
        </div>
    );
};

export default BarChart;
