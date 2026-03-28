import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/api/negotiation`;

export const getNegotiationSession = async (items, user) => {
    const response = await axios.post(`${API_URL}/start-session`, {
        selectedItems: items,
        user: user
    });
    return response.data;
};