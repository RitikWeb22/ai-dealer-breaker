import negotiationModel from "../models/negotiation.model.js";
import numberToHindiWords from "../utils/Hindinumbers.js";
import mongoose from "mongoose";

// 1. Generate Assistant Config (Frontend starts call with this)
export const getAssistantConfig = async (req, res) => {
    try {
        const { selectedItems, username, userId, raw_msrp, raw_floor } = req.body;

        console.log(`📦 Creating Config for: ${username} | MSRP: ${raw_msrp} | UserID: ${userId}`);

        return res.status(200).json({
            variableValues: {
                username: username || "Shark",
                userId: userId || "anonymous",
                items_in_basket: Array.isArray(selectedItems) ? selectedItems.join(", ") : selectedItems,
                total_msrp: numberToHindiWords(raw_msrp),
                floor_limit: numberToHindiWords(raw_floor),
                raw_msrp: Number(raw_msrp),
                raw_floor: Number(raw_floor)
            }
        });
    } catch (error) {
        console.error("❌ getAssistantConfig error:", error);
        res.status(500).json({ error: error.message });
    }
};

// 2. Webhook Handler (Saves to DB and ends call)
export const handleVapiWebhook = async (req, res) => {
    try {
        const { message } = req.body;

        if (message?.type === 'tool-calls') {
            const toolCalls = message.toolCalls || [];

            const results = await Promise.all(toolCalls.map(async (toolCall) => {
                if (toolCall.function?.name === 'confirmDeal') {
                    let args = toolCall.function.arguments;
                    if (typeof args === 'string') args = JSON.parse(args);

                    // ✅ FIXED: Vapi variables sahi path se nikaal rahe hain
                    // Primary: assistantOverrides.variableValues (jahan humne bheje the)
                    // Fallback chain bhi rakha hai safety ke liye
                    const vars =
                        message.call?.assistantOverrides?.variableValues ||
                        message.call?.variables ||
                        message.variables ||
                        {};

                    // 🔍 DEBUG LOG — confirm hone ke baad hata dena
                    console.log("🔍 [VARS DEBUG] Extracted vars:", JSON.stringify(vars, null, 2));
                    console.log("🔍 [CALL DEBUG] Full call keys:", Object.keys(message.call || {}));

                    const msrp = Number(vars.raw_msrp) || 0;
                    const floor = Number(vars.raw_floor) || (msrp * 0.75);
                    const finalPriceNum = Number(args.finalPrice || args.price) || 0;

                    // userId: valid ObjectId toh use karo, warna null
                    const rawUserId = vars.userId || args.userId;
                    const dbUserId = (rawUserId && mongoose.Types.ObjectId.isValid(rawUserId))
                        ? rawUserId
                        : null;

                    const dbUsername = vars.username || "Guest Shark";

                    // Efficiency Score
                    let efficiency = 0;
                    const maxSavings = msrp - floor;
                    const userSavings = msrp - finalPriceNum;
                    if (maxSavings > 0) {
                        efficiency = (userSavings / maxSavings) * 100;
                    }
                    const finalEfficiency = Math.min(Math.max(efficiency, 0), 100);

                    const negotiationData = {
                        userId: dbUserId,
                        username: dbUsername,
                        items: vars.items_in_basket
                            ? vars.items_in_basket.split(", ")
                            : ["Negotiated Items"],
                        totalMsrp: msrp,
                        finalPrice: finalPriceNum,
                        floorPrice: floor,
                        efficiencyScore: Number(finalEfficiency.toFixed(2)),
                        status: "completed",
                        callId: message.call?.id || toolCall.id
                    };

                    console.log("💾 [SAVING]:", JSON.stringify(negotiationData, null, 2));

                    try {
                        await negotiationModel.findOneAndUpdate(
                            { callId: negotiationData.callId },
                            negotiationData,
                            { upsert: true, new: true }
                        );
                        console.log(`✅ [DB SAVE SUCCESS]: ${dbUsername} | MSRP: ${msrp} | Final: ${finalPriceNum}`);
                    } catch (dbErr) {
                        console.error("❌ [DB SAVE ERROR]:", dbErr.message);
                    }

                    return {
                        toolCallId: toolCall.id,
                        result: `Deal successfully recorded for ${dbUsername}. Continue the conversation naturally and wrap up politely.`
                    };
                }
                return { toolCallId: toolCall.id, result: "Processed" };
            }));

            return res.status(201).json({ results });
        }

        return res.status(200).json({ status: "received" });

    } catch (error) {
        console.error("❌ Webhook Fatal Error:", error);
        return res.status(200).json({ error: "Fail-safe triggered" });
    }
};

// 3. Leaderboard Fetch
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