import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { requestIdMiddleware } from './middlewares/requestId';
import { errorHandler } from './middlewares/errorHandler';
import healthRouter from './routes/health.route';
import authRouter from './modules/auth/auth.routes';
import materialsRouter from './modules/materials/materials.routes';
import accessRouter from './modules/access/access.routes';
import progressRouter from './modules/progress/progress.routes';
import adminRouter from './modules/admin/admin.routes';
import searchRouter from './modules/search/search.routes';
import discoveryRouter from './modules/discovery/discovery.routes';
// import { AnalyticsWorker } from './modules/analytics/analytics.worker';
import { requestMetrics } from './middlewares/requestMetrics';

const app: Express = express();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.RATE_LIMIT_AUTH,
    message: { success: false, error: { message: 'Too many authentication attempts, please try again later.' } }
});

// Security and utility Middlewares
app.use(helmet({
    hsts: { maxAge: 31536000, includeSubDomains: true },
    frameguard: { action: 'deny' },
    contentSecurityPolicy: { directives: { defaultSrc: ["'self'"] } },
    xContentTypeOptions: true,
    referrerPolicy: { policy: 'no-referrer' }
}));

app.use(cors({
    origin: [env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS']
}));

app.use(express.json());
app.use(cookieParser());
app.use(requestIdMiddleware);
app.use(requestMetrics);

// Memory safety daemon logging leak signals implicitly
setInterval(() => {
    const mem = process.memoryUsage();
    if (mem.heapUsed / mem.heapTotal > 0.8) {
        console.warn(`[MEMORY:WARN] Heap threshold critically elevated at ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    }
}, 5 * 60 * 1000);

// Spin up Intelligence background worker immediately (skipping test suites safely)
// if (env.NODE_ENV !== 'test') {
//     AnalyticsWorker.start();
// }

// Active Routes
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/auth', authLimiter, authRouter);
app.use('/api/v1/admin', adminRouter);

app.use('/api/v1/search', searchRouter);
app.use('/api/v1', discoveryRouter);

// Materials & Dependent Routes
app.use('/api/v1/materials', materialsRouter);
app.use('/api/v1/materials', accessRouter); // Catches /:slug/access
app.use('/api/v1/materials', progressRouter); // Catches /:slug/progress

// Global Error Catcher
app.use(errorHandler);

export default app;
