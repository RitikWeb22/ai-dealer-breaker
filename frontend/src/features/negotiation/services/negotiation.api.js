// negotiation.api.js
import axios from 'axios';

export const getNegotiationSession = async (basketItems, user) => {
    // 1. Logic: Agar item object hai toh name lo, agar string hai toh wahi lo
    const cleanItems = basketItems.map(item => {
        if (typeof item === 'object' && item !== null) {
            return item.name; // Agar object hai (e.g. {name: 'nike shoes'})
        }
        return item; // Agar direct string hai (e.g. 'nike shoes')
    }).filter(Boolean); // Kisi bhi null/undefined ko remove karne ke liye

    const payload = {
        selectedItems: cleanItems,
        user: {
            id: user?.id || "user_01",
            name: user?.name || "Ritik"
        }
    };

    console.log("FINAL CLEAN PAYLOAD:", payload);

    const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/vapi/session-config`,
        payload
    );

    return response.data;
};