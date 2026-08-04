// Embedding provider.
//
// Gemini is used for both embeddings and chat so the deployment needs one key
// rather than two. Vectors are truncated to 768 dimensions: the model emits
// 3072 by default, and storing four times the floats per row buys nothing at
// this corpus size (a few hundred chunks drawn from 15 source PDFs).
//
// The free tier rate-limits aggressively, so requests are batched and retried
// on 429 rather than fired one per chunk.

const { GoogleGenAI } = require('@google/genai');

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'gemini-embedding-001';
const EMBEDDING_DIMENSIONS = Number(process.env.EMBEDDING_DIMENSIONS || 768);

// Kept well under the API's per-request ceiling; the limiting factor on the
// free tier is requests per minute, not batch size.
const BATCH_SIZE = 50;

const apiKey = () => process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

const isConfigured = () => Boolean(apiKey());

let client = null;
const getClient = () => {
    if (!isConfigured()) {
        throw new Error('GEMINI_API_KEY is not set — the chatbot and its index need an API key');
    }
    if (!client) client = new GoogleGenAI({ apiKey: apiKey() });
    return client;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Free-tier quota is the normal failure here, not a broken request, so 429 and
// 5xx are retried with a widening delay instead of failing the whole ingest.
const withRetry = async (operation, { attempts = 5, label = 'embedding' } = {}) => {
    let lastError;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            const status = error?.status ?? error?.code;

            // Transient network failures reaching the API are as common as
            // quota errors on a small instance, and equally worth retrying —
            // both surface to the student as a failed answer otherwise.
            const cause = error?.cause?.code || error?.cause?.errors?.[0]?.code;
            const networkError =
                /fetch failed|network|socket hang up/i.test(error?.message || '')
                || ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'EAI_AGAIN', 'UND_ERR_CONNECT_TIMEOUT'].includes(cause);

            const retryable =
                networkError || status === 429 || status === 503 || (status >= 500 && status < 600);
            if (!retryable || attempt === attempts - 1) throw error;

            const delay = Math.min(2000 * 2 ** attempt, 30000);
            console.warn(`${label}: ${status} — retrying in ${delay}ms`);
            await sleep(delay);
        }
    }

    throw lastError;
};

// `taskType` matters: documents and queries are embedded into the same space
// but with different intent, which measurably improves retrieval quality.
const embedBatch = async (texts, taskType) => {
    const genai = getClient();

    const response = await withRetry(() =>
        genai.models.embedContent({
            model: EMBEDDING_MODEL,
            contents: texts,
            config: {
                taskType,
                outputDimensionality: EMBEDDING_DIMENSIONS,
            },
        })
    );

    const vectors = (response.embeddings || []).map((entry) => entry.values);
    if (vectors.length !== texts.length) {
        throw new Error(`Embedding count mismatch: sent ${texts.length}, received ${vectors.length}`);
    }
    return vectors;
};

// Embeds the passages of a document. Progress is reported so a long ingest can
// drive the admin progress bar.
const embedDocuments = async (texts, onProgress = () => {}) => {
    const vectors = [];

    for (let index = 0; index < texts.length; index += BATCH_SIZE) {
        const batch = texts.slice(index, index + BATCH_SIZE);
        vectors.push(...(await embedBatch(batch, 'RETRIEVAL_DOCUMENT')));
        onProgress(Math.min(index + BATCH_SIZE, texts.length), texts.length);
    }

    return vectors;
};

// Embeds a single user question.
const embedQuery = async (text) => {
    const [vector] = await embedBatch([text], 'RETRIEVAL_QUERY');
    return vector;
};

module.exports = {
    embedDocuments,
    embedQuery,
    isConfigured,
    withRetry,
    EMBEDDING_MODEL,
    EMBEDDING_DIMENSIONS,
};
