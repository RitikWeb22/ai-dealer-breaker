import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';

// Route Imports
import authRouter from './routes/user.route.js';
import NegotiationRouter from './routes/negotiation.route.js';
import productRouter from './routes/product.route.js';
import vapiRouter from './routes/vapi.route.js';

const app = express();

// --- 1. Global Middleware ---
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-eval'", 'https://c.daily.co', 'blob:'],
                scriptSrcElem: ["'self'", 'https://c.daily.co', 'blob:'],
                imgSrc: [
                    "'self'",
                    'data:',
                    'https://images.unsplash.com',
                    'https://i.pinimg.com',
                ],
                workerSrc: ["'self'", 'blob:', 'https://c.daily.co'],
                connectSrc: [
                    "'self'",
                    'https://api.vapi.ai',
                    'wss://api.vapi.ai',
                    'https://*.vapi.ai',
                    'wss://*.vapi.ai',
                    'https://*.daily.co',
                    'wss://*.daily.co',
                    'https://o77906.ingest.sentry.io',
                    'https://*.ingest.sentry.io',
                ],
                mediaSrc: ["'self'", 'blob:'],
            },
        },
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
);
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(express.static('public'));

// --- 2. Robust CORS Configuration ---
const defaultOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://ai-dealer-breaker.onrender.com'
];

const envOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        const cleanOrigin = origin.replace(/\/$/, "");
        if (allowedOrigins.map(o => o.replace(/\/$/, "")).includes(cleanOrigin)) {
            callback(null, true);
        } else {
            const corsError = new Error('Not allowed by CORS');
            corsError.statusCode = 403;
            callback(corsError);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], // OPTIONS yahan included hai
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));

app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
    });
});



app.use("/api/auth", authRouter);
app.use("/api/negotiation", NegotiationRouter);
app.use("/api/vapi", vapiRouter);
app.use("/api/product", productRouter);

// --- 4. Global Error Handler ---
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message =
        process.env.NODE_ENV === 'production' && statusCode === 500
            ? 'Internal Server Error'
            : err.message || 'Internal Server Error';

    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
    });
});

export default app;