import mongoose from 'mongoose';


const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],

    },
    password: {
        type: String,
        required: [true, 'Password is required'],
    }

});

const userModel = mongoose.model('user', userSchema);

export default userModel;