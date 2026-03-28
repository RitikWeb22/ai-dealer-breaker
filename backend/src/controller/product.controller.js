

export async function addProduct(req, res) {
    const { name, description, image, msrp, floor_price } = req.body;

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
}


export async function getAllProducts(req, res) {
    const products = await productModel.find();
    res.status(200).json({
        success: true,
        message: 'Products retrieved successfully',
        products
    });
}