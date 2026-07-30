const { Sequelize } = require('sequelize');

// The database is shared with another project, so every table lives in its own
// schema instead of public.
const DB_SCHEMA = process.env.DB_SCHEMA || 'elearn';

const buildConnection = () => {
    const url = process.env.DATABASE_URL;

    if (!url) {
        // Keep the instance constructible so requiring a model never throws;
        // connectDB reports the missing variable properly.
        return new Sequelize('postgres://localhost:5432/postgres', { logging: false });
    }

    // Render publishes the database on a fully qualified host externally, where
    // SSL is required, and on a bare host inside its private network where it
    // is not offered at all.
    let needsSsl = true;
    try {
        needsSsl = new URL(url).hostname.includes('.');
    } catch (e) {
        needsSsl = true;
    }

    return new Sequelize(url, {
        dialect: 'postgres',
        logging: false,
        define: { schema: DB_SCHEMA },
        dialectOptions: needsSsl
            ? { ssl: { require: true, rejectUnauthorized: false } }
            : {},
        pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
    });
};

const sequelize = buildConnection();

const connectDB = async () => {
    try {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL is not set');
        }

        await sequelize.authenticate();

        await sequelize.createSchema(DB_SCHEMA, { logging: false }).catch(() => {
            // Already exists, which is the normal case after the first boot.
        });

        // Associations have to be registered before the tables are created.
        require('../models');
        await sequelize.sync();

        console.log(`Postgres connected: ${sequelize.getDatabaseName()} (schema ${DB_SCHEMA})`);
    } catch (error) {
        console.error(`Database Connection Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
module.exports.sequelize = sequelize;
module.exports.DB_SCHEMA = DB_SCHEMA;
