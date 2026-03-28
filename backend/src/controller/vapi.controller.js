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

        if (message?.type === 'tool-calls') {
            const toolCall = message.toolCalls[0];

            if (toolCall.function.name === 'confirmDeal') {
                const { finalPrice, items } = toolCall.function.arguments;
                const vars = message.call?.variables || {};

                const msrp = vars.raw_msrp || 0;
                const floor = vars.raw_floor || 0;
                const efficiency = ((msrp - finalPrice) / (msrp - floor)) * 100;

                await negotiationModel.create({
                    userId: vars.userId,
                    username: vars.username,
                    items: items,
                    totalMsrp: msrp,
                    finalPrice: Number(finalPrice),
                    floorPrice: floor,
                    efficiencyScore: efficiency.toFixed(2)
                });

                return res.status(201).json({
                    results: [{ toolCallId: toolCall.id, result: "Deal Recorded!" }]
                });
            }
        }

        return res.status(200).json({ status: "received" });

    } catch (error) {
        console.error("Webhook error:", error);
        res.status(500).json({ error: "Webhook Failed" });
    }
};