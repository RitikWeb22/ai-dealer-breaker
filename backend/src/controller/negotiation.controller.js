import negotiationModel from '../models/negotiation.model.js';
import productModel from '../models/product.model.js';
import numberToHindiWords from "../utils/Hindinumbers.js";
import mongoose from 'mongoose';

export const createNegotiation = async (req, res) => {
    try {
        const { message } = req.body;

        // Log receive type for debugging
        console.log("📩 Webhook Received. Type:", message?.type);

        if (message?.type === 'tool-calls') {
            const toolCalls = message.toolCalls || [];

            const results = await Promise.all(toolCalls.map(async (toolCall) => {
                if (toolCall.function?.name === "confirmDeal") {
                    // 1. Arguments Parsing
                    let args = toolCall.function.arguments;
                    if (typeof args === 'string') {
                        try { args = JSON.parse(args); } catch { args = {}; }
                    }

                    const finalPriceNum = Number(args.finalPrice || args.price) || 0;

                    // 2. Variables Extraction (Synced with startVapiSession)
                    const vars = message.call?.variables || {};
                    const totalMsrp = Number(vars.raw_msrp) || 0;
                    const floorLimit = Number(vars.raw_floor) || (totalMsrp * 0.75);

                    // 3. Efficiency Calculation (Shark Score)
                    const possibleSavings = totalMsrp - floorLimit;
                    const actualSavings = totalMsrp - finalPriceNum;
                    let efficiency = possibleSavings <= 0 ? 100 : (actualSavings / possibleSavings) * 100;
                    const finalEfficiency = Number(Math.min(Math.max(efficiency, 0), 100).toFixed(2));

                    // 4. UserID Strategy (Mixed Type Support)
                    // Agar userId valid ObjectId nahi hai toh "anonymous" string use karega
                    const dbUserId = mongoose.Types.ObjectId.isValid(vars.userId)
                        ? vars.userId
                        : "anonymous";

                    console.log(`📊 Processing Deal for ${vars.username}: Final ₹${finalPriceNum} (Eff: ${finalEfficiency}%)`);

                    // 5. Background Database Save (Prevent Vapi Timeout)
                    // .then/catch use kiya hai taaki res.status turant ja sake
                    negotiationModel.findOneAndUpdate(
                        { callId: message.call?.id }, // Use callId to prevent duplicate saves
                        {
                            userId: dbUserId,
                            username: vars.username || "Guest Shark",
                            items: vars.items_in_basket ? vars.items_in_basket.split(", ") : ["Negotiated Items"],
                            totalMsrp,
                            finalPrice: finalPriceNum,
                            floorPrice: floorLimit,
                            efficiencyScore: finalEfficiency,
                            callId: message.call?.id // Optional: Schema mein callId add kar lena
                        },
                        { upsert: true, new: true, setDefaultsOnInsert: true }
                    ).then(doc => console.log("✅ [DB SAVE SUCCESS]"))
                        .catch(err => console.error("❌ [DB SAVE ERROR]:", err.message));

                    // 6. Tool Success Response
                    return {
                        toolCallId: toolCall.id,
                        result: `Success! Deal recorded at ₹${finalPriceNum}. Efficiency: ${finalEfficiency}%.`
                    };
                }
                return { toolCallId: toolCall.id, result: "Processed" };
            }));

            // CRITICAL: 201 for Vapi Tool Responses
            return res.status(201).json({ results });
        }

        // Prevent Vapi retries for other message types
        return res.status(200).json({ status: 'received' });

    } catch (err) {
        console.error("❌ [WEBHOOK CRITICAL FAIL]:", err);
        return res.status(200).json({ error: "Fail-safe triggered" });
    }
};

export const startVapiSession = async (req, res) => {
    try {
        const { selectedItems, user } = req.body;

        if (!selectedItems || selectedItems.length === 0) {
            return res.status(400).json({ success: false, message: "Basket is empty" });
        }

        // Fetch products from DB
        const products = await productModel.find({ name: { $in: selectedItems } });

        const totalMsrp = products.reduce((sum, p) => sum + (Number(p.msrp) || 0), 0);
        const totalFloor = products.reduce((sum, p) => {
            const price = Number(p.floor_price || p.floorPrice);
            return sum + (price > 0 ? price : Math.round(p.msrp * 0.75));
        }, 0);

        console.log(`📦 Session Start: ${user?.username || 'Guest'} | MSRP: ${totalMsrp}`);

        return res.status(200).json({
            variableValues: {
                // AI Verbal Variables (Alex will use these for speaking)
                username: user?.username || user?.name || "Shark",
                items_in_basket: selectedItems.join(", "),
                total_msrp: numberToHindiWords(totalMsrp),
                floor_limit: numberToHindiWords(totalFloor),

                // Raw Numeric Variables (For Backend/Logic)
                raw_msrp: totalMsrp,
                raw_floor: totalFloor,
                userId: user?._id || user?.id || "anonymous"
            }
        });

    } catch (error) {
        console.error("❌ startVapiSession Error:", error);
        res.status(500).json({ error: error.message });
    }
};