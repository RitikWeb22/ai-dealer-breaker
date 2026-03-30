import mongoose from 'mongoose';
import negotiationModel from '../models/negotiation.model.js';
import productModel from '../models/product.model.js';

export const createNegotiation = async (req, res) => {
    try {
        const { message } = req.body;

        if (message?.type === 'tool-calls') {
            const toolCalls = message.toolCalls || [];

            const results = await Promise.all(toolCalls.map(async (toolCall) => {
                if (toolCall.function?.name === "confirmDeal") {

                    let args = toolCall.function.arguments;
                    if (typeof args === 'string') {
                        try { args = JSON.parse(args); } catch (e) { console.error("JSON Parse Error"); }
                    }

                    const { finalPrice, items: itemsFromAlex } = args;
                    const vars = message.call?.variables || {};

                    // ✅ FIX 1: Data Type Alignment
                    const totalMsrp = Number(vars.raw_msrp) || 0;
                    const floor_limit = Number(vars.raw_floor) || (totalMsrp * 0.75);
                    const finalPriceNum = Number(finalPrice);

                    // Efficiency Logic
                    const possibleSavings = totalMsrp - floor_limit;
                    const actualSavings = totalMsrp - finalPriceNum;
                    let efficiency = possibleSavings <= 0 ? 100 : (actualSavings / possibleSavings) * 100;
                    const finalEfficiency = Math.min(Math.max(efficiency, 0), 100);

                    // ✅ FIX 2: ObjectId Validation
                    // Agar userId valid MongoID nahi hai, toh ek fallback system lagao
                    const validUserId = mongoose.Types.ObjectId.isValid(vars.userId)
                        ? vars.userId
                        : new mongoose.Types.ObjectId(); // Generate temporary ID if missing

                    // ✅ FIX 3: Field Name Match (items instead of item)
                    const negotiation = await negotiationModel.create({
                        userId: validUserId,
                        username: vars.username || "Guest",
                        items: Array.isArray(itemsFromAlex)
                            ? itemsFromAlex
                            : (typeof itemsFromAlex === 'string' ? itemsFromAlex.split(',') : [vars.items_in_basket]),
                        totalMsrp,
                        finalPrice: finalPriceNum,
                        floorPrice: floor_limit,
                        efficiencyScore: Number(finalEfficiency.toFixed(2))
                    });

                    console.log(`✅ [DB SAVED] ID: ${negotiation._id} | User: ${vars.username}`);

                    return {
                        toolCallId: toolCall.id,
                        result: "Deal confirmed and leaderboard updated."
                    };
                }
                return { toolCallId: toolCall.id, result: "Tool ignored." };
            }));

            return res.status(201).json({ results });
        }
        return res.status(200).json({ status: 'received' });

    } catch (err) {
        console.error("❌ CRITICAL WEBHOOK ERROR:", err.message);
        // Fail-safe response
        return res.status(201).json({
            results: [{ toolCallId: req.body.message?.toolCalls?.[0]?.id, result: "Internal processing error" }]
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