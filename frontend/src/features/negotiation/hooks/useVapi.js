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
                console.log("🏆 Navigating to Leaderboard...");
                navigate("/leaderboard");
            }
        };

        const onMessage = (message) => {
            // 🛠️ Tool Call Detection (Dono formats check kar rahe hain)
            const toolCalls = message.toolCalls || message.toolCallList;

            if (message.type === 'tool-calls' || toolCalls) {
                const dealTool = toolCalls?.find(tc =>
                    (tc.function?.name === "confirmDeal") || (tc.name === "confirmDeal")
                );

                if (dealTool && !hasProcessedDeal.current) {
                    hasProcessedDeal.current = true;
                    console.log("🎯 Deal locked! Backend is saving data...");

                    // 🔌 Force Disconnect logic
                    // AI ko final sentence bolne ka 4-5 seconds do, phir call kaat do
                    setTimeout(() => {
                        console.log("🔌 Stopping Vapi Session...");
                        vapi.stop();
                    }, 5000);
                }
            }
        };

        const onError = (e) => {
            console.error("❌ Vapi Error:", e);
            setIsCallActive(false);
            setLoading(false);
        };

        vapi.on("call-start", onCallStart);
        vapi.on("call-end", onCallEnd);
        vapi.on("message", onMessage);
        vapi.on("error", onError);

        return () => {
            vapi.removeAllListeners();
        };
    }, [setIsCallActive, navigate]);

    const startVictorCall = useCallback(async (basketItems, user) => {
        if (loading || isCallActive) return;
        setLoading(true);

        try {
            // 1. Backend se config fetch karo
            const config = await getNegotiationSession(basketItems, user);

            // 2. Variables setup
            const assistantOverrides = {
                variableValues: {
                    username: String(config.variableValues?.username || user?.username || "Rohit"),
                    // 'anonymous' string pass hogi agar guest hai, backend handle kar lega
                    userId: String(config.variableValues?.userId || user?._id || "anonymous"),
                    items_in_basket: String(config.variableValues?.items_in_basket),
                    raw_msrp: Number(config.variableValues?.raw_msrp),
                    raw_floor: Number(config.variableValues?.raw_floor),
                    total_msrp: String(config.variableValues?.total_msrp),
                    floor_limit: String(config.variableValues?.floor_limit)
                }
            };

            console.log("🚀 Starting Call with Overrides:", assistantOverrides.variableValues);

            // 3. Start Call
            await vapi.start(import.meta.env.VITE_VAPI_ASSISTANT_ID, assistantOverrides);

        } catch (error) {
            console.error("❌ Connection Error:", error);
            setIsCallActive(false);
        } finally {
            setLoading(false);
        }
    }, [isCallActive, loading, setIsCallActive]);

    return {
        startVictorCall,
        loading,
        isConnected: isCallActive,
        stopCall: () => vapi.stop()
    };
};