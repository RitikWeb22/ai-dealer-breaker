import negotiationModel from '../models/negotiation.model.js';
import productModel from '../models/product.model.js';

// 🚀 FIX: Is controller ko Vapi Dashboard mein as "Server URL" use karna
export const createNegotiation = async (req, res) => {
    try {
        const { message } = req.body;

        // 1. Check for 'tool-calls' (Vapi plural format)
        if (message?.type === 'tool-calls') {
            const toolCalls = message.toolCalls || [];

            // Sabhi tool calls ko process karein (Usually ek hi hota hai 'confirmDeal')
            const results = await Promise.all(toolCalls.map(async (toolCall) => {
                if (toolCall.function?.name === "confirmDeal") {

                    // ✅ SAFE PARSING: Arguments string ya object dono ho sakte hain
                    let args = toolCall.function.arguments;
                    if (typeof args === 'string') {
                        try { args = JSON.parse(args); } catch (e) { console.error("Args Parsing Error"); }
                    }

                    const { finalPrice, items } = args;

                    // 2. Extract hidden variables from call context
                    const vars = message.call?.variables || {};
                    const totalMsrp = Number(vars.raw_msrp) || 0;
                    const floor_limit = Number(vars.raw_floor) || (totalMsrp * 0.75); // Fallback to 75%
                    const finalPriceNum = Number(finalPrice);

                    // ✅ Efficiency Score Logic
                    const possibleSavings = totalMsrp - floor_limit;
                    const actualSavings = totalMsrp - finalPriceNum;
                    let efficiency = possibleSavings <= 0 ? 100 : (actualSavings / possibleSavings) * 100;

                    // Clamp 0-100 and format
                    const finalEfficiency = Math.min(Math.max(efficiency, 0), 100).toFixed(2);

                    // 3. Save to MongoDB
                    const negotiation = await negotiationModel.create({
                        userId: vars.userId || "anonymous",
                        username: vars.username || "Guest",
                        // Items format handling
                        item: Array.isArray(items) ? items : (typeof items === 'string' ? items.split(',') : [vars.items_in_basket]),
                        totalMsrp,
                        finalPrice: finalPriceNum,
                        floorPrice: floor_limit,
                        efficiencyScore: Number(finalEfficiency)
                    });

                    console.log(`✅ [DB SUCCESS] Deal Saved: ID ${negotiation._id} | User: ${vars.username}`);

                    // 4. Return correct toolCallId and result
                    return {
                        toolCallId: toolCall.id,
                        result: `Deal confirmed at ₹${finalPriceNum}. Data sent to leaderboard.`
                    };
                }
                return { toolCallId: toolCall.id, result: "Tool not handled" };
            }));

            // ✅ Vapi hamesha 201 status aur results array expect karta hai
            return res.status(201).json({ results });
        }

        // Baki messages (assistant-speaking, etc.) ke liye 200 OK
        return res.status(200).json({ status: 'received' });

    } catch (err) {
        console.error("❌ Webhook Critical Error:", err);
        // Fail-safe response taaki call hang na ho
        return res.status(201).json({
            results: [{ toolCallId: req.body.message?.toolCalls?.[0]?.id, result: "Error but call processed" }]
        });
    }
};


// 🛠️ Start Session: Frontend logic to fetch prices and set Vapi variables
export const startVapiSession = async (req, res) => {
    try {
        const { selectedItems, user } = req.body;

        if (!selectedItems || selectedItems.length === 0) {
            return res.status(400).json({ success: false, message: "Basket is empty" });
        }

        // Database se latest prices uthao
        const products = await productModel.find({ name: { $in: selectedItems } });

        const totalMsrp = products.reduce((sum, p) => sum + (Number(p.msrp) || 0), 0);
        // Floor price fallback agar DB mein 0 ho
        const totalFloor = products.reduce((sum, p) => {
            const price = Number(p.floor_price);
            return sum + (price > 0 ? price : (p.msrp * 0.75));
        }, 0);

        console.log(`📦 Session Start: ${user?.name} | MSRP: ${totalMsrp} | Floor: ${totalFloor}`);

        return res.status(200).json({
            variableValues: {
                username: user?.name || "Customer",
                items_in_basket: selectedItems.join(", "),
                total_msrp: totalMsrp,
                floor_limit: totalFloor,
                raw_msrp: totalMsrp,
                raw_floor: totalFloor,
                userId: user?.id || "anonymous"
            }
        });

    } catch (error) {
        console.error("❌ startVapiSession Error:", error);
        res.status(500).json({ error: error.message });
    }
};