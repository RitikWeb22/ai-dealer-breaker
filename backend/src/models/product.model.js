import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Product name is required'], unique: true },
    description: { type: String, required: [true, 'Product description is required'] },
    image: { type: String, required: [true, 'Product image is required'] },
    msrp: { type: Number, required: [true, 'MSRP is required'] },
    floor_price: { type: Number, required: [true, 'Floor price is required'] }
}, { timestamps: true });


const productModel = mongoose.model('products', productSchema);

export default productModel;