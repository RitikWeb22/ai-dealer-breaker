import dotenv from 'dotenv';
dotenv.config();
import app from './src/app.js';
import { connectDB } from './src/config/db.js';

// port
const port = process.env.PORT;


// database connection
connectDB();



// server running
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});