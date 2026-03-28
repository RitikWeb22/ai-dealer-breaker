import { body } from 'express-validator';

export const validateUser = [
    body('username')
        .isLength({ min: 3 })
        .withMessage('Username must be at least 3 characters long'),
    body('email').isEmail().withMessage('Invalid email address'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
];

export const validateLogin = [
    body('email').isEmail().withMessage('Invalid email address'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
];
