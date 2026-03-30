import negotiationModel from '../models/negotiation.model.js';
import productModel from '../models/product.model.js';
import numberToHindiWords from "../utils/Hindinumbers.js";
import mongoose from 'mongoose';

export const createNegotiation = async (req, res) => {
    try {
        const { message } = req.body;

        // Debugging ke liye full payload log (sirf development mein)
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

                    // 2. Variables Extraction (More Robust Check)
                    // Vapi variables different paths mein ho sakte hain
                    const vars = message.call?.variables || message.variables || {};
                    const totalMsrp = Number(vars.raw_msrp) || 0;
                    const floorLimit = Number(vars.raw_floor) || (totalMsrp * 0.75);

                    // 3. Efficiency Calculation
                    const possibleSavings = totalMsrp - floorLimit;
                    const actualSavings = totalMsrp - finalPriceNum;
                    let efficiency = possibleSavings <= 0 ? 100 : (actualSavings / possibleSavings) * 100;
                    const finalEfficiency = Number(Math.min(Math.max(efficiency, 0), 100).toFixed(2));

                    // 4. UserID & CallID Safety
                    const dbUserId = mongoose.Types.ObjectId.isValid(vars.userId) ? vars.userId : null;
                    const currentCallId = message.call?.id || `manual-${Date.now()}`;

                    console.log(`📊 Processing: ${vars.username} | ₹${finalPriceNum} | Eff: ${finalEfficiency}%`);

                    // 5. Database Update Logic
                    // Update key: Username + FinalPrice (agar callId schema mein nahi hai toh safely handle karega)
                    const updateData = {
                        userId: dbUserId,
                        username: vars.username || "Guest Shark",
                        items: vars.items_in_basket ? vars.items_in_basket.split(", ") : ["Negotiated Items"],
                        totalMsrp,
                        finalPrice: finalPriceNum,
                        floorPrice: floorLimit,
                        efficiencyScore: finalEfficiency,
                        status: "completed",
                        callId: currentCallId
                    };

                    // Execute Save with Logging
                    negotiationModel.findOneAndUpdate(
                        { callId: currentCallId },
                        updateData,
                        { upsert: true, new: true, setDefaultsOnInsert: true }
                    )
                        .then(doc => console.log("✅ [DB SAVE SUCCESS]:", doc._id))
                        .catch(err => {
                            console.error("❌ [DB SAVE ERROR]:", err.message);
                            // Fallback: Agar callId ki wajah se fail ho raha ho (schema issue)
                            console.log("Attempting fallback save without callId...");
                            new negotiationModel(updateData).save()
                                .then(() => console.log("✅ Fallback Save Success"))
                                .catch(e => console.error("🛑 Critical DB Fail:", e.message));
                        });

                    return {
                        toolCallId: toolCall.id,
                        result: `Success! Deal recorded at ₹${finalPriceNum}.`
                    };
                }
                return { toolCallId: toolCall.id, result: "Processed" };
            }));

            // Response content-type must be JSON
            return res.status(201).json({ results });
        }

        return res.status(200).json({ status: 'received' });

    } catch (err) {
        console.error("❌ [WEBHOOK CRITICAL FAIL]:", err);
        return res.status(201).json({ results: [] }); // Fail-safe for Vapi
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