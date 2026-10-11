const express = require('express');
const cors = require('cors');
const aiRoutes = require('./routes/ai.routes');
const aiController = require('./controllers/ai.controller');
const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-gemini-key', 'X-Gemini-Key', 'x-api-key']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware to normalize Vercel serverless rewritten paths
app.use((req, res, next) => {
    const originalPath = req.headers['x-matched-path'] || req.headers['x-forwarded-uri'];
    if (originalPath && originalPath !== req.url && originalPath !== '/api/index.js' && originalPath !== '/api') {
        req.url = originalPath;
    }
    next();
});

app.get('/', (req, res) => {
    res.json({ status: "ok", message: "CodeReviewX Server is running" });
});

app.get('/health', (req, res) => {
    res.json({ status: "ok" });
});

// Mount routes for all possible Vercel rewrite patterns
app.use('/ai', aiRoutes);
app.use('/api', aiRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/index.js', aiRoutes);
app.use('/', aiRoutes);

// Fallback handler for review requests matching any path
app.use((req, res, next) => {
    if (req.method === 'POST') {
        if (req.url.includes('get-review') || req.url === '/' || req.url === '/api' || req.url === '/api/index.js') {
            return aiController.getReview(req, res);
        }
    }
    next();
});

module.exports = app;