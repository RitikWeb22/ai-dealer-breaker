import Product from '../models/product.model.js';
import Negotiation from '../models/negotiation.model.js';

// 1. Prepare data before the call starts
export const getAssistantConfig = async (req, res) => {
    const { itemNames, userId, username } = req.body;

    const products = await Product.find({ name: { $in: itemNames } });
    const totalMsrp = products.reduce((sum, p) => sum + p.msrp, 0);
    const totalFloor = products.reduce((sum, p) => sum + p.floor_price, 0);

    res.json({
        assistantOverrides: {
            variableValues: {
                username: username,
                items_in_basket: itemNames.join(", "),
                total_msrp: totalMsrp,
                floor_limit: totalFloor,
                userId: userId
            }
        }
    });
};

// 2. Handle the "confirmDeal" tool call from Vapi
export const handleVapiWebhook = async (req, res) => {
    const { message } = req.body;

    if (message?.type === 'tool-calls') {
        const call = message.toolCalls[0];

        if (call.function.name === 'confirmDeal') {
            const { finalPrice, items } = call.function.arguments;
            const { userId, username, total_msrp } = message.call.assistantOverrides.variableValues;

            const savings = ((total_msrp - finalPrice) / total_msrp) * 100;

            const newDeal = await Negotiation.create({
                userId,
                username,
                items: items.split(','),
                totalMsrp: total_msrp,
                finalPrice,
                savingsPercentage: savings.toFixed(2)
            });

            return res.status(200).json({
                results: [{
                    toolCallId: call.id,
                    result: `Deal confirmed! ${username} saved ${savings.toFixed(1)}%.`
                }]
            });
        }
    }
    res.sendStatus(200);
};