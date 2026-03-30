import axios from 'axios';

export const getNegotiationSession = async (basketItems, user) => {
    if (!basketItems || basketItems.length === 0) throw new Error("Basket empty");

    const totalMsrp = basketItems.reduce((acc, item) => acc + (Number(item.msrp || item.price) || 0), 0);
    const totalFloor = basketItems.reduce((acc, item) =>
        acc + (Number(item.floor_price || item.floor) || Math.round((item.msrp || item.price) * 0.75)), 0);

    const payload = {
        selectedItems: basketItems.map(i => i.name),
        username: user?.username || "Guest Shark",
        userId: user?._id || "anonymous",
        raw_msrp: totalMsrp,
        raw_floor: totalFloor
    };

    try {
        // Backend se Vapi-compatible config mangwao
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/vapi/session-config`, payload);
        return response.data; // Returns { variableValues: {...} }
    } catch (error) {
        console.error("❌ Session Config Error:", error.message);
        throw error;
    }
};