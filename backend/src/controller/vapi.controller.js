import negotiationModel from "../models/negotiation.model.js";
import productModel from "../models/product.model.js";

export const getAssistantConfig = async (req, res) => {
    try {
        const { selectedItems, user } = req.body;
        const productsFromDB = await productModel.find({ name: { $in: selectedItems } });

        const totalMsrp = productsFromDB.reduce((sum, p) => sum + (p.msrp || 0), 0);
        const totalFloor = productsFromDB.reduce((sum, p) => sum + (p.floor_price || 0), 0);

        // Helper function to convert number to "Hazaar" string
        const formatToHazaar = (num) => {
            if (num >= 1000) {
                const thousands = num / 1000;
                // Agar 13000 hai toh "13 hazaar", agar 13500 hai toh "13.5 hazaar"
                return `${thousands} hazaar`;
            }
            return num.toString();
        };

        return res.status(200).json({
            variableValues: {
                username: user?.name || "Guest",
                items_in_basket: selectedItems.join(", "),
                // Ab AI ko milega "13 hazaar" instead of 13000
                total_msrp: formatToHazaar(totalMsrp),
                floor_limit: formatToHazaar(totalFloor),
                // Original numbers for calculation (Calculation ke liye raw numbers bhi bhej sakte ho agar tool use kar rahe ho)
                raw_msrp: totalMsrp,
                raw_floor: totalFloor,
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