import React, { useState } from 'react';
import { AXIS, GRID } from './palette';

// Multi-series line chart with a crosshair and a shared tooltip.
//
// One y-axis only: every series passed in must already share a scale. Two
// measures of different magnitude belong in two charts, never on twin axes.

const LineChart = ({
    series,
    labels,
    height = 280,
    valueFormat = (value) => value,
    emptyMessage = 'No data yet',
}) => {
    const [active, setActive] = useState(null);

    const hasData = series?.some((entry) => entry.points.some((point) => point !== null));
    if (!hasData) {
        return (
            <div className="flex items-center justify-center text-sm text-gray-500" style={{ height }}>
                {emptyMessage}
            </div>
        );
    }

    const width = 640;
    const padding = { top: 20, right: 16, bottom: 34, left: 44 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    const values = series.flatMap((entry) => entry.points).filter((value) => value !== null);
    const max = Math.max(...values, 1);
    const count = labels.length;

    const xFor = (index) => (count === 1 ? padding.left + plotWidth / 2 : padding.left + (index / (count - 1)) * plotWidth);
    const yFor = (value) => padding.top + plotHeight - (value / max) * plotHeight;

    const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(max * ratio));

    // Labels are thinned so they never collide on a narrow chart.
    const labelEvery = Math.max(1, Math.ceil(count / 8));

    return (
        <div className="relative">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full"
                style={{ height }}
                role="img"
                aria-label="Line chart"
                onMouseLeave={() => setActive(null)}
            >
                {ticks.map((tick) => {
                    const y = yFor(tick);
                    return (
                        <g key={tick}>
                            <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke={GRID} strokeWidth="1" />
                            <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill={AXIS}>
                                {tick}
                            </text>
                        </g>
                    );
                })}

                {active !== null && (
                    <line
                        x1={xFor(active)}
                        x2={xFor(active)}
                        y1={padding.top}
                        y2={padding.top + plotHeight}
                        stroke={AXIS}
                        strokeWidth="1"
                        strokeDasharray="3 3"
                    />
                )}

                {series.map((entry) => {
                    const path = entry.points
                        .map((value, index) => (value === null ? null : `${index === 0 ? 'M' : 'L'} ${xFor(index)} ${yFor(value)}`))
                        .filter(Boolean)
                        .join(' ');

                    return (
                        <g key={entry.name}>
                            <path d={path} fill="none" stroke={entry.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                            {active !== null && entry.points[active] !== null && (
                                <circle
                                    cx={xFor(active)}
                                    cy={yFor(entry.points[active])}
                                    r="5"
                                    fill={entry.color}
                                    // 2px surface ring keeps overlapping markers readable.
                                    stroke="#ffffff"
                                    strokeWidth="2"
                                />
                            )}
                        </g>
                    );
                })}

                {labels.map((label, index) => (
                    <g key={`${label}-${index}`}>
                        <rect
                            x={xFor(index) - plotWidth / Math.max(count, 1) / 2}
                            y={padding.top}
                            width={plotWidth / Math.max(count, 1)}
                            height={plotHeight}
                            fill="transparent"
                            onMouseEnter={() => setActive(index)}
                        />
                        {index % labelEvery === 0 && (
                            <text x={xFor(index)} y={height - padding.bottom + 16} textAnchor="middle" fontSize="10" fill={AXIS}>
                                {label}
                            </text>
                        )}
                    </g>
                ))}

                <line
                    x1={padding.left}
                    x2={width - padding.right}
                    y1={padding.top + plotHeight}
                    y2={padding.top + plotHeight}
                    stroke={AXIS}
                    strokeWidth="1"
                />
            </svg>

            {/* A legend is always present for two or more series. */}
            {series.length > 1 && (
                <div className="mt-2 flex flex-wrap items-center gap-4 pl-11">
                    {series.map((entry) => (
                        <span key={entry.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
                            {entry.name}
                        </span>
                    ))}
                </div>
            )}

            {active !== null && (
                <div className="pointer-events-none absolute right-2 top-0 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg">
                    <div className="mb-1 font-semibold">{labels[active]}</div>
                    {series.map((entry) => (
                        <div key={entry.name} className="flex items-center gap-2">
                            <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: entry.color }} />
                            <span className="text-gray-300">{entry.name}</span>
                            <span className="ml-auto font-medium">
                                {entry.points[active] === null ? '—' : valueFormat(entry.points[active])}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LineChart;
