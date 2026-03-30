import axios from 'axios';

export const getNegotiationSession = async (basketItems, user) => {
    // 1. Items cleanup & Validation
    if (!basketItems || basketItems.length === 0) {
        throw new Error("Basket is empty. Select products first.");
    }

    const cleanItems = basketItems.map(item => {
        const msrp = Number(item.msrp || item.totalMsrp || item.price) || 0;
        // Fallback: 75% of MSRP as floor price (Munirka style bargaining limit!)
        const floor = Number(item.floor_price || item.floorPrice || item.floor) || Math.round(msrp * 0.75);

        return {
            name: item.name || (typeof item === 'string' ? item : "Premium Product"),
            msrp: msrp,
            floor: floor
        };
    }).filter(i => i.name && i.msrp > 0);

    // 2. Aggregate Totals
    const totalMsrpVal = cleanItems.reduce((acc, item) => acc + item.msrp, 0);
    const totalFloorVal = cleanItems.reduce((acc, item) => acc + item.floor, 0);

    // 3. Stringified list for Vapi Voice (Alex reads this better than an array)
    const itemsString = cleanItems
        .map(i => `${i.name} (₹${i.msrp.toLocaleString()})`)
        .join(", ");

    // 4. THE PAYLOAD (MongoDB Identity Focus)
    const payload = {
        selectedItems: cleanItems.map(i => i.name),
        items_in_basket: itemsString,
        raw_msrp: totalMsrpVal,
        raw_floor: totalFloorVal,

        // Identity Tracking: Screenshots ke basis par prioritize karke
        username: user?.username || user?.name || "Guest Shark",
        userId: user?._id || user?.id || "69c74f6c10fd160b3aeb0fc2", // Fallback to 'test' user ID from your Compass

        // Vapi Dashboard visual strings
        total_msrp: `₹${totalMsrpVal.toLocaleString()}`,
        floor_limit: `₹${totalFloorVal.toLocaleString()}`
    };

    console.log("🚀 SENDING FLAT PAYLOAD TO BACKEND:", payload);

    try {
        const response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/vapi/session-config`,
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    // Optional: If you need to send the token for authentication
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error("❌ Negotiation API Error:", error.response?.data || error.message);
        throw error;
    }
};