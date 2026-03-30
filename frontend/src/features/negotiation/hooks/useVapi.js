import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Vapi from "@vapi-ai/web";
import { getNegotiationSession } from '../services/negotiation.api';
import { useNegotiationContext } from '../negotiation.context';

// Singleton instance
const vapi = new Vapi(import.meta.env.VITE_VAPI_PUBLIC_KEY);

export const useNegotiation = () => {
    const { isCallActive, setIsCallActive } = useNegotiationContext();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const hasProcessedDeal = useRef(false);

    useEffect(() => {
        const onCallStart = () => {
            console.log("📞 Call started");
            setIsCallActive(true);
            hasProcessedDeal.current = false;
        };

        const onCallEnd = () => {
            console.log("⏹️ Call ended");
            setIsCallActive(false);
            // Optional: Redirect to leaderboard on normal end
            if (hasProcessedDeal.current) navigate("/leaderboard");
        };

        const onError = (err) => {
            console.error("❌ Vapi SDK Error:", err);
            setIsCallActive(false);
            setLoading(false);
        };

        const onMessage = (message) => {
            // Frontend side tool-call detection (Fallback if Webhook is slow)
            if (message.type === 'tool-calls' && !hasProcessedDeal.current) {
                const dealTool = message.toolCalls?.find(tc => tc.function?.name === "confirmDeal");
                if (dealTool) {
                    hasProcessedDeal.current = true;
                    console.log("🎯 Deal Finalized! AI is speaking final words...");

                    // Note: Backend Webhook is already saving to DB. 
                    // This frontend logic is just for UX/Redirection.
                    setTimeout(() => {
                        vapi.stop();
                        navigate("/leaderboard");
                    }, 6000);
                }
            }
        };

        vapi.on("call-start", onCallStart);
        vapi.on("call-end", onCallEnd);
        vapi.on("error", onError);
        vapi.on("message", onMessage);

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
            // 1. Get Config from your Backend (getAssistantConfig)
            const config = await getNegotiationSession(basketItems, user);

            // 2. CRITICAL: Vapi expects assistantOverrides as the second argument
            // The structure MUST match the Assistant object schema
            const assistantOverrides = {
                variableValues: {
                    username: String(config.variableValues?.username || user?.username || "Shark"),
                    userId: String(config.variableValues?.userId || user?._id || "anonymous"),
                    items_in_basket: String(config.variableValues?.items_in_basket),
                    raw_msrp: Number(config.variableValues?.raw_msrp),
                    raw_floor: Number(config.variableValues?.raw_floor),
                    total_msrp: String(config.variableValues?.total_msrp),
                    floor_limit: String(config.variableValues?.floor_limit)
                }
            };

            console.log("🚀 Starting Call with Overrides:", assistantOverrides.variableValues);

            // Ensure permissions are requested before start
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
        vapi,
        stopCall: () => vapi.stop()
    };
};