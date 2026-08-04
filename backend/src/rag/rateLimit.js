// Per-user chat rate limiting: 20 messages per rolling hour.
//
// Held in memory. A restart clears the counters and a second instance keeps
// its own — acceptable for a demo deployment running one free-tier instance,
// where the limit exists to bound API spend rather than to enforce a quota.
// Moving to a shared store is the change to make if this is ever scaled out.

const WINDOW_MS = 60 * 60 * 1000;
const MAX_MESSAGES = Number(process.env.CHAT_RATE_LIMIT || 20);

const hits = new Map();

// Timestamps older than the window are dropped on read, so the map only ever
// holds recent activity for users who are actually chatting.
const recentHits = (userId, now) => {
    const timestamps = hits.get(userId) || [];
    const fresh = timestamps.filter((timestamp) => now - timestamp < WINDOW_MS);

    if (fresh.length) hits.set(userId, fresh);
    else hits.delete(userId);

    return fresh;
};

// Records a message and reports whether it was allowed.
const consume = (userId) => {
    const now = Date.now();
    const fresh = recentHits(userId, now);

    if (fresh.length >= MAX_MESSAGES) {
        const retryAfterMs = WINDOW_MS - (now - fresh[0]);
        return {
            allowed: false,
            remaining: 0,
            retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
        };
    }

    fresh.push(now);
    hits.set(userId, fresh);

    return { allowed: true, remaining: MAX_MESSAGES - fresh.length, retryAfterSeconds: 0 };
};

// Read-only view, for showing the remaining allowance without spending one.
const peek = (userId) => {
    const fresh = recentHits(userId, Date.now());
    return { remaining: Math.max(0, MAX_MESSAGES - fresh.length), limit: MAX_MESSAGES };
};

module.exports = { consume, peek, MAX_MESSAGES, WINDOW_MS };
