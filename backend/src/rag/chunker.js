// Turns an extracted PDF into overlapping passages.
//
// Targets ~800 tokens per chunk with ~100 tokens of overlap, per the spec.
// Token counts are estimated rather than measured: a real tokenizer would add
// a dependency for a value that only needs to be approximately right, and the
// usual ~4-characters-per-token heuristic holds well for the prose in these
// course notes.

const CHARS_PER_TOKEN = 4;

const TARGET_TOKENS = Number(process.env.CHUNK_TARGET_TOKENS || 800);
const OVERLAP_TOKENS = Number(process.env.CHUNK_OVERLAP_TOKENS || 100);

const TARGET_CHARS = TARGET_TOKENS * CHARS_PER_TOKEN;
const OVERLAP_CHARS = OVERLAP_TOKENS * CHARS_PER_TOKEN;

const estimateTokens = (text) => Math.ceil(text.length / CHARS_PER_TOKEN);

// Splitting on paragraphs first keeps related sentences together; a paragraph
// longer than a whole chunk falls back to sentence boundaries.
const splitIntoBlocks = (text) => {
    const blocks = [];

    for (const paragraph of text.split(/\n\s*\n/)) {
        const trimmed = paragraph.trim();
        if (!trimmed) continue;

        if (trimmed.length <= TARGET_CHARS) {
            blocks.push(trimmed);
            continue;
        }

        // Break the oversized paragraph on sentence ends, keeping the
        // terminator attached to the sentence it belongs to.
        let current = '';
        for (const sentence of trimmed.split(/(?<=[.!?])\s+/)) {
            if (current && (current.length + sentence.length + 1) > TARGET_CHARS) {
                blocks.push(current.trim());
                current = sentence;
            } else {
                current = current ? `${current} ${sentence}` : sentence;
            }
        }
        if (current.trim()) blocks.push(current.trim());
    }

    return blocks;
};

// Carries the tail of the previous chunk into the next one so an answer that
// straddles a boundary is still retrievable. The tail is cut at a sentence
// boundary where possible rather than mid-word.
const overlapTail = (text) => {
    if (text.length <= OVERLAP_CHARS) return text;

    const tail = text.slice(-OVERLAP_CHARS);
    const boundary = tail.search(/(?<=[.!?])\s+/);
    return boundary === -1 ? tail : tail.slice(boundary).trim();
};

// `pages` is an array of page texts, so each chunk can record where it came
// from. A chunk that spans a page break is attributed to the page it starts on.
const chunkPages = (pages) => {
    const chunks = [];

    let buffer = '';
    let bufferPage = 1;

    const flush = () => {
        const text = buffer.trim();
        if (!text) return;
        chunks.push({ text, page: bufferPage, chunkIndex: chunks.length });
    };

    pages.forEach((pageText, pageOffset) => {
        const pageNumber = pageOffset + 1;

        for (const block of splitIntoBlocks(pageText || '')) {
            if (buffer && (buffer.length + block.length + 2) > TARGET_CHARS) {
                flush();
                buffer = overlapTail(buffer);
                // The new chunk starts on the page whose content follows the
                // carried-over tail.
                bufferPage = pageNumber;
                buffer = buffer ? `${buffer}\n\n${block}` : block;
            } else {
                if (!buffer) bufferPage = pageNumber;
                buffer = buffer ? `${buffer}\n\n${block}` : block;
            }
        }
    });

    flush();
    return chunks;
};

module.exports = {
    chunkPages,
    estimateTokens,
    TARGET_TOKENS,
    OVERLAP_TOKENS,
};
