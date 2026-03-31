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

            const results = await Promise.all(toolCalls.map(async (toolCall) => {
                if (toolCall.function?.name === "confirmDeal") {

                    let args = toolCall.function.arguments;
                    if (typeof args === 'string') {
                        try { args = JSON.parse(args); } catch { args = {}; }
                    }

                    // Extract price - 0 means No Deal (CASE 2)
                    const finalPriceNum = Number(args.finalPrice || args.price) || 0;
                    const isDealBroken = finalPriceNum <= 0;

                    const vars = message.variables || message.call?.variables || {};
                    const totalMsrp = Number(vars.raw_msrp) || 0;
                    const floorLimit = Number(vars.raw_floor) || Math.round(totalMsrp * 0.75);

                    // Efficiency: If deal broken, efficiency is 0
                    let efficiency = 0;
                    if (!isDealBroken) {
                        const possibleSavings = totalMsrp - floorLimit;
                        const actualSavings = totalMsrp - finalPriceNum;
                        efficiency = possibleSavings <= 0 ? 100 : (actualSavings / possibleSavings) * 100;
                    }
                    const finalEfficiency = Number(Math.min(Math.max(efficiency, 0), 100).toFixed(2));

                    const currentCallId = message.call?.id || toolCall.id;

                    const updateData = {
                        userId: vars.userId || "anonymous",
                        username: vars.username || "Guest Shark",
                        items: vars.items_in_basket ? vars.items_in_basket.split(", ") : ["Negotiated Items"],
                        totalMsrp,
                        finalPrice: finalPriceNum,
                        floorPrice: floorLimit,
                        efficiencyScore: finalEfficiency,
                        status: isDealBroken ? "failed" : "completed", // ✅ 0 price pe 'failed' save hoga
                        callId: currentCallId
                    };

                    try {
                        await negotiationModel.findOneAndUpdate(
                            { callId: currentCallId },
                            updateData,
                            { upsert: true, new: true, setDefaultsOnInsert: true }
                        );
                        console.log(`✅ [DB ${isDealBroken ? 'FAILED' : 'SUCCESS'}]:`, currentCallId);
                    } catch (dbErr) {
                        console.error("❌ [DB SAVE ERROR]:", dbErr.message);
                    }

                    return {
                        toolCallId: toolCall.id,
                        result: isDealBroken
                            ? "Negotiation failed. Ending call."
                            : `Deal confirmed at ₹${finalPriceNum}. Ending call.`,
                        endCall: true // ✨ Agent ke tool hit karte hi call disconnect ho jayegi
                    };
                }
                return { toolCallId: toolCall.id, result: "Tool processed" };
            }));

            return res.status(201).json({ results });
        }

        // --- Handle Disconnect via end-of-call-report (Fail-safe) ---
        if (message?.type === 'end-of-call-report') {
            const callId = message.call?.id;
            const existing = await negotiationModel.findOne({ callId });

            // Agar agent ne bina tool hit kiye call kaat di (rare) toh 'failed' entry create karo
            if (!existing) {
                const vars = message.call?.variables || {};
                await negotiationModel.create({
                    callId,
                    username: vars.username || "Guest Shark",
                    status: "failed",
                    totalMsrp: Number(vars.raw_msrp) || 0,
                    efficiencyScore: 0
                });
            }
        }

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