import express from 'express';
import authRouter from './routes/user.route.js';
import cookieParser from 'cookie-parser';
import NegotiationRouter from './routes/negotiation.route.js';
import productRouter from './routes/product.route.js';
const app = express();

// middleware
app.use(express.json());
app.use(cookieParser());

// auth routes
app.use("/api/auth", authRouter)

// agent negotiation routes
app.use("api/vapi", NegotiationRouter)

// product routes
app.use("/api/product", productRouter)


export default app;