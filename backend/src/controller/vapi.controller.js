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
        const { selectedItems, user } = req.body;
        const productsFromDB = await productModel.find({ name: { $in: selectedItems } });

        if (!productsFromDB.length) {
            return res.status(404).json({ error: "Koi bhi item nahi mila database mein" });
        }

        const totalMsrp = productsFromDB.reduce((sum, p) => sum + (p.msrp || 0), 0);
        const totalFloor = calculateFloorPrice(totalMsrp, productsFromDB);

        return res.status(200).json({
            variableValues: {
                username: user?.name || "Guest",
                items_in_basket: selectedItems.join(", "),
                total_msrp: numberToHindiWords(totalMsrp),
                floor_limit: numberToHindiWords(totalFloor),
                raw_msrp: totalMsrp,
                raw_floor: totalFloor,
                userId: user?.id || "anonymous"
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

        if (message?.type === 'tool-calls') {
            const toolCalls = message.toolCalls || [];

            const results = await Promise.all(toolCalls.map(async (toolCall) => {
                if (toolCall.function?.name === 'confirmDeal') {
                    let args = toolCall.function.arguments;
                    if (typeof args === 'string') args = JSON.parse(args);

                    const { finalPrice } = args;
                    const vars = message.call?.variables || {};

                    const msrp = Number(vars.raw_msrp) || 0;
                    const floor = Number(vars.raw_floor) || (msrp * 0.75);
                    const finalPriceNum = Number(finalPrice);

                    // ✅ Efficiency Calculation
                    let efficiency = 0;
                    if (msrp > floor) {
                        efficiency = ((msrp - finalPriceNum) / (msrp - floor)) * 100;
                    }
                    const finalEfficiency = Math.min(Math.max(efficiency, 0), 100);

                    // 🚨 CRITICAL FIX: userId ObjectId Validation
                    // Agar vars.userId valid ObjectId nahi hai, toh ek placeholder ID use karo
                    const isValidId = mongoose.Types.ObjectId.isValid(vars.userId);
                    const dbUserId = isValidId ? vars.userId : new mongoose.Types.ObjectId("000000000000000000000000");

                    // ✅ SAVE TO MONGO (Field names synced with your schema)
                    try {
                        const savedData = await negotiationModel.create({
                            userId: dbUserId,
                            username: vars.username || "Guest",
                            items: vars.items_in_basket ? vars.items_in_basket.split(", ") : ["Unknown Product"],
                            totalMsrp: msrp,
                            finalPrice: finalPriceNum,
                            floorPrice: floor,
                            efficiencyScore: Number(finalEfficiency.toFixed(2))
                        });
                        console.log(`✅ [DB SUCCESS] Saved ID: ${savedData._id}`);
                    } catch (dbErr) {
                        console.error("❌ [DB SAVE FAILED]:", dbErr.message);
                    }

                    return {
                        toolCallId: toolCall.id,
                        result: "Deal recorded successfully. Thank you!"
                    };
                }
                return { toolCallId: toolCall.id, result: "Tool ignored." };
            }));

            return res.status(201).json({ results });
        }
        return res.status(200).json({ status: "received" });

    } catch (error) {
        console.error("❌ Webhook Error:", error);
        return res.status(200).json({ error: "Fail-safe response" });
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