import userModel from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ─── Shared cookie config ──────────────────────────────────────────────────────

const COOKIE_OPTIONS = {
    httpOnly: true,                             // JS se access nahi hoga (XSS protection)
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
    maxAge: 7 * 24 * 60 * 60 * 1000,           // 7 din — refresh pe bhi chalegi
};

// ─── Controllers ──────────────────────────────────────────────────────────────

export async function register(req, res) {
    const { username, email, password } = req.body;

    const userIsExist = await userModel.findOne({ email });
    if (userIsExist) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const newPass = await bcrypt.hash(password, 10);

    const user = await userModel.create({ username, email, password: newPass });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, COOKIE_OPTIONS); // ✅ Fixed

    res.status(201).json({
        status: 'success',
        message: 'User created successfully',
        user: {
            username: user.username,
            email: user.email,
        },
    });
}

export async function login(req, res) {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email }).select('+password');
    if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, COOKIE_OPTIONS); // ✅ Fixed

    res.status(200).json({
        status: 'success',
        message: 'User logged in successfully',
        user: {
            username: user.username,
            email: user.email,
        },
    });
}

export async function getProfile(req, res) {
    const userId = req.userId;

    const user = await userModel.findById(userId);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
        status: 'success',
        message: 'User profile fetched successfully',
        user: {
            username: user.username,
            email: user.email,
        },
    });
}