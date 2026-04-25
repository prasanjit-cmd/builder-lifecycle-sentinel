import 'dotenv/config';
import path from 'path';
import express from 'express';
import cors from 'cors';
import builderLifecycleSentinelRouter from './routes/builder-lifecycle-sentinel';
const app = express();
const port = Number(process.env.PORT || 3100);
app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.get('/health', (_req, res) => { res.json({ ok: true }); });
// API routes
app.use('/api/builder-lifecycle-sentinel', builderLifecycleSentinelRouter);
// Serve dashboard static files (single-port architecture)
const dashDist = path.join(process.cwd(), 'dashboard', 'dist');
app.use(express.static(dashDist));
// SPA fallback — serve index.html for non-API routes
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: { message: 'Not Found', code: 'NOT_FOUND' } });
    }
    res.sendFile(path.join(dashDist, 'index.html'));
});
// Error handler
app.use((error, _req, res, _next) => {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    res.status(500).json({ error: { message, code: 'INTERNAL_SERVER_ERROR' } });
});
app.listen(port, () => { console.log(`Backend listening on port ${port}`); });
export default app;
