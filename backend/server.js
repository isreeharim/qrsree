require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const qrRoutes = require('./routes/qrRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const userRoutes = require('./routes/userRoutes');
const publicRoutes = require('./routes/publicRoutes');

const app = express();

// --- Security & parsing middleware ---------------------------------------
app.use(
  helmet({
    // The redirect page relies on an inline <script>; a strict default CSP
    // would block it, so we scope contentSecurityPolicy off here and rely
    // on the other helmet protections (X-Frame-Options, etc.) instead.
    contentSecurityPolicy: false,
  })
);
const clientUrl = (process.env.CLIENT_URL || '').replace(/\/+$/, '');
const allowedOrigins = clientUrl ? [clientUrl, `${clientUrl}/`] : '*';

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '10kb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// --- Routes ----------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'QR system API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/qrcodes', qrRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);

// publicRoutes defines its own full paths: GET /q/:shortCode and
// PATCH /api/public/scan/:scanLogId/location
app.use('/', publicRoutes);

app.use(notFound);
app.use(errorHandler);

// --- Startup & DB Connection --------------------------------------------------
const PORT = process.env.PORT || 5000;

// Initialize database connection in background (Mongoose buffers queries)
connectDB();

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[server] Listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
}

// Surface unhandled promise rejections instead of failing silently.
process.on('unhandledRejection', (err) => {
  console.error('[server] Unhandled rejection:', err);
});

module.exports = app;
