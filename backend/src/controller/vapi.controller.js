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

        // ✅ LOGGING FOR DEBUGGING
        console.log(`📦 Config for ${user?.name || "Guest"}: MSRP ${totalMsrp}, Floor ${totalFloor}`);

        return res.status(200).json({
            variableValues: {
                username: user?.name || "Guest",
                userId: user?.id || user?._id || "anonymous",
                items_in_basket: selectedItems.join(", "),
                total_msrp: numberToHindiWords(totalMsrp),
                floor_limit: numberToHindiWords(totalFloor),
                raw_msrp: totalMsrp,
                raw_floor: totalFloor
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

                    // ✅ SOURCE FALLBACK LOGIC (For User & Prices)
                    const msrp = Number(vars.raw_msrp) || Number(vars.raw_msrp_val) || 0;
                    const floor = Number(vars.raw_floor) || Number(vars.raw_floor_val) || 0;
                    const finalPriceNum = Number(finalPrice);

                    const dbUsername = vars.username || vars.user?.name || "Guest";
                    const rawUserId = vars.userId || vars.user?.id || "anonymous";

                    // ✅ Efficiency Calculation
                    let efficiency = 0;
                    const possibleSavings = msrp - floor;
                    const actualSavings = msrp - finalPriceNum;

                    if (possibleSavings > 0) {
                        efficiency = (actualSavings / possibleSavings) * 100;
                    } else if (msrp > 0) {
                        // Fallback if floor is somehow 0
                        efficiency = ((msrp - finalPriceNum) / (msrp * 0.25)) * 100;
                    }
                    const finalEfficiency = Math.min(Math.max(efficiency, 0), 100);

                    // ✅ ObjectId Validation
                    const isValidId = mongoose.Types.ObjectId.isValid(rawUserId);
                    const dbUserId = isValidId ? rawUserId : new mongoose.Types.ObjectId("65f1a2b3c4d5e6f7a8b9c0d1");

                    try {
                        const savedData = await negotiationModel.create({
                            userId: dbUserId,
                            username: dbUsername,
                            items: vars.items_in_basket ? vars.items_in_basket.split(", ") : ["Deal Product"],
                            totalMsrp: msrp,
                            finalPrice: finalPriceNum,
                            floorPrice: floor,
                            efficiencyScore: Number(finalEfficiency.toFixed(2))
                        });
                        console.log(`✅ [DB SUCCESS] Saved for ${dbUsername} | Efficiency: ${finalEfficiency}%`);
                    } catch (dbErr) {
                        console.error("❌ [DB SAVE FAILED]:", dbErr.message);
                    }

                    return {
                        toolCallId: toolCall.id,
                        result: "Deal recorded successfully."
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