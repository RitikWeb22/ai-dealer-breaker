import axios from 'axios';

export const getNegotiationSession = async (basketItems, user) => {
    // 1. Items clean up logic
    const cleanItems = basketItems.map(item => {
        if (typeof item === 'object' && item !== null) {
            return item.name;
        }
        return item;
    }).filter(Boolean);

    // 2. Fix: user.username ka use karein (kyuki AuthContext mein yahi hai)
    const payload = {
        selectedItems: cleanItems,
        user: {
            id: user?._id || "user_01", // MongoDB ki ID '_id' hoti hai
            name: user?.username || "Ritik" // 'name' ki jagah 'username' check karein
        }
    };

    console.log("FINAL CLEAN PAYLOAD:", payload);

    const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/vapi/session-config`,
        payload
    );

    return response.data;
};