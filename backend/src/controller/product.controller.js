import productModel from "../models/product.model.js";

export async function addProduct(req, res) {
    try {
        const { name, description, image, msrp, floor_price } = req.body;

        // Basic Validation: Taki empty products add na hon
        if (!name || !msrp || !floor_price) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const newProduct = await productModel.create({
            name,
            description,
            image,
            msrp,
            floor_price
        });

        res.status(201).json({
            success: true,
            message: 'Product added successfully',
            product: newProduct
        });
    } catch (error) {
        console.error("Add Product Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}

export async function getAllProducts(req, res) {
    try {
        const products = await productModel.find();

        // Agar DB khali hai toh 404 nahi, empty array bhej rahe hain (Clean UI handle karega)
        res.status(200).json({
            success: true,
            message: 'Products retrieved successfully',
            products: products || []
        });
    } catch (error) {
        console.error("Get All Products Error:", error);
        res.status(500).json({
            success: false,
            message: "Database error! Check if MongoDB is connected.",
            error: error.message
        });
    }
}