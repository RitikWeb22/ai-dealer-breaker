import negotiationModel from "../models/negotiation.model.js";
import productModel from "../models/product.model.js";
import numberToHindiWords from "../utils/Hindinumbers.js";
import mongoose from "mongoose";

// ✅ Smart floor calculator (Internal logic for safety)
const calculateFloorPrice = (totalMsrp, products) => {
    const dbFloorTotal = products.reduce((sum, p) => sum + (Number(p.floor_price) || 0), 0);
    if (dbFloorTotal > 0) return dbFloorTotal;
    return Math.round(totalMsrp * 0.75);
};

export const getAssistantConfig = async (req, res) => {
    try {
        // Frontend se 'raw_msrp' aur 'raw_floor' direct aa rahe hain 
        const { selectedItems, username, userId, raw_msrp, raw_floor } = req.body;

        console.log(`📦 Creating Config for: ${username} | MSRP: ${raw_msrp} | UserID: ${userId}`);

        // Vapi expects this specific structure to persist variables across the call
        return res.status(200).json({
            variableValues: {
                // Ye AI use karega verbal negotiation ke liye
                username: username || "Shark",
                userId: userId || "anonymous",
                items_in_basket: Array.isArray(selectedItems) ? selectedItems.join(", ") : selectedItems,
                total_msrp: numberToHindiWords(raw_msrp),
                floor_limit: numberToHindiWords(raw_floor),

                // 🚨 CRITICAL: Inhe hum Webhook mein database save ke liye extract karenge
                raw_msrp: Number(raw_msrp),
                raw_floor: Number(raw_floor),
                // Selected items as array for the DB
                db_items: selectedItems
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

        // 1. Webhook check for tool calls (Alex calling confirmDeal)
        if (message?.type === 'tool-calls') {
            const toolCalls = message.toolCalls || [];

            const results = await Promise.all(toolCalls.map(async (toolCall) => {
                if (toolCall.function?.name === 'confirmDeal') {
                    let args = toolCall.function.arguments;
                    if (typeof args === 'string') args = JSON.parse(args);

                    // Vapi variables extract kar rahe hain jo humne Config mein set kiye the
                    const vars = message.call?.variables || {};

                    const msrp = Number(vars.raw_msrp) || 0;
                    const floor = Number(vars.raw_floor) || (msrp * 0.75);
                    const finalPriceNum = Number(args.finalPrice || args.price) || 0;

                    const dbUsername = vars.username || "Guest Shark";
                    const dbUserId = vars.userId;

                    // ✅ Efficiency logic: How well did the user bargain?
                    let efficiency = 0;
                    if (msrp > floor) {
                        // Formula: ((MSRP - Paid) / (MSRP - Floor)) * 100
                        efficiency = ((msrp - finalPriceNum) / (msrp - floor)) * 100;
                    }
                    const finalEfficiency = Math.min(Math.max(efficiency, 0), 100);

                    // ✅ Database Save Logic (Synced with your Compass Schema)
                    const negotiationData = {
                        userId: mongoose.Types.ObjectId.isValid(dbUserId) ? dbUserId : null,
                        username: dbUsername,
                        items: vars.items_in_basket ? vars.items_in_basket.split(", ") : ["Negotiated Product"],
                        totalMsrp: msrp,
                        finalPrice: finalPriceNum,
                        floorPrice: floor,
                        efficiencyScore: Number(finalEfficiency.toFixed(2)),
                        status: "completed"
                    };

                    negotiationModel.create(negotiationData)
                        .then(() => console.log(`✅ [DB SAVE] Success for Shark: ${dbUsername}`))
                        .catch(err => console.error("❌ [DB SAVE ERROR]:", err.message));

                    // ✅ Tool Result for Alex (AI) to read
                    return {
                        toolCallId: toolCall.id,
                        result: `Deal confirmed at ₹${finalPriceNum}. Efficiency: ${finalEfficiency.toFixed(1)}%. Recording successful.`
                    };
                }
                return { toolCallId: toolCall.id, result: "Tool processed." };
            }));

            // ✅ Vapi Tool Response Requirement: Status 201
            return res.status(201).json({ results });
        }

        // 2. Prevent Timeout: Success response for speech-update, transcript, etc.
        return res.status(200).json({ status: "received" });

    } catch (error) {
        console.error("❌ Webhook Fatal Error:", error);
        return res.status(200).json({ error: "Fail-safe triggered" });
    }
};

export const getLeaderboard = async (req, res) => {
    try {
        // High efficiency score matlab user ne MSRP se kaafi niche deal finalize ki
        const topSharks = await negotiationModel.find()
            .sort({ efficiencyScore: -1, createdAt: -1 })
            .limit(10);

        res.status(200).json({ success: true, data: topSharks });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};