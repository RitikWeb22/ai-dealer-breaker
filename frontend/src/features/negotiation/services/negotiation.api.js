import axios from 'axios';

export const getNegotiationSession = async (basketItems, user) => {
    // 1. Items cleanup - Dono naming conventions handle kiye hain
    const cleanItems = basketItems.map(item => {
        const msrp = Number(item.msrp || item.totalMsrp) || 0;
        // Agat floor missing hai toh 75% MSRP default calculation
        const floor = Number(item.floor_price || item.floorPrice) || Math.round(msrp * 0.75);

        return {
            name: item.name || item,
            msrp: msrp,
            floor: floor
        };
    }).filter(i => i.name);

    const totalMsrpVal = cleanItems.reduce((acc, item) => acc + item.msrp, 0);
    const totalFloorVal = cleanItems.reduce((acc, item) => acc + item.floor, 0);

    const payload = {
        selectedItems: cleanItems.map(i => i.name),
        raw_msrp_val: totalMsrpVal,
        raw_floor_val: totalFloorVal,
        user: {
            id: user?._id || user?.id || "65f1a2b3c4d5e6f7a8b9c0d1", // Valid MongoID format fallback
            name: user?.username || user?.name || "Ritik"
        }
    };

    console.log("🚀 FINAL CLEAN PAYLOAD:", payload);

    const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/vapi/session-config`,
        payload
    );

    return response.data;
};