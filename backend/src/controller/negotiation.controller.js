import negotiationModel from '../models/negotiation.model.js'
import productModel from '../models/product.model.js';
import axios from 'axios';

export const createNegotiation = async (req, res) => {
    const { message } = req.body;

    if (message?.type === 'tool-call') {
        const toolCall = message?.toolCall[0];
        if (toolCall?.function?.name === "confirmDeal") {
            try {
                const { finalPrice, items } = toolCall.function.arguments;
                const { userId, username, totalMsrp, floor_limit } = message.call.assistantOverrides.variableValues;

                // Efficiency calculation with safety for division by zero
                const possibleSavings = totalMsrp - floor_limit;
                const actualSavings = totalMsrp - finalPrice;
                const efficiency = possibleSavings <= 0 ? 100 : (actualSavings / possibleSavings) * 100;

                const negotiation = await negotiationModel.create({
                    userId,
                    username,
                    item: typeof items === 'string' ? items.split(',') : [items],
                    totalMsrp,
                    finalPrice,
                    floorPrice: floor_limit,
                    efficiencyScore: efficiency.toFixed(2)
                });

                return res.status(201).json({
                    results: [{
                        toolCallId: toolCall.id,
                        result: `Deal confirmed at ₹${finalPrice}. Victor is impressed!`
                    }]
                });
            } catch (err) {
                console.error("DB Save Error:", err);
                return res.status(500).json({ error: "Failed to save deal" });
            }
        }
    }
    res.status(200).json({ message: 'Message received' });
}

export const getLeaderboard = async (req, res) => {
    try {
        const topSharks = await negotiationModel.find() // 👈 Fixed name
            .sort({ efficiencyScore: -1 })
            .limit(10)
            .select('username items efficiencyScore finalPrice createdAt');

        res.status(200).json({ success: true, data: topSharks });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export const startVapiSession = async (req, res) => {
    try {
        const { selectedItems, user } = req.body;

        if (!selectedItems || selectedItems.length === 0) {
            return res.status(400).json({ success: false, message: "Basket is empty! Pick something first." });
        }


        const products = await productModel.find({ name: { $in: selectedItems } });

        if (products.length === 0) {
            return res.status(404).json({ success: false, message: "Selected products not found in DB." });
        }

        const totalMsrp = products.reduce((sum, p) => sum + p.msrp, 0);
        const totalFloor = products.reduce((sum, p) => sum + p.floor_price, 0);

        // 4. Check user history (Optional: Personality logic ke liye)
        const previousWins = await negotiationModel.countDocuments({ userId: user?.id });


        const vapiConfig = {
            firstMessage: previousWins > 0
                ? `Welcome back ${user.name}. I haven't forgotten how you robbed me last time. What do you want now?`
                : `Yeah, yeah... Hello ${user.name}. I see you've got your eyes on the ${selectedItems.join(" and ")}. I'm valuing this bundle at ₹${totalMsrp}. What's your offer?`,

            variableValues: {
                username: user.name,
                items_in_basket: selectedItems.join(", "),
                total_msrp: totalMsrp,
                floor_limit: totalFloor,
                userId: user.id
            }
        };

        return res.status(200).json(vapiConfig);

    } catch (error) {
        console.error("VAPI SESSION ERROR:", error);
        return res.status(500).json({
            success: false,
            error: "Victor's brain is fried",
            details: error.message
        });
    }
};

export const updateVictorPersonality = async (req, res) => {
    try {
        const { userId } = req.body;
        const previousWins = await negotiationModel.countDocuments({ userId }); // 👈 Fixed name

        let mood = "friendly";
        let instruction = "Be a tough but fair shopkeeper.";

        if (previousWins > 2) {
            mood = "aggressive";
            instruction = "You know this guy is a shark. Be extremely sarcastic and don't give in easily.";
        }

        await axios.patch(
            `https://api.vapi.ai/assistant/${process.env.VAPI_ASSISTANT_ID}`,
            { model: { messages: [{ role: "system", content: `You are Alex. ${instruction}` }] } },
            { headers: { 'Authorization': `Bearer ${process.env.VAPI_SECRET_KEY}` } }
        );

        res.status(200).json({ success: true, currentMood: mood });
    } catch (error) {
        res.status(500).json({ error: "Failed to update Victor" });
    }
}