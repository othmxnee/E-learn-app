// PDF text extraction.
//
// pdf-parse v2 exposes a class rather than the v1 callable module, and returns
// text per page — which is what makes page-level citations possible. The
// parser holds native resources, so every path destroys it.

const fs = require('fs');
const { PDFParse } = require('pdf-parse');

// Collapses the whitespace that PDF extraction leaves behind (line breaks mid
// sentence, runs of spaces from justified text) without destroying paragraph
// boundaries, which the chunker splits on.
const normalise = (text) =>
    (text || '')
        .replace(/\r\n?/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/ ?\n ?/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

// Returns one entry per page, so a chunk can be attributed to the page it
// started on.
const extractPages = async (filePath) => {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    const parser = new PDFParse({ data: fs.readFileSync(filePath) });

    try {
        const result = await parser.getText();
        return (result.pages || [])
            .sort((a, b) => (a.num || 0) - (b.num || 0))
            .map((page) => normalise(page.text));
    } finally {
        await parser.destroy();
    }
};

module.exports = { extractPages, normalise };
