import negotiationModel from '../models/negotiation.model.js'
import Product from '../models/product.model.js';
import axios from 'axios';


export const createNegotiation = async (req, res) => {
    const { message } = req.body;

    // check if ai call the conform message
    if (message?.type === 'tool-call') {
        const toolCall = message?.toolCall[0];
        if (toolCall.function.name === "confirmDeal") {
            const { finalPrice, items } = toolCall.function.arguments;
            const { userId, username, totalMsrp, floorPrice } = message.call.assistantOverrides.variableValues;
            const efficiency = ((totalMsrp - finalPrice) / (totalMsrp - floorPrice)) * 100;

            // save the negotiation result to database
            const negotiation = await negotiationModel.create({
                userId,
                username,
                item: items.split(','),
                totalMsrp,
                finalPrice,
                floorPrice,
                efficiencyScore: efficiency.toFixed(2)
            })

            // response
            return res.status(201).json({
                results: [{
                    toolCallId: toolCall.id,
                    result: `Deal confirmed at ₹${finalPrice}. You are now on the leaderboard!`
                }]
            });
        }
    }

    res.status(200).json({ message: 'Message received' });

}


export const getLeaderboard = async (req, res) => {
    try {
        // fetch top 10 negotiations sorted by efficiency score
        const topSharks = await Negotiation.find()
            .sort({ efficiencyScore: -1 })
            .limit(10)
            .select('username items efficiencyScore finalPrice createdAt');

        res.status(200).json({
            success: true,
            count: topSharks.length,
            data: topSharks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch leaderboard",
            error: error.message
        });
    }
}


export const startVapiSession = async (req, res) => {
    try {
        const { selectedItems, user } = req.body;

        // 1. Fetch products
        const products = await Product.find({ name: { $in: selectedItems } });
        if (products.length === 0) {
            return res.status(404).json({ error: "No products found" });
        }

        const totalMsrp = products.reduce((sum, p) => sum + p.msrp, 0);
        const totalFloor = products.reduce((sum, p) => sum + p.floor_price, 0);

        // 2. Check history for dynamic greeting (Optional but cool)
        const previousWins = await negotiationModel.countDocuments({ userId: user.id });

        // 3. Prepare final config
        const vapiConfig = {
            firstMessage: previousWins > 0
                ? `Welcome back ${user.name}. Ready to lose more money?`
                : `Hello ${user.name}. Don't touch anything. What do you want?`,
            variableValues: {
                username: user.name,
                items_in_basket: selectedItems.join(", "),
                total_msrp: totalMsrp,
                floor_limit: totalFloor,
                userId: user.id
            }
        };

        return res.status(200).json(vapiConfig); // 👈 Ek hi baar response bhejein
    } catch (error) {
        console.error("Session Error:", error);
        return res.status(500).json({ error: "Session failed", details: error.message });
    }
};
export const updateVictorPersonality = async (req, res) => {
    try {
        const { userId } = req.body;

        // 1. Check user's history (Leaderboard logic)
        const previousWins = await Negotiation.countDocuments({ userId });

        // 2. Personality Logic
        let mood = "friendly";
        let instruction = "Be a helpful shopkeeper.";

        if (previousWins > 2) {
            mood = "aggressive";
            instruction = "Be a tough negotiator who doesn't give easy discounts. and challenge the user to get better deals. and sometimes throw in playful insults to make it fun.";
        }

        // 3. ACTUAL BACKEND API CALL TO VAPI
        const response = await axios.patch(
            `https://api.vapi.ai/assistant/${process.env.VAPI_ASSISTANT_ID}`,
            {
                model: {
                    messages: [
                        {
                            role: "system",
                            content: `You are Alex. Your mood is ${mood}. ${instruction}`
                        }
                    ]
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.VAPI_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.status(200).json({ success: true, currentMood: mood });

    } catch (error) {
        console.error("Vapi Update Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to update Victor" });
    }
}
