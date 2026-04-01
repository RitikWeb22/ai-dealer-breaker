import mongoose from 'mongoose';


const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        trim: true,
        minlength: 3,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,

    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        select: false,
    }

}, { timestamps: true });

const userModel = mongoose.model('user', userSchema);

export default userModel;