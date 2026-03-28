import { useState, useEffect } from 'react';
import Vapi from "@vapi-ai/web";
import { getNegotiationSession } from '../services/negotiation.api';
import { useNegotiationContext } from '../negotiation.context';

// Initialize Vapi with Public Key
const vapi = new Vapi(import.meta.env.VITE_VAPI_PUBLIC_KEY);

export const useNegotiation = () => {
    const { setIsCallActive } = useNegotiationContext();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Event Listeners
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
            // Agar error object mein details hain toh unhe bhi dekho
            if (err.error?.message) console.error("Specific Reason:", err.error.message);
            setLoading(false);
        });

        return () => vapi.removeAllListeners();
    }, [setIsCallActive]);
const startVictorCall = async (basketItems, user) => {
    if (!basketItems.length) return alert("Bhai, basket khali hai!");
    setLoading(true);

    try {
        const config = await getNegotiationSession(basketItems, user);

        // Vapi Web SDK v2 Standard Compliance Structure
        const callOptions = {
            assistantId: import.meta.env.VITE_ASSISTANT_ID,
            assistant: {
                variableValues: {
                    username: String(config.variableValues.username),
                    items_in_basket: String(config.variableValues.items_in_basket),
                    total_msrp: Number(config.variableValues.total_msrp), // Forced Number
                    floor_limit: Number(config.variableValues.floor_limit), // Forced Number
                    userId: String(config.variableValues.userId)
                }
            }
        };

        console.log("🚀 FINAL ATTEMPT - Launching with:", callOptions);
        
        // IMPORTANT: Passing the options object directly
        await vapi.start(callOptions);

    } catch (error) {
        console.error("Victor Connection Error:", error);
        setLoading(false);
    }
};
    const endCall = () => vapi.stop();

    return { startVictorCall, endCall, loading };
};