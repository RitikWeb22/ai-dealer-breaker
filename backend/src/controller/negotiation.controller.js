import negotiationModel from '../models/negotiation.model.js';
import productModel from '../models/product.model.js';

// 🚀 FIX: Is controller ko Vapi Dashboard mein as "Server URL" use karna
export const createNegotiation = async (req, res) => {
    const { message } = req.body;

    // 1. MUST: Vapi hamesha 'tool-calls' (plural) bhejta hai
    if (message?.type === 'tool-calls') {
        const toolCall = message?.toolCalls?.[0]; // Array access fix

        if (toolCall?.function?.name === "confirmDeal") {
            try {
                // 2. Arguments extract karo (Jo Alex ne bhejey)
                const { finalPrice, items } = toolCall.function.arguments;

                // 3. Variables extract karo (Jo Call context mein hain)
                const vars = message.call?.variables || {};
                const totalMsrp = Number(vars.raw_msrp) || 0;
                const floor_limit = Number(vars.raw_floor) || 0;
                const finalPriceNum = Number(finalPrice);

                // Efficiency Score Logic (Limit 0-100)
                const possibleSavings = totalMsrp - floor_limit;
                const actualSavings = totalMsrp - finalPriceNum;
                let efficiency = possibleSavings <= 0 ? 100 : (actualSavings / possibleSavings) * 100;
                efficiency = Math.min(Math.max(efficiency, 0), 100).toFixed(2);

                // 4. Save to MongoDB
                const negotiation = await negotiationModel.create({
                    userId: vars.userId || "anonymous",
                    username: vars.username || "Guest",
                    // Items ko array mein convert karna agar string hai
                    item: typeof items === 'string' ? items.split(',').map(i => i.trim()) : (Array.isArray(items) ? items : [items]),
                    totalMsrp,
                    finalPrice: finalPriceNum,
                    floorPrice: floor_limit,
                    efficiencyScore: efficiency
                });

                console.log(`✅ Deal Saved: ID ${negotiation._id} for ${vars.username}`);

                // 5. CRITICAL: Vapi ko ye format chahiye call end karne ke liye
                return res.status(201).json({
                    results: [{
                        toolCallId: toolCall.id,
                        result: `Deal confirmed at ₹${finalPriceNum}. Leaderboard updated!`
                    }]
                });

            } catch (err) {
                console.error("❌ DB Save Error:", err);
                // Fail hone par bhi response do taaki call hang na ho
                return res.status(200).json({
                    results: [{ toolCallId: toolCall.id, result: "Internal error but call processed" }]
                });
            }
        }
    }

    // Default status for other message types
    res.status(200).json({ status: 'received' });
};


// 🛠️ Helper to fetch items and calculate prices for the Frontend Start Call
export const startVapiSession = async (req, res) => {
    try {
        const { selectedItems, user } = req.body;

        if (!selectedItems || selectedItems.length === 0) {
            return res.status(400).json({ success: false, message: "Basket empty" });
        }

        const products = await productModel.find({ name: { $in: selectedItems } });
        const totalMsrp = products.reduce((sum, p) => sum + (p.msrp || 0), 0);
        const totalFloor = products.reduce((sum, p) => sum + (p.floor_price || 0), 0);

        // Vapi prompt ke liye configuration
        return res.status(200).json({
            variableValues: {
                username: user?.name || "Customer",
                items_in_basket: selectedItems.join(", "),
                total_msrp: totalMsrp, // Backend calculation
                floor_limit: totalFloor,
                raw_msrp: totalMsrp,
                raw_floor: totalFloor,
                userId: user?.id || "anonymous"
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};