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

        // Vapi sends 'tool-calls' when Alex triggers the function
        if (message?.type === 'tool-calls') {
            // Hum multiple tool calls handle kar sakte hain
            const results = await Promise.all(message.toolCalls.map(async (toolCall) => {
                if (toolCall.function.name === 'confirmDeal') {
                    const { finalPrice, items } = toolCall.function.arguments;

                    // Call variables se data nikalna
                    const vars = message.call?.variables || {};
                    const msrp = vars.raw_msrp || 0;
                    const floor = vars.raw_floor || 0;

                    // Efficiency Score: 100 means they got the floor price (Best Negotiator)
                    // 0 means they paid full MSRP.
                    let efficiency = 0;
                    if (msrp !== floor) {
                        efficiency = ((msrp - finalPrice) / (msrp - floor)) * 100;
                    }

                    // Save to MongoDB
                    await negotiationModel.create({
                        userId: vars.userId || "anonymous",
                        username: vars.username || "Guest",
                        items: items || vars.items_in_basket,
                        totalMsrp: msrp,
                        finalPrice: Number(finalPrice),
                        floorPrice: floor,
                        efficiencyScore: Math.min(Math.max(efficiency, 0), 100).toFixed(2) // Limit 0-100
                    });

                    console.log(`✅ Deal Saved for ${vars.username}: ₹${finalPrice}`);
                    return { toolCallId: toolCall.id, result: "Deal Recorded on Leaderboard!" };
                }
                return { toolCallId: toolCall.id, result: "Tool not recognized" };
            }));

            return res.status(201).json({ results });
        }

        return res.status(200).json({ status: "received" });

    } catch (error) {
        console.error("❌ Webhook error:", error);
        res.status(500).json({ error: "Webhook Failed" });
    }
};