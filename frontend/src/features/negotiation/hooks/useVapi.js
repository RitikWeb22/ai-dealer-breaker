import { useState, useEffect } from 'react';
import Vapi from "@vapi-ai/web";
import { getNegotiationSession } from '../services/negotiation.api';
import { useNegotiationContext } from '../negotiation.context';

const vapi = new Vapi(import.meta.env.VITE_VAPI_PUBLIC_KEY);

export const useNegotiation = () => {
    const { setIsCallActive } = useNegotiationContext();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        vapi.on("call-start", () => {
            console.log("🚀 Victor is on the line!");
            setIsCallActive(true);
            setLoading(false);
        });

        vapi.on("call-end", () => {
            console.log("🏁 Call ended.");
            setIsCallActive(false);
            setLoading(false);
        });

        vapi.on("error", (err) => {
            console.error("Vapi SDK Error Details:", err);
            setIsCallActive(false);
            setLoading(false);
        });

        return () => vapi.removeAllListeners();
    }, [setIsCallActive]);

    const startVictorCall = async (basketItems, user) => {
        setLoading(true);
        try {
            const config = await getNegotiationSession(basketItems, user);

            const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID;

            const assistantOverrides = {
                variableValues: {
                    username: String(config.variableValues.username || "Customer"),
                    items_in_basket: String(config.variableValues.items_in_basket),
                    total_msrp: Number(config.variableValues.total_msrp),
                    floor_limit: Number(config.variableValues.floor_limit),
                    userId: String(config.variableValues.userId)
                }
            };

            console.log("🚀 Starting Vapi call with assistantId:", assistantId);
            console.log("📦 Assistant Overrides:", JSON.stringify(assistantOverrides, null, 2));

            // ✅ Correct Vapi SDK signature:
            // vapi.start(assistantId: string, assistantOverrides?: object)
            await vapi.start(assistantId, assistantOverrides);

        } catch (error) {
            console.error("Victor Connection Error:", error);
            setLoading(false);
        }
    };

    const endCall = () => vapi.stop();

    return { startVictorCall, endCall, loading };
};