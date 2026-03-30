import axios from 'axios';

export const getNegotiationSession = async (basketItems, user) => {
    // 1. Items cleanup - Supporting all naming conventions
    const cleanItems = basketItems.map(item => {
        const msrp = Number(item.msrp || item.totalMsrp || item.price) || 0;
        // Fallback to 75% MSRP if floor price is missing
        const floor = Number(item.floor_price || item.floorPrice) || Math.round(msrp * 0.75);

        return {
            name: item.name || (typeof item === 'string' ? item : "Unknown Product"),
            msrp: msrp,
            floor: floor
        };
    }).filter(i => i.name);

    // 2. Aggregate Totals
    const totalMsrpVal = cleanItems.reduce((acc, item) => acc + item.msrp, 0);
    const totalFloorVal = cleanItems.reduce((acc, item) => acc + item.floor, 0);

    // 3. FLAT PAYLOAD (Backend sync ke liye zaroori hai)
    const payload = {
        selectedItems: cleanItems.map(i => i.name),
        // Variables naming synced with vapi.controller.js
        raw_msrp: totalMsrpVal,
        raw_floor: totalFloorVal,
        // Flat user data - Taaki Vapi vars.username direct pakad sake
        username: user?.username || user?.name || "Guest Shark",
        userId: user?._id || user?.id || "65f1a2b3c4d5e6f7a8b9c0d1"
    };

    console.log("🚀 SENDING FLAT PAYLOAD:", payload);

    try {
        const response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/vapi/session-config`,
            payload
        );
        return response.data;
    } catch (error) {
        console.error("❌ Negotiation API Error:", error.response?.data || error.message);
        throw error;
    }
};