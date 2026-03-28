import negotiationModel from "../models/negotiation.model.js";
import productModel from "../models/product.model.js";

export const getAssistantConfig = async (req, res) => {
    try {
        const { selectedItems, user } = req.body;
        const productsFromDB = await productModel.find({ name: { $in: selectedItems } });

        const totalMsrp = productsFromDB.reduce((sum, p) => sum + (p.msrp || 0), 0);
        const totalFloor = productsFromDB.reduce((sum, p) => sum + (p.floor_price || 0), 0);

        return res.status(200).json({
            variableValues: {
                username: user?.name || "Guest",
                items_in_basket: selectedItems.join(", "),
                total_msrp: totalMsrp,
                floor_limit: totalFloor,
                userId: user?.id || "anonymous"
            }
        });
    } catch (error) {
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
                const vars = message.call?.variables || {}; // SDK v2 logic

                const efficiency = ((vars.total_msrp - finalPrice) / (vars.total_msrp - vars.floor_limit)) * 100;

                await negotiationModel.create({
                    userId: vars.userId,
                    username: vars.username,
                    items: items,
                    totalMsrp: vars.total_msrp,
                    finalPrice: Number(finalPrice),
                    floorPrice: vars.floor_limit,
                    efficiencyScore: efficiency.toFixed(2)
                });

                return res.status(201).json({
                    results: [{ toolCallId: toolCall.id, result: "Deal Recorded!" }]
                });
            }
        }
        return res.status(200).json({ status: "received" });
    } catch (error) {
        res.status(500).json({ error: "Webhook Failed" });
    }
};