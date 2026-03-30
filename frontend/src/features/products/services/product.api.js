// services/product.api.js
import axios from "axios";

export const fetchAllProducts = async () => {
    try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/product/all`, {
            withCredentials: true // 👈 401 error se bachne ke liye zaroori hai
        });
        // Agar aapka backend { success: true, products: [...] } bhej raha hai
        return response.data;
    } catch (error) {
        console.error("Error fetching products:", error);
        return { products: [] }; // 👈 Fallback taaki map() crash na kare
    }
};