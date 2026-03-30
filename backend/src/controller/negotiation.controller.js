import negotiationModel from '../models/negotiation.model.js';
import productModel from '../models/product.model.js';
import numberToHindiWords from "../utils/Hindinumbers.js";
import mongoose from 'mongoose';

export const createNegotiation = async (req, res) => {
    try {
        const { message } = req.body;
        console.log("📩 Webhook Received. Type:", message?.type);

        if (message?.type === 'tool-calls') {
            const toolCalls = message.toolCalls || [];

            // 1. Map through tool calls and WAIT for DB operations
            const results = await Promise.all(toolCalls.map(async (toolCall) => {
                if (toolCall.function?.name === "confirmDeal") {

                    // Arguments Parsing
                    let args = toolCall.function.arguments;
                    if (typeof args === 'string') {
                        try { args = JSON.parse(args); } catch { args = {}; }
                    }

                    const finalPriceNum = Number(args.finalPrice || args.price) || 0;

                    // 2. Robust Variables Extraction
                    // Tool calls mein variables aksar 'message.variables' mein hote hain
                    const vars = message.variables || message.call?.variables || {};

                    const totalMsrp = Number(vars.raw_msrp) || 0;
                    const floorLimit = Number(vars.raw_floor) || Math.round(totalMsrp * 0.75);

                    // 3. Efficiency Calculation
                    const possibleSavings = totalMsrp - floorLimit;
                    const actualSavings = totalMsrp - finalPriceNum;
                    let efficiency = possibleSavings <= 0 ? 100 : (actualSavings / possibleSavings) * 100;
                    const finalEfficiency = Number(Math.min(Math.max(efficiency, 0), 100).toFixed(2));

                    // 4. Identity Handling
                    const currentCallId = message.call?.id || toolCall.id || `call-${Date.now()}`;

                    const updateData = {
                        userId: vars.userId || "anonymous",
                        username: vars.username || "Guest Shark",
                        items: vars.items_in_basket ? vars.items_in_basket.split(", ") : ["Negotiated Items"],
                        totalMsrp,
                        finalPrice: finalPriceNum,
                        floorPrice: floorLimit,
                        efficiencyScore: finalEfficiency,
                        status: "completed",
                        callId: currentCallId
                    };

                    try {
                        // 5. AWAIT the Database Save (Don't use .then here)
                        const savedDoc = await negotiationModel.findOneAndUpdate(
                            { callId: currentCallId },
                            updateData,
                            { upsert: true, new: true, setDefaultsOnInsert: true }
                        );
                        console.log("✅ [DB SAVE SUCCESS]:", savedDoc._id);
                    } catch (dbErr) {
                        console.error("❌ [DB SAVE ERROR]:", dbErr.message);
                    }

                    return {
                        toolCallId: toolCall.id,
                        result: `Deal confirmed at ₹${finalPriceNum}. Thank you!`
                    };
                }
                return { toolCallId: toolCall.id, result: "Tool processed" };
            }));

            return res.status(201).json({ results });
        }

        return res.status(200).json({ status: 'received' });

    } catch (err) {
        console.error("❌ [WEBHOOK CRITICAL FAIL]:", err);
        return res.status(201).json({ results: [] });
    }
};
export const startVapiSession = async (req, res) => {
    try {
        const { selectedItems, user } = req.body;

        if (!selectedItems || selectedItems.length === 0) {
            return res.status(400).json({ success: false, message: "Basket is empty" });
        }

        const products = await productModel.find({ name: { $in: selectedItems } });

        const totalMsrp = products.reduce((sum, p) => sum + (Number(p.msrp) || 0), 0);
        const totalFloor = products.reduce((sum, p) => {
            const price = Number(p.floor_price || p.floorPrice);
            return sum + (price > 0 ? price : Math.round(p.msrp * 0.75));
        }, 0);

        // Variables should be Flat Strings/Numbers for Vapi
        return res.status(200).json({
            variableValues: {
                username: String(user?.username || "Shark"),
                items_in_basket: selectedItems.join(", "),
                total_msrp: numberToHindiWords(totalMsrp),
                floor_limit: numberToHindiWords(totalFloor),
                raw_msrp: Number(totalMsrp),
                raw_floor: Number(totalFloor),
                userId: String(user?._id || "anonymous")
            }
        });

    } catch (error) {
        console.error("❌ startVapiSession Error:", error);
        res.status(500).json({ error: error.message });
    }
};