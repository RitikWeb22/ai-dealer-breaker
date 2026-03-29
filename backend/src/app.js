import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Route Imports
import authRouter from './routes/user.route.js';
import NegotiationRouter from './routes/negotiation.route.js';
import productRouter from './routes/product.route.js';
import vapiRouter from './routes/vapi.route.js';

const app = express();

// --- 1. Global Middleware ---
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

// --- 2. Robust CORS Configuration ---
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://ai-dealer-breaker.onrender.com',
    'https://ai-dealer-breaker.onrender.com/' // Added trailing slash version for safety
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        const cleanOrigin = origin.replace(/\/$/, "");
        if (allowedOrigins.map(o => o.replace(/\/$/, "")).includes(cleanOrigin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], // OPTIONS yahan included hai
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));



app.use("/api/auth", authRouter);
app.use("/api/negotiation", NegotiationRouter);
app.use("/api/vapi", vapiRouter);
app.use("/api/product", productRouter);

// --- 4. Global Error Handler ---
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
    });
});

export default app;