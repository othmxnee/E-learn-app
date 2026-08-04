const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { idAttributes, seededAttribute, applyJsonContract } = require('./jsonContract');

// One embedded passage of a course material.
//
// The specification describes a MongoDB `chunks` collection; this schema is
// Postgres, so the same fields live in a table. The embedding is stored as a
// float array rather than a pgvector column: the extension is not installed,
// the database is shared with another application, and similarity is computed
// in Node anyway — at 15 source PDFs the whole index is a few hundred rows.
const Chunk = sequelize.define(
    'Chunk',
    {
        ...idAttributes,
        ...seededAttribute,
        // Materials hang off an allocation (module × level), which is what the
        // chat widget knows about. The plain module id is kept alongside it so
        // retrieval can widen to every level teaching the same module.
        allocationId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        moduleId: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        materialId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        // Denormalised so a citation never needs a second query.
        materialName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        text: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        page: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        // Position of the chunk within its source document, for stable ordering.
        chunkIndex: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        embedding: {
            type: DataTypes.ARRAY(DataTypes.REAL),
            allowNull: false,
        },
        // Which provider and model produced the vector. Mixing dimensions in
        // one index would silently corrupt similarity, so retrieval filters on
        // the model currently configured.
        embeddingModel: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        adminId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    },
    {
        tableName: 'chunks',
        indexes: [
            { fields: ['adminId'] },
            { fields: ['allocationId'] },
            { fields: ['materialId'] },
        ],
    }
);

applyJsonContract(Chunk, { hidden: ['embedding'] });

module.exports = Chunk;
