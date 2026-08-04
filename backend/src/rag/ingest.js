// Ingestion pipeline: PDF -> pages -> chunks -> embeddings -> `chunks` table.
//
// Materials share files by design (the ~180 seeded materials point at 15 real
// PDFs), so the same document is embedded once per material that references
// it. That keeps retrieval scoped correctly — a chunk belongs to the module
// whose material it came from — at a cost measured in a handful of API calls.

const path = require('path');
const { Op } = require('sequelize');

const { Chunk, ModuleContent, ModuleAllocation } = require('../models');
const { extractPages } = require('./pdfText');
const { chunkPages } = require('./chunker');
const { embedDocuments, isConfigured, EMBEDDING_MODEL } = require('./embeddings');

const BACKEND_ROOT = path.join(__dirname, '../..');

// A material's `fileUrl` is a public path (`/uploads/x.pdf`, `/seed-data/y.pdf`);
// both are served from directories inside the backend.
const resolveFile = (fileUrl) => {
    if (!fileUrl) return null;
    const relative = fileUrl.replace(/^\/+/, '');
    if (!/^(uploads|seed-data)\//.test(relative)) return null;

    const absolute = path.join(BACKEND_ROOT, relative);
    // Defence in depth: a crafted fileUrl must not escape the backend root.
    if (!absolute.startsWith(BACKEND_ROOT)) return null;
    return absolute;
};

const isPdf = (fileUrl) => /\.pdf$/i.test(fileUrl || '');

// Indexes one material. Returns the number of chunks written.
const ingestMaterial = async (material, { onProgress = () => {} } = {}) => {
    const filePath = resolveFile(material.fileUrl);
    if (!filePath || !isPdf(material.fileUrl)) return 0;

    const pages = await extractPages(filePath);
    const chunks = chunkPages(pages);
    if (!chunks.length) return 0;

    const vectors = await embedDocuments(
        chunks.map((chunk) => chunk.text),
        (done, total) => onProgress({ material: material.title, done, total })
    );

    // Replacing rather than appending keeps re-ingestion idempotent.
    await Chunk.destroy({ where: { materialId: material.id } });

    const allocation = material.allocation
        || (await ModuleAllocation.findByPk(material.allocationId, { attributes: ['id', 'moduleId'] }));

    await Chunk.bulkCreate(
        chunks.map((chunk, index) => ({
            allocationId: material.allocationId,
            moduleId: allocation ? allocation.moduleId : null,
            materialId: material.id,
            materialName: material.title,
            text: chunk.text,
            page: chunk.page,
            chunkIndex: chunk.chunkIndex,
            embedding: vectors[index],
            embeddingModel: EMBEDDING_MODEL,
            adminId: material.adminId,
            seeded: material.seeded,
        })),
        { validate: false }
    );

    return chunks.length;
};

// Indexes every PDF material for an admin.
//
// Because materials reuse a small set of files, embeddings are computed once
// per distinct file and reused across the materials that share it — this is
// what keeps a full rebuild to roughly 15 documents' worth of API calls
// instead of 180.
const ingestAll = async ({ adminId, onProgress = () => {}, force = false } = {}) => {
    if (!adminId) throw new Error('ingestAll requires an adminId');
    if (!isConfigured()) {
        throw new Error('GEMINI_API_KEY is not set — cannot build the chat index');
    }

    const materials = await ModuleContent.findAll({
        where: {
            adminId,
            fileUrl: { [Op.iLike]: '%.pdf' },
        },
        attributes: ['id', 'title', 'fileUrl', 'allocationId', 'adminId', 'seeded'],
        order: [['createdAt', 'ASC']],
    });

    if (!force) {
        // Nothing to do if the index already covers these materials with the
        // current model.
        const existing = await Chunk.count({ where: { adminId, embeddingModel: EMBEDDING_MODEL } });
        if (existing > 0 && materials.length === 0) return { materials: 0, chunks: 0, files: 0 };
    }

    const allocations = await ModuleAllocation.findAll({
        where: { adminId },
        attributes: ['id', 'moduleId'],
        raw: true,
    });
    const moduleByAllocation = new Map(allocations.map((row) => [row.id, row.moduleId]));

    // Group by the file each material points at.
    const byFile = new Map();
    for (const material of materials) {
        const filePath = resolveFile(material.fileUrl);
        if (!filePath || !isPdf(material.fileUrl)) continue;
        if (!byFile.has(filePath)) byFile.set(filePath, []);
        byFile.get(filePath).push(material);
    }

    await Chunk.destroy({ where: { adminId } });

    const rows = [];
    let fileIndex = 0;
    let totalChunks = 0;

    for (const [filePath, group] of byFile) {
        fileIndex += 1;
        onProgress({
            step: 'ingest',
            message: `Indexing ${path.basename(filePath)} (${fileIndex}/${byFile.size})`,
        });

        let pages;
        try {
            pages = await extractPages(filePath);
        } catch (error) {
            console.warn(`Skipping ${filePath}: ${error.message}`);
            continue;
        }

        const chunks = chunkPages(pages);
        if (!chunks.length) continue;

        // One embedding pass per distinct file, reused by every material that
        // references it.
        const vectors = await embedDocuments(chunks.map((chunk) => chunk.text));

        for (const material of group) {
            chunks.forEach((chunk, index) => {
                rows.push({
                    allocationId: material.allocationId,
                    moduleId: moduleByAllocation.get(material.allocationId) || null,
                    materialId: material.id,
                    materialName: material.title,
                    text: chunk.text,
                    page: chunk.page,
                    chunkIndex: chunk.chunkIndex,
                    embedding: vectors[index],
                    embeddingModel: EMBEDDING_MODEL,
                    adminId,
                    seeded: material.seeded,
                });
            });
            totalChunks += chunks.length;
        }
    }

    // Batched, for the same reason the demo seed batches.
    const BATCH = 500;
    for (let index = 0; index < rows.length; index += BATCH) {
        await Chunk.bulkCreate(rows.slice(index, index + BATCH), { validate: false });
        onProgress({
            step: 'ingest',
            message: `Storing passages (${Math.min(index + BATCH, rows.length)}/${rows.length})`,
        });
    }

    return { materials: materials.length, chunks: totalChunks, files: byFile.size };
};

module.exports = { ingestAll, ingestMaterial, resolveFile, isPdf };
