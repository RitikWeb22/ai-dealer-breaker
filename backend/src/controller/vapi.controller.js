import negotiationModel from "../models/negotiation.model.js";
import productModel from "../models/product.model.js";
import numberToHindiWords from "../utils/Hindinumbers.js";

// ✅ Smart floor calculator
const calculateFloorPrice = (totalMsrp, products) => {
    const dbFloorTotal = products.reduce((sum, p) => sum + (p.floor_price || 0), 0);
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

        console.log("📦 Items:", selectedItems);
        console.log("💰 Total MSRP:", totalMsrp, "→", numberToHindiWords(totalMsrp));
        console.log("🔒 Floor Price:", totalFloor, "→", numberToHindiWords(totalFloor));

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
        console.error("getAssistantConfig error:", error);
        res.status(500).json({ error: error.message });
    }
};

export const handleVapiWebhook = async (req, res) => {
    try {
        const { message } = req.body;

        // 1. Check for tool-calls plural
        if (message?.type === 'tool-calls') {
            const results = await Promise.all(message.toolCalls.map(async (toolCall) => {
                if (toolCall.function.name === 'confirmDeal') {
                    // Extract arguments from Alex
                    const { finalPrice, items } = toolCall.function.arguments;

                    // Extract hidden variables from call context
                    const vars = message.call?.variables || {};
                    const msrp = Number(vars.raw_msrp) || 0;
                    const floor = Number(vars.raw_floor) || 0;
                    const finalPriceNum = Number(finalPrice);

                    // 2. Efficiency Score Logic
                    let efficiency = 0;
                    if (msrp > floor) {
                        efficiency = ((msrp - finalPriceNum) / (msrp - floor)) * 100;
                    }

                    // 3. Save to MongoDB (Field name alignment)
                    await negotiationModel.create({
                        userId: vars.userId || "anonymous",
                        username: vars.username || "Guest",
                        // Ensure items is an array
                        item: Array.isArray(items) ? items : (typeof items === 'string' ? items.split(',') : [vars.items_in_basket]),
                        totalMsrp: msrp,
                        finalPrice: finalPriceNum,
                        floorPrice: floor,
                        efficiencyScore: Math.min(Math.max(efficiency, 0), 100).toFixed(2)
                    });

                    console.log(`✅ Deal Saved: ₹${finalPriceNum} for ${vars.username}`);

                    // 4. CRITICAL: Exact format for Vapi to acknowledge and DISCONNECT
                    return {
                        toolCallId: toolCall.id,
                        result: "Deal successfully recorded on leaderboard."
                    };
                }
                return { toolCallId: toolCall.id, result: "Tool not recognized" };
            }));

            // 5. Must return 201 with results array
            return res.status(201).json({ results });
        }

        return res.status(200).json({ status: "received" });

    } catch (error) {
        console.error("❌ Webhook Error:", error);
        // Fail-safe response to prevent Vapi from hanging
        return res.status(200).json({ error: "Internal processing error" });
    }
};

// 🏆 Leaderboard Fetch (Minor Fix for field names)
export const getLeaderboard = async (req, res) => {
    try {
        const topSharks = await negotiationModel.find()
            .sort({ efficiencyScore: -1, createdAt: -1 })
            .limit(10)
            .select('username item efficiencyScore finalPrice createdAt'); // 'item' match with schema

        res.status(200).json({ success: true, data: topSharks });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};