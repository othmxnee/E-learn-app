const { DataTypes } = require('sequelize');

// Mongoose serialised documents with an `_id` and, once populated, replaced the
// foreign key with the referenced document. The frontend reads both shapes, so
// every model reproduces them here.

// Primary key definition shared by all models, plus an `_id` alias so existing
// code keeps working unchanged.
const idAttributes = {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    _id: {
        type: DataTypes.VIRTUAL,
        get() {
            return this.getDataValue('id');
        },
    },
};

// Every row the demo seeder writes carries this flag, so `seed:reset` can drop
// the demo dataset without touching anything a real user created.
const seededAttribute = {
    seeded: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
};

// `populate` maps an association alias onto the foreign key it should be
// serialised as, mirroring what .populate() used to produce.
const applyJsonContract = (model, { populate = {}, hidden = [] } = {}) => {
    model.prototype.toJSON = function () {
        const values = { ...this.get() };

        values._id = values.id;
        delete values.id;

        for (const field of hidden) {
            delete values[field];
        }

        for (const [alias, foreignKey] of Object.entries(populate)) {
            if (values[alias] === undefined) {
                continue;
            }

            const related = values[alias];
            delete values[alias];

            if (Array.isArray(related)) {
                values[foreignKey] = related.map((item) =>
                    item && typeof item.toJSON === 'function' ? item.toJSON() : item
                );
            } else {
                values[foreignKey] =
                    related && typeof related.toJSON === 'function' ? related.toJSON() : related;
            }
        }

        return values;
    };
};

module.exports = { idAttributes, seededAttribute, applyJsonContract };
