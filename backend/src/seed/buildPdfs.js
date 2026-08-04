// Generates the demo course notes committed under backend/seed-data.
//
// Run once with `npm run seed:pdfs`; the output is committed to the repository
// so it survives Render deploys, which wipe the uploads directory. The writer
// is hand-rolled rather than pulling in a PDF dependency the server would then
// ship to production for a build-time-only job.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { NOTES } = require('./notes');
const { DEPARTMENTS, topicsFor } = require('./catalog');
const { buildTopicNote, topicFileName } = require('./topicNotes');

const OUTPUT_DIR = path.join(__dirname, '../../seed-data');

const PAGE_WIDTH = 595; // A4 at 72dpi
const PAGE_HEIGHT = 842;
const MARGIN = 64;
const BODY_SIZE = 11;
const BODY_LEADING = 15.5;

// Only the WinAnsi range is used by these notes, and the few characters that
// break PDF string syntax have to be escaped.
const escapeText = (text) =>
    text
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)')
        .replace(/[^\x20-\x7e]/g, '-');

// Helvetica average character width is close enough to wrap at a sensible
// column without embedding font metrics.
const wrap = (text, size, maxWidth) => {
    const charWidth = size * 0.5;
    const maxChars = Math.floor(maxWidth / charWidth);
    const lines = [];

    for (const paragraph of text.split('\n')) {
        if (!paragraph.trim()) {
            lines.push('');
            continue;
        }
        let current = '';
        for (const word of paragraph.split(/\s+/)) {
            const candidate = current ? `${current} ${word}` : word;
            if (candidate.length > maxChars && current) {
                lines.push(current);
                current = word;
            } else {
                current = candidate;
            }
        }
        if (current) lines.push(current);
    }

    return lines;
};

// Lays a note out across as many pages as its body needs.
const buildPages = (note) => {
    const usableWidth = PAGE_WIDTH - MARGIN * 2;
    const pages = [];

    let ops = [];
    let y = PAGE_HEIGHT - MARGIN;

    const newPage = () => {
        if (ops.length) pages.push(ops);
        ops = [];
        y = PAGE_HEIGHT - MARGIN;
    };

    const write = (text, size, leading, font = 'F1') => {
        if (y - leading < MARGIN) newPage();
        ops.push(`BT /${font} ${size} Tf 1 0 0 1 ${MARGIN} ${y.toFixed(2)} Tm (${escapeText(text)}) Tj ET`);
        y -= leading;
    };

    write(note.title, 18, 26, 'F2');
    write(note.subtitle, 10.5, 22, 'F1');

    for (const section of note.sections) {
        y -= 6;
        write(section.heading, 13, 20, 'F2');
        for (const line of wrap(section.body, BODY_SIZE, usableWidth)) {
            if (line === '') y -= 6;
            else write(line, BODY_SIZE, BODY_LEADING);
        }
    }

    if (ops.length) pages.push(ops);
    return pages;
};

const buildPdf = (note) => {
    const pages = buildPages(note);

    // Object 1 catalog, 2 pages tree, 3 and 4 fonts, then a content stream and
    // a page object per page.
    const objects = [];
    const pageObjectIds = [];
    let nextId = 5;

    const streams = pages.map((ops) => {
        const contentId = nextId++;
        const pageId = nextId++;
        pageObjectIds.push(pageId);
        return { contentId, pageId, body: ops.join('\n') };
    });

    objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    objects[2] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>`;
    objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';

    for (const { contentId, pageId, body } of streams) {
        const compressed = zlib.deflateSync(Buffer.from(body, 'latin1'));
        objects[contentId] = {
            dict: `<< /Length ${compressed.length} /Filter /FlateDecode >>`,
            stream: compressed,
        };
        objects[pageId] =
            `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
            `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
    }

    const chunks = [Buffer.from('%PDF-1.4\n%\xe2\xe3\xcf\xd3\n', 'latin1')];
    const offsets = [];
    let position = chunks[0].length;

    for (let id = 1; id < nextId; id += 1) {
        const object = objects[id];
        offsets[id] = position;

        let buffer;
        if (typeof object === 'string') {
            buffer = Buffer.from(`${id} 0 obj\n${object}\nendobj\n`, 'latin1');
        } else {
            buffer = Buffer.concat([
                Buffer.from(`${id} 0 obj\n${object.dict}\nstream\n`, 'latin1'),
                object.stream,
                Buffer.from('\nendstream\nendobj\n', 'latin1'),
            ]);
        }

        chunks.push(buffer);
        position += buffer.length;
    }

    const xrefStart = position;
    let xref = `xref\n0 ${nextId}\n0000000000 65535 f \n`;
    for (let id = 1; id < nextId; id += 1) {
        xref += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
    }
    xref += `trailer\n<< /Size ${nextId} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
    chunks.push(Buffer.from(xref, 'latin1'));

    return Buffer.concat(chunks);
};

const run = () => {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    // The subject-area notes: one substantial document per topic area.
    for (const note of NOTES) {
        fs.writeFileSync(path.join(OUTPUT_DIR, note.file), buildPdf(note));
    }
    console.log(`${NOTES.length} subject notes written`);

    // One note per module+topic pair, so that a material titled "Week 4 —
    // Divide and Conquer" actually contains divide-and-conquer content. Without
    // these, every weekly material in a module shared one file and the
    // assistant could only ever answer about whichever topic that file covered.
    let topicCount = 0;
    for (const department of DEPARTMENTS) {
        for (const [moduleName] of department.modules) {
            for (const topic of topicsFor(moduleName)) {
                const file = topicFileName(moduleName, topic);
                const target = path.join(OUTPUT_DIR, file);
                if (fs.existsSync(target)) continue;

                fs.writeFileSync(
                    target,
                    buildPdf(buildTopicNote(topic, moduleName, department.name))
                );
                topicCount += 1;
            }
        }
    }

    console.log(`${topicCount} weekly topic notes written`);
    console.log(`\nAll notes written to seed-data/`);
};

if (require.main === module) run();

module.exports = { buildPdf, run };
