import { Router } from 'express';
import { addProduct, getAllProducts } from '../controller/product.controller.js';

const productRouter = Router();

productRouter.post('/add-product', addProduct)

productRouter.get('/all', getAllProducts)

export default productRouter;