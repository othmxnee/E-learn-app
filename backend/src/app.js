require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Import Config
const connectDB = require('./config/db');

// Initialize App
const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// CLIENT_URL accepts a comma-separated list of origins. Render injects a bare
// hostname for the static site, so origins without a scheme are assumed https.
const allowedOrigins = (process.env.CLIENT_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => (/^https?:\/\//.test(origin) ? origin : `https://${origin}`));

app.use(cors({
    origin: allowedOrigins.length ? allowedOrigins : '*',
    credentials: true
}));
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('dev'));

// Database Connection
connectDB();

// Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const academicRoutes = require('./routes/academicRoutes');
const moduleRoutes = require('./routes/moduleRoutes');
const contentRoutes = require('./routes/contentRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/academic-structure', academicRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api', contentRoutes); // Mounts to /api/modules/:allocationId/... and /api/assignments/...
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));

// Make uploads folder static
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Demo course notes referenced by the seeded materials. These live in the
// repository rather than in uploads/, which Render wipes on every deploy, so
// the demo keeps working after a restart.
app.use('/seed-data', express.static(path.join(__dirname, '../seed-data')));

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = app;
