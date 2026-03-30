import negotiationModel from "../models/negotiation.model.js";
import productModel from "../models/product.model.js";
import numberToHindiWords from "../utils/Hindinumbers.js";
import mongoose from "mongoose";

// ✅ Smart floor calculator
const calculateFloorPrice = (totalMsrp, products) => {
    const dbFloorTotal = products.reduce((sum, p) => sum + (Number(p.floor_price) || 0), 0);
    if (dbFloorTotal > 0) return dbFloorTotal;
    return Math.round(totalMsrp * 0.75);
};

export const getAssistantConfig = async (req, res) => {
    try {
        // Frontend se 'raw_msrp' aur 'raw_floor' direct aa rahe hain ab (as per your new frontend code)
        const { selectedItems, username, userId, raw_msrp, raw_floor } = req.body;

        console.log(`📦 Creating Config for: ${username} | MSRP: ${raw_msrp}`);

        // Vapi expects this specific structure to persist variables
        return res.status(200).json({
            variableValues: {
                // Inhe AI use karega negotiation ke liye
                username: username || "Shark",
                userId: userId || "anonymous",
                items_in_basket: selectedItems.join(", "),
                total_msrp: numberToHindiWords(raw_msrp),
                floor_limit: numberToHindiWords(raw_floor),

                // 🚨 CRITICAL: Inhe hum Webhook mein extract karenge
                // Inhe 'raw_' prefix ke saath hi rakho taaki confusion na ho
                raw_msrp: Number(raw_msrp),
                raw_floor: Number(raw_floor)
            }
        });
    } catch (error) {
        console.error("❌ getAssistantConfig error:", error);
        res.status(500).json({ error: error.message });
    }
};

export const handleVapiWebhook = async (req, res) => {
    try {
        const { message } = req.body;

        // 1. Webhook check for tool calls
        if (message?.type === 'tool-calls') {
            const toolCalls = message.toolCalls || [];

            const results = await Promise.all(toolCalls.map(async (toolCall) => {
                if (toolCall.function?.name === 'confirmDeal') {
                    let args = toolCall.function.arguments;
                    if (typeof args === 'string') args = JSON.parse(args);

                    const vars = message.call?.variables || {};

                    // ✅ Precise Variable Mapping
                    const msrp = Number(vars.raw_msrp) || 0;
                    const floor = Number(vars.raw_floor) || (msrp * 0.75);
                    const finalPriceNum = Number(args.finalPrice) || 0;

                    const dbUsername = vars.username || "Guest Shark";
                    const dbUserId = vars.userId || "65f1a2b3c4d5e6f7a8b9c0d1";

                    // ✅ Efficiency logic with safety
                    let efficiency = 0;
                    if (msrp > floor) {
                        efficiency = ((msrp - finalPriceNum) / (msrp - floor)) * 100;
                    }
                    const finalEfficiency = Math.min(Math.max(efficiency, 0), 100);

                    // ✅ Background Save (Don't let DB slow down the response)
                    negotiationModel.create({
                        userId: dbUserId,
                        username: dbUsername,
                        items: vars.items_in_basket ? vars.items_in_basket.split(", ") : ["Negotiated Items"],
                        totalMsrp: msrp,
                        finalPrice: finalPriceNum,
                        floorPrice: floor,
                        efficiencyScore: Number(finalEfficiency.toFixed(2))
                    }).then(data => console.log(`✅ [DB SAVE] Success for ${dbUsername}`))
                        .catch(err => console.error("❌ [DB SAVE ERROR]:", err.message));

                    // ✅ Vapi expects this exact result structure
                    return {
                        toolCallId: toolCall.id,
                        result: "Deal confirmed and recorded. The call will now end."
                    };
                }
                return { toolCallId: toolCall.id, result: "Tool processed." };
            }));

            // ✅ CRITICAL: Status 201 for Vapi tool-call responses
            return res.status(201).json({ results });
        }

        // 2. Handle other message types (speech-update, etc.) to prevent timeout
        return res.status(200).json({ status: "received" });

    } catch (error) {
        console.error("❌ Webhook Fatal Error:", error);
        // Fallback response to prevent Vapi from retrying infinitely
        return res.status(200).json({ error: "Fail-safe triggered" });
    }
};
export const getLeaderboard = async (req, res) => {
    try {
        const topSharks = await negotiationModel.find()
            .sort({ efficiencyScore: -1, createdAt: -1 })
            .limit(10);
        res.status(200).json({ success: true, data: topSharks });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};