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
            setIsCallActive(false); // Safety: Stop UI active state on error
            setLoading(false);
        });

        return () => vapi.removeAllListeners();
    }, [setIsCallActive]);

    const startVictorCall = async (basketItems, user) => {
        setLoading(true);
        try {
            const config = await getNegotiationSession(basketItems, user);

            // Vapi expects this EXACT structure
            const callOptions = {
                assistantId: import.meta.env.VITE_VAPI_ASSISTANT_ID,
                assistantOverrides: { // Note: some versions use 'assistant' or 'assistantOverrides'
                    variableValues: {
                        username: String(config.variableValues.username),
                        items_in_basket: String(config.variableValues.items_in_basket),
                        total_msrp: Number(config.variableValues.total_msrp),
                        floor_limit: Number(config.variableValues.floor_limit),
                        userId: String(config.variableValues.userId)
                    }
                }
            };

            console.log("🚀 FINAL ATTEMPT - Sending Options:", callOptions);
            await vapi.start(callOptions);

        } catch (error) {
            console.error("Victor Connection Error:", error);
            setLoading(false);
        }
    };

    const endCall = () => vapi.stop();

    return { startVictorCall, endCall, loading };
};