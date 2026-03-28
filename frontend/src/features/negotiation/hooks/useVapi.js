import { useState } from 'react';
import Vapi from "@vapi-ai/web";
import { getNegotiationSession } from '../services/negotiation.api';
import { useNegotiationContext } from '../negotiation.context';

const vapi = new Vapi(import.meta.env.VITE_VAPI_PUBLIC_KEY);

export const useNegotiation = () => {
    const { setIsCallActive } = useNegotiationContext();
    const [loading, setLoading] = useState(false);

    const startVictorCall = async (basketItems, user) => {
        setLoading(true);
        try {
            const overrides = await getNegotiationSession(basketItems, user);

            vapi.start(import.meta.env.VITE_VAPI_ASSISTANT_ID, {
                assistantOverrides: overrides
            });

            vapi.on("call-start", () => {
                setIsCallActive(true);
                setLoading(false);
            });

            vapi.on("call-end", () => {
                setIsCallActive(false);
            });

        } catch (error) {
            console.error("Victor is moody today:", error);
            setLoading(false);
        }
    };

    const endCall = () => vapi.stop();

    return { startVictorCall, endCall, loading };
};