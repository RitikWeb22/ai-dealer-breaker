import jwt from 'jsonwebtoken';

export function identifyUser(req, res, next) {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: 'Server configuration error' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch {
        return res.status(401).json({ message: 'Unauthorized' });
    }
}