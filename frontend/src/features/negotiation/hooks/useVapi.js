import { useState, useEffect } from 'react';
import Vapi from "@vapi-ai/web";
import { getNegotiationSession } from '../services/negotiation.api';
import { useNegotiationContext } from '../negotiation.context';

// Vapi instance ko hook ke bahar rakha hai taaki singleton rahe
const vapi = new Vapi(import.meta.env.VITE_VAPI_PUBLIC_KEY);

export const useNegotiation = () => {
    // Context se state aur setter dono nikaal rahe hain
    const { isCallActive, setIsCallActive } = useNegotiationContext();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Events ko track karne ke liye
        vapi.on("call-start", () => {
            console.log("🚀 Alex is on the line!");
            setIsCallActive(true);
            setLoading(false);
        });

        vapi.on("call-end", () => {
            console.log("🏁 Call ended.");
            setIsCallActive(false);
            setLoading(false);
        });

        vapi.on("error", (err) => {
            console.error("Vapi SDK Error:", err);
            setIsCallActive(false);
            setLoading(false);
        });

        // Cleanup
        return () => {
            vapi.removeAllListeners();
        };
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
                    // Backend se "13 hazaar" format mein aa raha hai toh String rakhein
                    total_msrp: String(config.variableValues.total_msrp),
                    floor_limit: String(config.variableValues.floor_limit),
                    userId: String(config.variableValues.userId)
                }
            };

            await vapi.start(assistantId, assistantOverrides);

        } catch (error) {
            console.error("Victor Connection Error:", error);
            setLoading(false);
            setIsCallActive(false);
        }
    };

    const endCall = () => vapi.stop();

    return {
        startVictorCall,
        endCall,
        loading,
        isConnected: isCallActive, // ProductPage ke liye important rename
        vapi // Instance return kar rahe hain listeners ke liye
    };
};