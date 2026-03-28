import express from 'express';
import authRouter from './routes/user.route.js';
import cookieParser from 'cookie-parser';
import NegotiationRouter from './routes/negotiation.route.js';
import productRouter from './routes/product.route.js';
import cors from 'cors';
const app = express();

// middleware
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = ['http://localhost:5173', 'https://ai-dealer-breaker.onrender.com'];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}))

// auth routes
app.use("/api/auth", authRouter)

// agent negotiation routes
app.use("/api/vapi", NegotiationRouter)

// product routes
app.use("/api/product", productRouter)


export default app;