import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Vapi from "@vapi-ai/web";
import { getNegotiationSession } from '../services/negotiation.api';
import { useNegotiationContext } from '../negotiation.context';

// Singleton instance to prevent multiple socket connections
const vapi = new Vapi(import.meta.env.VITE_VAPI_PUBLIC_KEY);

export const useNegotiation = () => {
    const { isCallActive, setIsCallActive } = useNegotiationContext();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const hasProcessedDeal = useRef(false); // To prevent double-saving deals

    useEffect(() => {
        const onCallStart = () => {
            console.log("📞 Call started");
            setIsCallActive(true);
            hasProcessedDeal.current = false;
        };

        const onCallEnd = () => {
            console.log("⏹️ Call ended");
            setIsCallActive(false);
        };

        const onError = (err) => {
            console.error("❌ Vapi SDK Error:", err);
            setIsCallActive(false);
        };

        const onMessage = (message) => {
            // ✅ Detection for tool calls (Synced with your confirmDeal function)
            if (message.type === 'tool-calls' && !hasProcessedDeal.current) {
                const dealTool = message.toolCalls?.find(tc => tc.function?.name === "confirmDeal");

                if (dealTool) {
                    hasProcessedDeal.current = true;
                    console.log("🎯 Deal Finalized! Processing...");

                    let args = dealTool.function?.arguments;
                    if (typeof args === 'string') {
                        try { args = JSON.parse(args); } catch { args = {}; }
                    }

                    // 🛠️ Save to MongoDB via your backend
                    const payload = {
                        userId: message.variables?.userId, // Captured from your session config
                        initialPrice: message.variables?.raw_msrp,
                        negotiatedPrice: args.final_price || args.price,
                        items: message.variables?.selectedItems,
                        status: 'completed'
                    };

                    // Example save call (Update endpoint as per your backend)
                    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/negotiation/save`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify(payload)
                    })
                        .then(() => console.log('✅ Negotiation saved to DB'))
                        .catch(err => console.error('❌ Save failed:', err));

                    // Finalize UX: Wait for AI to finish speaking then redirect
                    setTimeout(() => {
                        vapi.stop();
                        navigate("/leaderboard");
                    }, 5000);
                }
            }
        };

        vapi.on("call-start", onCallStart);
        vapi.on("call-end", onCallEnd);
        vapi.on("error", onError);
        vapi.on("message", onMessage);

        return () => {
            vapi.removeAllListeners();
        };
    }, [setIsCallActive, navigate]);

    const startVictorCall = useCallback(async (basketItems, user) => {
        if (loading || isCallActive) return;
        setLoading(true);

        try {
            // 1. Get Flat Session Config from your updated service
            const config = await getNegotiationSession(basketItems, user);

            // 2. Map config variables directly to Vapi assistant overrides
            // Note: config.variableValues comes from your backend controller
            const assistantOverrides = {
                variableValues: {
                    username: String(config.variableValues?.username || "Guest"),
                    userId: String(config.variableValues?.userId || user?._id),
                    items_in_basket: String(config.variableValues?.items_in_basket),
                    raw_msrp: Number(config.variableValues?.raw_msrp),
                    raw_floor: Number(config.variableValues?.raw_floor),
                    total_msrp: String(config.variableValues?.total_msrp),
                    floor_limit: String(config.variableValues?.floor_limit)
                }
            };

            console.log("🚀 Starting Call with UserID:", assistantOverrides.variableValues.userId);
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