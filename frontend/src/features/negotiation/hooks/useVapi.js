import { useState, useEffect, useCallback } from 'react';
import Vapi from "@vapi-ai/web";
import { getNegotiationSession } from '../services/negotiation.api';
import { useNegotiationContext } from '../negotiation.context';

// Module-level singleton — shared across the app
const vapi = new Vapi(import.meta.env.VITE_VAPI_PUBLIC_KEY);

export const useNegotiation = () => {
    const { isCallActive, setIsCallActive } = useNegotiationContext();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const onCallStart = () => setIsCallActive(true);
        const onCallEnd = () => setIsCallActive(false);
        const onError = (err) => {
            console.error("Vapi Error:", err);
            setIsCallActive(false);
        };

        vapi.on("call-start", onCallStart);
        vapi.on("call-end", onCallEnd);
        vapi.on("error", onError);

        return () => {
            vapi.off("call-start", onCallStart);
            vapi.off("call-end", onCallEnd);
            vapi.off("error", onError);
        };
    }, [setIsCallActive]);

    const startVictorCall = useCallback(async (basketItems, user) => {
        if (loading || isCallActive) return;
        setLoading(true);
        try {
            const config = await getNegotiationSession(basketItems, user);

            const assistantOverrides = {
                // ✅ endCallPhrases — VAPI khud call kaatega jab Alex yeh bole
                endCallPhrases: [
                    "Have a great day!",
                    "Shukriya!"
                ],
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