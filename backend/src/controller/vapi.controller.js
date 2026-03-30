import negotiationModel from "../models/negotiation.model.js";
import productModel from "../models/product.model.js";
import numberToHindiWords from "../utils/Hindinumbers.js";

// ✅ Smart floor calculator - Robust fallback logic
const calculateFloorPrice = (totalMsrp, products) => {
    const dbFloorTotal = products.reduce((sum, p) => sum + (Number(p.floor_price) || 0), 0);
    // Agar DB mein floor price 0 hai, toh 75% MSRP default set karo
    if (dbFloorTotal > 0) return dbFloorTotal;
    return Math.round(totalMsrp * 0.75);
};

export const getAssistantConfig = async (req, res) => {
    try {
        const { selectedItems, user } = req.body;

        const productsFromDB = await productModel.find({
            name: { $in: selectedItems }
        });

        if (!productsFromDB.length) {
            return res.status(404).json({ error: "Koi bhi item nahi mila database mein" });
        }

        const totalMsrp = productsFromDB.reduce((sum, p) => sum + (p.msrp || 0), 0);
        const totalFloor = calculateFloorPrice(totalMsrp, productsFromDB);

        console.log("📦 Items Selected:", selectedItems);
        console.log("💰 Config Created -> MSRP:", totalMsrp, "| Floor:", totalFloor);

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
                    // ✅ SAFE ARGUMENTS PARSING
                    let args = toolCall.function.arguments;
                    if (typeof args === 'string') args = JSON.parse(args);

                    const { finalPrice } = args;

                    // Extract hidden variables from call context
                    const vars = message.call?.variables || {};
                    const msrp = Number(vars.raw_msrp) || 0;
                    const floor = Number(vars.raw_floor) || (msrp * 0.75);
                    const finalPriceNum = Number(finalPrice);

                    // ✅ BETTER EFFICIENCY LOGIC
                    let efficiency = 0;
                    if (msrp > floor) {
                        efficiency = ((msrp - finalPriceNum) / (msrp - floor)) * 100;
                    }
                    // Clamp between 0-100
                    const finalEfficiency = Math.min(Math.max(efficiency, 0), 100);

                    // ✅ SAVE TO MONGO (Ensuring 'item' matches your schema)
                    const savedData = await negotiationModel.create({
                        userId: vars.userId || "anonymous",
                        username: vars.username || "Guest",
                        item: vars.items_in_basket || "Product Pack",
                        totalMsrp: msrp,
                        finalPrice: finalPriceNum,
                        floorPrice: floor,
                        efficiencyScore: Number(finalEfficiency.toFixed(2)) // Convert back to Number for sorting
                    });

                    console.log(`🚀 [DB SAVE] ID: ${savedData._id} | Price: ₹${finalPriceNum} | User: ${vars.username}`);

                    return {
                        toolCallId: toolCall.id,
                        result: "Deal recorded successfully. Thank you!"
                    };
                }
                return { toolCallId: toolCall.id, result: "Tool ignored." };
            }));

            // ✅ CRITICAL: Return 201 with exactly this structure
            return res.status(201).json({ results });
        }

        return res.status(200).json({ status: "received" });

    } catch (error) {
        console.error("❌ Webhook processing failed:", error);
        return res.status(200).json({ error: "Fail-safe response triggered" });
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