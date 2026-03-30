import { useState, useEffect } from 'react';
import Vapi from "@vapi-ai/web";
import { getNegotiationSession } from '../services/negotiation.api';
import { useNegotiationContext } from '../negotiation.context';

const vapi = new Vapi(import.meta.env.VITE_VAPI_PUBLIC_KEY);

export const useNegotiation = () => {
    const { isCallActive, setIsCallActive } = useNegotiationContext();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        vapi.on("call-start", () => {
            console.log("🚀 Alex is on the line!");
            setIsCallActive(true);
            setLoading(false);
        });

        // FIXED: Event name is "call-end"
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

        return () => {
            vapi.removeAllListeners();
        };
    }, [setIsCallActive]);

    const startVictorCall = async (basketItems, user) => {
        setLoading(true);
        try {
            const config = await getNegotiationSession(basketItems, user);
            const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID;

            // Calculation ke liye raw numbers nikaalna
            const totalMsrpVal = basketItems.reduce((acc, item) => acc + item.msrp, 0);
            const totalFloorVal = basketItems.reduce((acc, item) => acc + item.floorPrice, 0);

            const assistantOverrides = {
                variableValues: {
                    username: String(user?.username || "Customer"),
                    items_in_basket: String(basketItems.map(i => i.name).join(", ")),
                    total_msrp: String(config.variableValues.total_msrp), // For Alex to speak
                    floor_limit: String(config.variableValues.floor_limit), // For Alex's logic

                    // CRITICAL: Backend calculations ke liye exact numbers
                    raw_msrp: Number(totalMsrpVal),
                    raw_floor: Number(totalFloorVal),
                    userId: String(user?._id)
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

    return { startVictorCall, endCall, loading, isConnected: isCallActive, vapi };
};