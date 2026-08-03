// Chart colours.
//
// The three categorical slots are validated as a set: worst adjacent CVD
// separation 9.2 and normal-vision 27.6, both clear of the floors. Aqua sits
// below 3:1 against a light surface, so every chart using it also carries
// visible value labels rather than relying on the fill alone.
//
// Colours are assigned to a series by identity, never by rank, so filtering a
// chart never repaints the series that remain.

export const SERIES = {
    blue: '#2a78d6',
    orange: '#eb6834',
    aqua: '#1baf7a',
};

// Single-hue blue ramp for magnitude. Steps run light to dark; the lightest
// steps mean "near zero".
export const SEQUENTIAL = [
    '#cde2fb',
    '#b7d3f6',
    '#9ec5f4',
    '#86b6ef',
    '#6da7ec',
    '#5598e7',
    '#3987e5',
    '#2a78d6',
    '#256abf',
    '#1c5cab',
];

// Fixed status colours, never reused for a series. Each is paired with a label
// in the UI so state is never carried by colour alone.
export const STATUS = {
    good: '#0ca30c',
    warning: '#fab219',
    serious: '#ec835a',
    critical: '#d03b3b',
};

// Recessive chrome, so the data stays the most prominent thing on the canvas.
export const AXIS = '#9ca3af';
export const GRID = '#e5e7eb';

// Picks a ramp step from a normalised 0-1 value.
export const sequentialStep = (ratio) => {
    if (!Number.isFinite(ratio)) return SEQUENTIAL[0];
    const index = Math.round(Math.min(Math.max(ratio, 0), 1) * (SEQUENTIAL.length - 1));
    return SEQUENTIAL[index];
};

// Grades are marked out of 20; 10 is the pass mark.
export const gradeStatus = (grade) => {
    if (grade === null || grade === undefined) return null;
    if (grade >= 14) return 'good';
    if (grade >= 10) return 'warning';
    return 'critical';
};
