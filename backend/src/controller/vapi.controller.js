import negotiationModel from "../models/negotiation.model.js";
import productModel from "../models/product.model.js";

// ✅ Proper Hindi number formatter — handles hazaar, lakh, crore
const formatToHindiWords = (num) => {
    if (num === 0) return "zero";

    if (num >= 10000000) {
        // 1 crore+
        const crore = num / 10000000;
        const rounded = Math.round(crore * 100) / 100;
        return `${rounded} crore rupaye`;
    }

    if (num >= 100000) {
        // 1 lakh - 99 lakh
        const lakh = num / 100000;
        const rounded = Math.round(lakh * 100) / 100;
        return `${rounded} lakh rupaye`;
    }

    if (num >= 1000) {
        // 1 hazaar - 99 hazaar
        const hazaar = num / 1000;
        const rounded = Math.round(hazaar * 100) / 100;
        return `${rounded} hazaar rupaye`;
    }

    return `${num} rupaye`;
};

// ✅ Smart floor calculator — based on total MSRP, ensures no loss
const calculateFloorPrice = (totalMsrp, products) => {
    // Option 1: Agar har product ka floor_price DB mein hai → use that
    const dbFloorTotal = products.reduce((sum, p) => sum + (p.floor_price || 0), 0);

    if (dbFloorTotal > 0) {
        return dbFloorTotal;
    }

    // Option 2: Fallback — 75% of MSRP as floor (adjust % as needed)
    return Math.round(totalMsrp * 0.75);
};

export const getAssistantConfig = async (req, res) => {
    try {
        const { selectedItems, user } = req.body;

        // ✅ Multiple items supported
        const productsFromDB = await productModel.find({
            name: { $in: selectedItems }
        });

        if (!productsFromDB.length) {
            return res.status(404).json({ error: "Koi bhi item nahi mila database mein" });
        }

        // ✅ Total MSRP — all selected items ka sum
        const totalMsrp = productsFromDB.reduce((sum, p) => sum + (p.msrp || 0), 0);

        // ✅ Smart floor — DB floor ya 75% fallback
        const totalFloor = calculateFloorPrice(totalMsrp, productsFromDB);

        console.log("📦 Items:", selectedItems);
        console.log("💰 Total MSRP:", totalMsrp, "→", formatToHindiWords(totalMsrp));
        console.log("🔒 Floor Price:", totalFloor, "→", formatToHindiWords(totalFloor));

        return res.status(200).json({
            variableValues: {
                username: user?.name || "Guest",
                items_in_basket: selectedItems.join(", "),

                // ✅ AI ko milega "terah hazaar rupaye" / "ek lakh rupaye" etc.
                total_msrp: formatToHindiWords(totalMsrp),
                floor_limit: formatToHindiWords(totalFloor),

                // Raw numbers — webhook calculations ke liye
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

                // ✅ raw_msrp aur raw_floor use karo calculation ke liye
                const msrp = vars.raw_msrp || vars.total_msrp;
                const floor = vars.raw_floor || vars.floor_limit;

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
                    results: [{
                        toolCallId: toolCall.id,
                        result: "Deal Recorded!"
                    }]
                });
            }
        }

        return res.status(200).json({ status: "received" });

    } catch (error) {
        console.error("Webhook error:", error);
        res.status(500).json({ error: "Webhook Failed" });
    }
};