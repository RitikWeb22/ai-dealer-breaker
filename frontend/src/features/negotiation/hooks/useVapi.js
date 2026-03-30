import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Vapi from "@vapi-ai/web";
import { getNegotiationSession } from '../services/negotiation.api';
import { useNegotiationContext } from '../negotiation.context';

const vapi = new Vapi(import.meta.env.VITE_VAPI_PUBLIC_KEY);

export const useNegotiation = () => {
    const { isCallActive, setIsCallActive } = useNegotiationContext();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const hasProcessedDeal = useRef(false);

    useEffect(() => {
        const onCallStart = () => {
            console.log("📞 Negotiation Started");
            setIsCallActive(true);
            hasProcessedDeal.current = false;
        };

        const onCallEnd = () => {
            console.log("⏹️ Negotiation Ended");
            setIsCallActive(false);
            // Agar deal confirm hui thi, toh call khatam hote hi leaderboard bhejo
            if (hasProcessedDeal.current) {
                navigate("/leaderboard");
            }
        };

        const onMessage = (message) => {
            // Frontend side check for tool calls
            if (message.type === 'tool-calls') {
                const dealTool = message.toolCalls?.find(tc => tc.function?.name === "confirmDeal");
                if (dealTool && !hasProcessedDeal.current) {
                    hasProcessedDeal.current = true;
                    console.log("🎯 Deal locked! Redirecting soon...");

                    // AI ko baat khatam karne ka mauka do
                    setTimeout(() => {
                        vapi.stop();
                    }, 5000);
                }
            }
        };

        vapi.on("call-start", onCallStart);
        vapi.on("call-end", onCallEnd);
        vapi.on("message", onMessage);
        vapi.on("error", (e) => {
            console.error("Vapi Error:", e);
            setIsCallActive(false);
        });

        return () => vapi.removeAllListeners();
    }, [setIsCallActive, navigate]);

    const startVictorCall = useCallback(async (basketItems, user) => {
        if (loading || isCallActive) return;
        setLoading(true);

        try {
            const config = await getNegotiationSession(basketItems, user);

            // 🛠️ IMPORTANT: Ye values Assistant ki memory mein save ho jayengi
            const assistantOverrides = {
                variableValues: {
                    username: String(config.variableValues?.username || user?.username || "Rohit"),
                    userId: String(config.variableValues?.userId || user?._id || "anonymous"),
                    items_in_basket: String(config.variableValues?.items_in_basket),
                    raw_msrp: Number(config.variableValues?.raw_msrp),
                    raw_floor: Number(config.variableValues?.raw_floor),
                    total_msrp: String(config.variableValues?.total_msrp),
                    floor_limit: String(config.variableValues?.floor_limit)
                }
            };

            await vapi.start(import.meta.env.VITE_VAPI_ASSISTANT_ID, assistantOverrides);

        } catch (error) {
            console.error("❌ Failed to start:", error);
            setIsCallActive(false);
        } finally {
            setLoading(false);
        }
    }, [isCallActive, loading, setIsCallActive]);

    return { startVictorCall, loading, isConnected: isCallActive, stopCall: () => vapi.stop() };
};