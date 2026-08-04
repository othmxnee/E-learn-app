// Retrieval: cosine similarity computed in Node.
//
// The specification allows Atlas Vector Search where available; this
// deployment is Postgres without pgvector, so the documented fallback applies.
// Only one module's chunks are scored per question — a few dozen 768-float
// vectors — which is well within what a single request can do.

const { Op } = require('sequelize');
const { Chunk } = require('../models');
const { embedQuery, EMBEDDING_MODEL } = require('./embeddings');

const TOP_K = Number(process.env.CHAT_TOP_K || 5);

// Below this, passages are unrelated to the question often enough that feeding
// them to the model invites invented answers. The chat endpoint treats an
// empty result as "not in the material".
//
// Calibrated against this corpus: on-topic questions score around 0.65-0.75
// and clearly off-topic ones around 0.45-0.50, because these embeddings put
// any two pieces of academic prose fairly close together. 0.55 sits in the gap.
const MIN_SIMILARITY = Number(process.env.CHAT_MIN_SIMILARITY || 0.55);

const cosineSimilarity = (a, b) => {
    if (!a || !b || a.length !== b.length) return -1;

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i += 1) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return -1;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Retrieves the passages most similar to `question` within one module
// allocation. Scoping the query to the allocation is also the access-control
// boundary: a student can only ever be answered from their own module.
const retrieveContext = async ({
    question,
    allocationId,
    adminId,
    topK = TOP_K,
    minSimilarity = MIN_SIMILARITY,
}) => {
    const rows = await Chunk.findAll({
        where: {
            allocationId,
            adminId,
            // Mixing embedding models would compare vectors from different
            // spaces, so only the current model's rows are considered.
            embeddingModel: EMBEDDING_MODEL,
        },
        attributes: ['id', 'text', 'page', 'materialId', 'materialName', 'embedding'],
        raw: true,
    });

    if (!rows.length) return { matches: [], indexed: false };

    const queryVector = await embedQuery(question);

    const scored = rows
        .map((row) => ({
            id: row.id,
            text: row.text,
            page: row.page,
            materialId: row.materialId,
            materialName: row.materialName,
            score: cosineSimilarity(queryVector, row.embedding),
        }))
        .sort((a, b) => b.score - a.score);

    // Materials share source files, so several of them can carry byte-identical
    // passages. Keeping only the first occurrence of a given passage stops one
    // document from filling every slot and from being cited three times over.
    const seenText = new Set();
    const matches = [];

    for (const match of scored) {
        if (match.score < minSimilarity) break;

        const fingerprint = `${match.text.length}:${match.text.slice(0, 200)}`;
        if (seenText.has(fingerprint)) continue;
        seenText.add(fingerprint);

        matches.push(match);
        if (matches.length >= topK) break;
    }

    return {
        indexed: true,
        matches,
        // Kept for diagnostics: distinguishes "nothing indexed" from
        // "indexed, but nothing relevant".
        bestScore: scored.length ? scored[0].score : null,
    };
};

module.exports = { retrieveContext, cosineSimilarity, TOP_K, MIN_SIMILARITY };
