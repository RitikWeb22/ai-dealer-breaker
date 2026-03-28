// negotiation.api.js
import axios from 'axios';

export const getNegotiationSession = async (basketItems, user) => {
    const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/negotiation/start-session`,

        {
            selectedItems: basketItems.map(item => item.name), // ✅ backend expects names, not objects
            user: {
                id: user.id,       // ✅ backend uses user?.id
                name: user.name    // ✅ backend uses user?.name
            }
        }
    );
    console.log("PAYLOAD:", {
        selectedItems: basketItems.map(item => item.name),
        user: { id: user?.id, name: user?.name }
    });


    return response.data;
};