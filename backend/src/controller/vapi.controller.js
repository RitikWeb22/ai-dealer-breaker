import negotiationModel from "../models/negotiation.model.js";
import productModel from "../models/product.model.js";
// 1. Prepare data before the call starts
export const getAssistantConfig = async (req, res) => {
    try {
        const { selectedItems, user } = req.body;
        console.log("Payload Received:", req.body);

        // Safety: Filter out undefined/null and ensure it's an array of strings
        const validItemNames = Array.isArray(selectedItems)
            ? selectedItems.filter(item => typeof item === 'string' && item !== 'undefined')
            : [];

        if (validItemNames.length === 0) {
            return res.status(400).json({ error: "Basket is empty or invalid" });
        }

        // DB Query to get actual prices
        const productsFromDB = await productModel.find({ name: { $in: validItemNames } });

        // Calculations
        const totalMsrp = productsFromDB.reduce((sum, p) => sum + (p.msrp || 0), 0);
        const totalFloor = productsFromDB.reduce((sum, p) => sum + (p.floor_price || 0), 0);

        const itemsString = validItemNames.join(", ");
        const userName = user?.name || "Guest";

        return res.status(200).json({
            message: "Config generated",
            variableValues: {
                username: userName,
                items_in_basket: itemsString,
                total_msrp: totalMsrp,
                floor_limit: totalFloor, // Victor isse niche nahi jayega
                userId: user?.id || "anonymous"
            }
        });

    } catch (error) {
        console.error("VAPI CONFIG ERROR:", error);
        return res.status(500).json({ error: "Victor's brain is fried", details: error.message });
    }
};

// 2. Handle the "confirmDeal" tool call from Vapi
export const handleVapiWebhook = async (req, res) => {
    try {
        const { message } = req.body;

        // Vapi sends 'tool-calls' or 'tool-call-result' based on their latest API
        if (message?.type === 'tool-calls' || message?.toolCalls) {
            const toolCall = message.toolCalls[0];

            if (toolCall.function.name === 'confirmDeal') {
                const { finalPrice, items } = toolCall.function.arguments;

                // Extracting variables we sent in getAssistantConfig
                const vars = message.call?.assistantOverrides?.variableValues || {};
                const { userId, username, total_msrp, floor_limit } = vars;

                // Efficiency Score: How much of the "negotiable gap" did the user win?
                const possibleSavings = total_msrp - floor_limit;
                const actualSavings = total_msrp - finalPrice;
                const efficiency = possibleSavings > 0
                    ? (actualSavings / possibleSavings) * 100
                    : 100;

                const newDeal = await negotiationModel.create({
                    userId: userId || "guest",
                    username: username || "Unknown Shark",
                    items: typeof items === 'string' ? items.split(',') : items,
                    totalMsrp: total_msrp || 0,
                    finalPrice: Number(finalPrice),
                    floorPrice: floor_limit,
                    efficiencyScore: efficiency.toFixed(2)
                });

                return res.status(200).json({
                    results: [{
                        toolCallId: toolCall.id,
                        result: `Deal confirmed at ₹${finalPrice}. Savings recorded!`
                    }]
                });
            }
        }

        // Vapi requires a 200 OK for every webhook sent
        return res.status(200).json({ status: "received" });

    } catch (error) {
        console.error("WEBHOOK ERROR:", error);
        return res.status(500).json({ error: "Webhook processing failed" });
    }
};