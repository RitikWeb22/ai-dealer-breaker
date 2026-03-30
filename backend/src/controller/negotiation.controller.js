import negotiationModel from '../models/negotiation.model.js';
import mongoose from 'mongoose';
import productModel from '../models/product.model.js';


export const createNegotiation = async (req, res) => {
    try {
        const { message } = req.body;

        // Log check karne ke liye ki webhook hit hua ya nahi
        console.log("📩 Webhook Received. Type:", message?.type);

        if (message?.type === 'tool-calls') {
            const toolCalls = message.toolCalls || [];
            console.log("🛠️ Tool Calls detected:", toolCalls.length);

            const results = await Promise.all(toolCalls.map(async (toolCall) => {
                if (toolCall.function?.name === "confirmDeal") {

                    // 1. Arguments Parsing
                    let args = toolCall.function.arguments;
                    if (typeof args === 'string') args = JSON.parse(args);
                    const { finalPrice, items: itemsFromAlex } = args;

                    // 2. Variables Extraction
                    const vars = message.call?.variables || {};
                    const totalMsrp = Number(vars.raw_msrp || vars.raw_msrp_val) || 0;
                    const floorLimit = Number(vars.raw_floor || vars.raw_floor_val) || 0;
                    const finalPriceNum = Number(finalPrice);

                    console.log(`📊 Processing Deal: MSRP ${totalMsrp}, Final ${finalPriceNum}`);

                    // 3. Efficiency Calculation
                    const possibleSavings = totalMsrp - floorLimit;
                    const actualSavings = totalMsrp - finalPriceNum;
                    let efficiency = possibleSavings <= 0 ? 100 : (actualSavings / possibleSavings) * 100;
                    const finalEfficiency = Number(Math.min(Math.max(efficiency, 0), 100).toFixed(2));

                    // 4. CRITICAL FIX: UserID Validation
                    // Agar userId frontend se sahi nahi aa rahi, toh ye line usey fix karegi
                    let validUserId;
                    if (vars.userId && mongoose.Types.ObjectId.isValid(vars.userId)) {
                        validUserId = vars.userId;
                    } else if (vars.user?.id && mongoose.Types.ObjectId.isValid(vars.user.id)) {
                        validUserId = vars.user.id;
                    } else {
                        // Agar koi ID nahi mili, toh temporary ID banao (Riksy but saves data)
                        validUserId = new mongoose.Types.ObjectId();
                        console.warn("⚠️ Valid UserId missing, using temporary ID");
                    }

                    // 5. Database Save
                    try {
                        const negotiation = await negotiationModel.create({
                            userId: validUserId,
                            username: vars.username || vars.user?.name || "Guest Shark",
                            items: Array.isArray(itemsFromAlex) ? itemsFromAlex : [vars.items_in_basket || "Product Pack"],
                            totalMsrp,
                            finalPrice: finalPriceNum,
                            floorPrice: floorLimit,
                            efficiencyScore: finalEfficiency
                        });

                        console.log("✅ [DATABASE SAVE SUCCESS]:", negotiation._id);

                        return {
                            toolCallId: toolCall.id,
                            result: "Shark! Deal recorded. Check leaderboard."
                        };
                    } catch (dbErr) {
                        console.error("❌ [MONGODB SAVE ERROR]:", dbErr.message);
                        throw dbErr;
                    }
                }
                return { toolCallId: toolCall.id, result: "Not a deal tool." };
            }));

            return res.status(201).json({ results });
        }

        return res.status(200).json({ status: 'received' });

    } catch (err) {
        console.error("❌ [WEBHOOK CRITICAL FAIL]:", err);
        return res.status(201).json({
            results: [{ toolCallId: req.body.message?.toolCalls?.[0]?.id, result: "Error" }]
        });
    }
};
// 🛠️ Start Session: Frontend logic to fetch prices and set Vapi variables
export const startVapiSession = async (req, res) => {
    try {
        const { selectedItems, user } = req.body;

        if (!selectedItems || selectedItems.length === 0) {
            return res.status(400).json({ success: false, message: "Basket is empty" });
        }

        // Database se latest prices uthao
        const products = await productModel.find({ name: { $in: selectedItems } });

        const totalMsrp = products.reduce((sum, p) => sum + (Number(p.msrp) || 0), 0);
        // Floor price fallback agar DB mein 0 ho
        const totalFloor = products.reduce((sum, p) => {
            const price = Number(p.floor_price);
            return sum + (price > 0 ? price : (p.msrp * 0.75));
        }, 0);

        console.log(`📦 Session Start: ${user?.name} | MSRP: ${totalMsrp} | Floor: ${totalFloor}`);

        return res.status(200).json({
            variableValues: {
                username: user?.name || "Customer",
                items_in_basket: selectedItems.join(", "),
                total_msrp: totalMsrp,
                floor_limit: totalFloor,
                raw_msrp: totalMsrp,
                raw_floor: totalFloor,
                userId: user?.id || "anonymous"
            }
        });

    } catch (error) {
        console.error("❌ startVapiSession Error:", error);
        res.status(500).json({ error: error.message });
    }
};