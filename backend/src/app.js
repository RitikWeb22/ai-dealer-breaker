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
app.use(express.json()); // Body parser for JSON payloads
app.use(cookieParser()); // Parser for auth tokens

app.use(express.static('public')); // Static files (if any, like images or frontend build)

// --- 2. Correct CORS Configuration ---
// Kyunki aapka frontend local (5173) hai aur backend Render par, 
// isliye origin check aur credentials true hona zaroori hai.
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://ai-dealer-breaker.onrender.com'
    // Yahan apna deployed frontend URL bhi add kar dena agar baad mein deploy karo toh
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl/postman)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log("❌ CORS Blocked Origin:", origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Zaroori hai agar aap cookies/headers use kar rahe ho
}));

// --- 3. Routes Mapping ---

// Auth routes (Login/Register)
app.use("/api/auth", authRouter);

// Agent negotiation routes (Logic for AI behavior)
app.use("/api/negotiation", NegotiationRouter);

// Vapi specific routes (Session Config & Webhooks)
// Note: Frontend calls will be /api/vapi/session-config
// Webhook URL in Dashboard should be: https://your-link.com/api/vapi/webhook
app.use("/api/vapi", vapiRouter);

// Product routes (Inventory/Pricing)
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