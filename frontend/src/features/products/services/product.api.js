import axios from 'axios';

const api = `${import.meta.env.VITE_BACKEND_URL}/api/product` || `http://localhost:3000/api/product`;
export const fetchAllProducts = async () => {
    const response = await axios.get(`${api}/all`);
    return response.data;
};