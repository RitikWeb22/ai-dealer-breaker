import axios from 'axios';

export const getNegotiationSession = async (basketItems, user) => {
    // 1. Validation check
    if (!basketItems || basketItems.length === 0) {
        throw new Error("Basket is empty. Add products to negotiate!");
    }

    // 2. Pricing Logic (Ensuring numbers are clean)
    const totalMsrp = basketItems.reduce((acc, item) =>
        acc + (Number(item.msrp || item.price) || 0), 0);

    // Default floor is 75% if not provided in DB
    const totalFloor = basketItems.reduce((acc, item) => {
        const itemPrice = Number(item.msrp || item.price) || 0;
        const itemFloor = Number(item.floor_price || item.floor);
        return acc + (itemFloor || Math.round(itemPrice * 0.75));
    }, 0);

    // 🛠️ FIX: Ensure userId is a clean string or null (Avoid 'undefined')
    // Agar user logged in hai toh uski ID, warna "anonymous"
    const currentUserId = user?._id || user?.id || "anonymous";

    const payload = {
        selectedItems: basketItems.map(i => i.name),
        username: user?.username || user?.name || "Guest Shark",
        userId: String(currentUserId),
        raw_msrp: totalMsrp,
        raw_floor: totalFloor
    };

    try {
        console.log("📡 Fetching Vapi Config for:", payload.username);

        const response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/vapi/session-config`,
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    // Agar token hai toh bhej do, fallback for guest
                    'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
                }
            }
        );

        return response.data; // Expected: { variableValues: {...} }
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        console.error("❌ Session Config Error:", errorMsg);
        throw new Error(errorMsg);
    }
};