import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Navigation import kiya
import Vapi from "@vapi-ai/web";
import { getNegotiationSession } from '../services/negotiation.api';
import { useNegotiationContext } from '../negotiation.context';

// Module-level singleton
const vapi = new Vapi(import.meta.env.VITE_VAPI_PUBLIC_KEY);

export const useNegotiation = () => {
    const { isCallActive, setIsCallActive } = useNegotiationContext();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate(); // 2. Navigate initialize kiya

    useEffect(() => {
        const onCallStart = () => setIsCallActive(true);
        const onCallEnd = () => setIsCallActive(false);
        const onError = (err) => {
            console.error("Vapi Error:", err);
            setIsCallActive(false);
        };

        // 🚀 THE FIX: Listening to Tool Calls for Auto-Disconnect & Redirect
        const onMessage = (message) => {
            // Check if Alex triggered the "confirmDeal" tool
            if (
                message.type === "tool-calls" &&
                message.toolCalls[0]?.function?.name === "confirmDeal"
            ) {
                console.log("🎯 Deal Logic Triggered: Redirecting in 4s...");

                // 4 seconds delay: Alex ko "Mubarak ho..." poora bolne ka mauka milega
                setTimeout(() => {
                    vapi.stop(); // Forcefully disconnect Vapi
                    setIsCallActive(false);
                    navigate("/leaderboard"); // Redirect to Leaderboard
                }, 4000);
            }
        };

        vapi.on("call-start", onCallStart);
        vapi.on("call-end", onCallEnd);
        vapi.on("error", onError);
        vapi.on("message", onMessage); // 3. Message listener active kiya

        return () => {
            vapi.off("call-start", onCallStart);
            vapi.off("call-end", onCallEnd);
            vapi.off("error", onError);
            vapi.off("message", onMessage);
        };
    }, [setIsCallActive, navigate]);

    const startVictorCall = useCallback(async (basketItems, user) => {
        if (loading || isCallActive) return;
        setLoading(true);
        try {
            const config = await getNegotiationSession(basketItems, user);

            const assistantOverrides = {
                // Phrases as backup, but the logic above is more reliable
                endCallPhrases: ["Have a great day!", "Shukriya!"],
                variableValues: {
                    username: String(user?.username || "Customer"),
                    items_in_basket: String(basketItems.map(i => i.name).join(", ")),
                    total_msrp: String(config.variableValues.total_msrp),
                    floor_limit: String(config.variableValues.floor_limit),
                    raw_msrp: Number(config.variableValues.raw_msrp_val),
                    raw_floor: Number(config.variableValues.raw_floor_val),
                    userId: String(user?._id)
                }
            };

            await vapi.start(import.meta.env.VITE_VAPI_ASSISTANT_ID, assistantOverrides);
        } catch (error) {
            console.error("Connection Error:", error);
            setIsCallActive(false);
        } finally {
            setLoading(false);
        }
    }, [isCallActive, loading]);

    return { startVictorCall, loading, isConnected: isCallActive, vapi };
};