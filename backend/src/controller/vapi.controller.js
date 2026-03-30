import negotiationModel from "../models/negotiation.model.js";
import numberToHindiWords from "../utils/Hindinumbers.js";
import mongoose from "mongoose";

export const getAssistantConfig = async (req, res) => {
    try {
        const { selectedItems, username, userId, raw_msrp, raw_floor } = req.body;

        console.log(`📦 Creating Config for: ${username} | MSRP: ${raw_msrp} | UserID: ${userId}`);

        // Vapi expects this specific structure
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

export const handleVapiWebhook = async (req, res) => {
    try {
        const { message } = req.body;

        // Log to see what Vapi is sending (Debug point)
        // console.log("📩 Webhook Received:", message.type);

        if (message?.type === 'tool-calls') {
            const toolCalls = message.toolCalls || [];


            const results = await Promise.all(toolCalls.map(async (toolCall) => {
                if (toolCall.function?.name === 'confirmDeal') {
                    let args = toolCall.function.arguments;
                    if (typeof args === 'string') args = JSON.parse(args);

                    // 🛠️ SABSE IMPORTANT: Variables ko yahan se uthao
                    const vars = message.call?.variables || message.variables || {};

                    // Priority: Tool Arguments se lo, fallback variables par rakho
                    const finalPriceNum = Number(args.finalPrice || args.price) || 0;
                    const msrp = Number(vars.raw_msrp) || 0;
                    const floor = Number(vars.raw_floor) || (msrp * 0.75);

                    // UserID check: agar tool args mein hai toh wo lo, warna variables wala
                    const rawUserId = args.userId || vars.userId;
                    const dbUserId = mongoose.Types.ObjectId.isValid(rawUserId) ? rawUserId : new mongoose.Types.ObjectId();

                    const dbUsername = vars.username || "Guest Shark";

                    // Efficiency Score Calculation
                    let efficiency = 0;
                    const maxPossibleSavings = msrp - floor;
                    const actualSavings = msrp - finalPriceNum;
                    if (maxPossibleSavings > 0) {
                        efficiency = (actualSavings / maxPossibleSavings) * 100;
                    }
                    const finalEfficiency = Math.min(Math.max(efficiency, 0), 100);

                    const negotiationData = {
                        userId: dbUserId,
                        username: dbUsername,
                        items: vars.items_in_basket ? vars.items_in_basket.split(", ") : ["Product"],
                        totalMsrp: msrp,
                        finalPrice: finalPriceNum,
                        floorPrice: floor,
                        efficiencyScore: Number(finalEfficiency.toFixed(2)),
                        status: "completed",
                        callId: message.call?.id || toolCall.id
                    };

                    await negotiationModel.findOneAndUpdate(
                        { callId: negotiationData.callId },
                        negotiationData,
                        { upsert: true, new: true }
                    );

                    console.log(`✅ Success: ${dbUsername} saved with ${finalEfficiency}% efficiency`);

                    return {
                        toolCallId: toolCall.id,
                        result: "Deal recorded on leaderboard."
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