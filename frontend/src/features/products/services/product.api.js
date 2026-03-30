import axios from 'axios';

// Fallback logic ko thoda clean karte hain
const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const api = `${BASE_URL}/api/product`;

export const fetchAllProducts = async () => {
    try {
        const response = await axios.get(`${api}/all`);

        // Ensure kijiye ki response.data ek array hi ho
        if (response.data && response.data.success) {
            return response.data.products; // Agar aapka backend { success: true, products: [] } bhej raha hai
        }

        return response.data || [];
    } catch (error) {
        console.error("Error fetching products:", error.message);
        // Fallback empty array taaki UI break na ho
        return [];
    }
};