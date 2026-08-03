// Deterministic randomness for the seeder.
//
// Everything the seed decides — names, grades, who submitted late — comes from
// this generator, so re-running with the same seed produces byte-identical
// data. Math.random is never used.

const DEFAULT_SEED = 20240915;

// mulberry32: small, fast, and stable across Node versions, which matters more
// here than statistical quality.
const createRng = (seed = DEFAULT_SEED) => {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

const makeHelpers = (rng) => {
    const float = (min, max) => min + rng() * (max - min);
    const int = (min, max) => Math.floor(float(min, max + 1));
    const pick = (items) => items[int(0, items.length - 1)];
    const chance = (probability) => rng() < probability;

    // Fisher-Yates over a copy, so callers keep their input array.
    const shuffle = (items) => {
        const copy = [...items];
        for (let i = copy.length - 1; i > 0; i -= 1) {
            const j = int(0, i);
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    };

    const pickWeighted = (entries) => {
        const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
        let threshold = float(0, total);
        for (const entry of entries) {
            threshold -= entry.weight;
            if (threshold <= 0) return entry;
        }
        return entries[entries.length - 1];
    };

    // Box-Muller. Grades are normal around ~13/20 rather than uniform, so the
    // distribution chart shows a believable bell instead of a flat block.
    const normal = (mean, stdDev) => {
        const u = Math.max(rng(), Number.EPSILON);
        const v = rng();
        return mean + stdDev * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const normalClamped = (mean, stdDev, min, max, decimals = 2) => {
        const raw = clamp(normal(mean, stdDev), min, max);
        const factor = 10 ** decimals;
        return Math.round(raw * factor) / factor;
    };

    const dateBetween = (start, end) =>
        new Date(start.getTime() + rng() * (end.getTime() - start.getTime()));

    // Activity is denser on weekdays and during working hours. A timestamp that
    // lands on a weekend is pulled back to the preceding Friday most of the
    // time, which is what makes the submissions-over-time chart look real.
    const workingMoment = (date) => {
        const shifted = new Date(date);
        const day = shifted.getDay();
        if (day === 0 && chance(0.8)) shifted.setDate(shifted.getDate() - 2);
        else if (day === 6 && chance(0.8)) shifted.setDate(shifted.getDate() - 1);

        shifted.setHours(int(8, 22), int(0, 59), int(0, 59), 0);
        return shifted;
    };

    return { rng, float, int, pick, pickWeighted, chance, shuffle, normal, normalClamped, clamp, dateBetween, workingMoment };
};

module.exports = { createRng, makeHelpers, DEFAULT_SEED };
