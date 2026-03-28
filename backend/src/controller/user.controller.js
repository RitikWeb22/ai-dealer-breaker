import userModel from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';


export async function register(req, res) {
    const { username, email, password } = req.body;

    // check user already exists
    const userIsExist = await userModel.findOne({ email })
    if (userIsExist) {
        return res.status(400).json({ message: 'User already exists' });
    }

    //hash password
    const newPass = await bcrypt.hash(password, 10);

    // create user
    const user = await userModel.create({
        username,
        email,
        password: newPass
    });

    // token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.cookie('token', token)

    // response
    res.status(201).json({
        status: 'success',
        message: 'User created successfully',
        user: {
            username: user.username,
            email: user.email,
        }
    });

}

export async function login(req, res) {
    const { email, password } = req.body;
    // check user exists
    const user = await userModel.findOne({ email }).select('+password');
    if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    // check password 
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    // token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.cookie('token', token)

    // response
    res.status(200).json({
        status: 'success',
        message: 'User logged in successfully',
        user: {
            username: user.username,
            email: user.email,
        }
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
        }
    });
}