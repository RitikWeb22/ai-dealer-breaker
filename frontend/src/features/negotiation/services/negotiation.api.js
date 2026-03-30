import axios from 'axios';

export const getNegotiationSession = async (basketItems, user) => {
    // 1. Items cleanup with Prices (Zaroori hai backend calculation ke liye)
    const cleanItems = basketItems.map(item => {
        return {
            name: item.name || item,
            msrp: Number(item.msrp) || 0,
            floor: Number(item.floorPrice) || 0
        };
    }).filter(i => i.name);

    // 2. Calculations for Frontend Override (Consistency ke liye)
    const totalMsrpVal = basketItems.reduce((acc, item) => acc + (Number(item.msrp) || 0), 0);
    const totalFloorVal = basketItems.reduce((acc, item) => acc + (Number(item.floorPrice) || 0), 0);

    const payload = {
        selectedItems: cleanItems.map(i => i.name), // Backend compatibility
        // Addition: Inhe as variables bhejo taaki Vapi prompt sahi bane
        raw_msrp_val: totalMsrpVal,
        raw_floor_val: totalFloorVal,
        user: {
            id: user?._id || "user_01",
            name: user?.username || "Ritik"
        }
    };

    console.log("FINAL CLEAN PAYLOAD:", payload);

    const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/vapi/session-config`,
        payload
    );

    return response.data;
};