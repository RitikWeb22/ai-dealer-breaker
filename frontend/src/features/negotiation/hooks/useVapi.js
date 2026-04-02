import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Vapi from "@vapi-ai/web";
import { getNegotiationSession } from '../services/negotiation.api';
import { useNegotiationContext } from './useNegotiationContext';

const vapi = new Vapi(import.meta.env.VITE_VAPI_PUBLIC_KEY);

export const useNegotiation = () => {
    const { isCallActive, setIsCallActive } = useNegotiationContext();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const hasProcessedDeal = useRef(false);
    const stopTimerRef = useRef(null); // Timer ref track karne ke liye
    const retryCountRef = useRef(0);
    const lastCallPayloadRef = useRef(null);

    const startWithPayload = useCallback(async (payload, isRetry = false) => {
        await vapi.start(import.meta.env.VITE_VAPI_ASSISTANT_ID, payload);
        if (!isRetry) {
            retryCountRef.current = 0;
        }
    }, []);

    useEffect(() => {
        const onCallStart = () => {
            console.log("📞 Negotiation Started");
            setIsCallActive(true);
            hasProcessedDeal.current = false;
            retryCountRef.current = 0;
        };

        const onCallEnd = () => {
            console.log("⏹️ Negotiation Ended");
            setIsCallActive(false);
            // Timer clear karo agar call pehle hi end ho gayi
            if (stopTimerRef.current) {
                clearTimeout(stopTimerRef.current);
                stopTimerRef.current = null;
            }
            if (hasProcessedDeal.current) {
                console.log("🏆 Navigating to Leaderboard...");
                navigate("/leaderboard");
            }
        };

        const onMessage = (message) => {
            const toolCalls = message.toolCalls || message.toolCallList;

            if (message.type === 'tool-calls' || toolCalls) {
                const dealTool = toolCalls?.find(tc =>
                    (tc.function?.name === "confirmDeal") || (tc.name === "confirmDeal")
                );

                if (dealTool && !hasProcessedDeal.current) {
                    hasProcessedDeal.current = true;
                    console.log("🎯 Deal confirmed! AI ko bolne do...");

                    // AI ko 8 seconds do bolne ke liye, phir disconnect
                    stopTimerRef.current = setTimeout(() => {
                        console.log("🔌 Stopping call after deal...");
                        vapi.stop();
                        stopTimerRef.current = null;
                    }, 8000);
                }
            }
        };

        const onError = (e) => {
            console.error("❌ Vapi Error:", JSON.stringify(e));

            const isNoRoomError =
                e?.type === 'daily-error' &&
                (e?.error?.error?.type === 'no-room' || e?.error?.message?.type === 'no-room');

            if (isNoRoomError && !hasProcessedDeal.current && retryCountRef.current < 1 && lastCallPayloadRef.current) {
                retryCountRef.current += 1;
                console.warn('♻️ Room expired/deleted. Retrying call once...');

                setTimeout(async () => {
                    try {
                        await startWithPayload(lastCallPayloadRef.current, true);
                    } catch (retryError) {
                        console.error('❌ Retry failed:', retryError.message);
                    }
                }, 1200);
                return;
            }

            // 🔑 KEY FIX: Daily-error ya koi bhi error aaye,
            // agar deal ho chuki thi toh leaderboard pe bhejo
            if (hasProcessedDeal.current) {
                console.log("🏆 Deal was done before error, navigating...");
                navigate("/leaderboard");
            }

            setIsCallActive(false);
            setLoading(false);
        };

        vapi.on("call-start", onCallStart);
        vapi.on("call-end", onCallEnd);
        vapi.on("message", onMessage);
        vapi.on("error", onError);

        return () => {
            // Cleanup: timer clear karo aur listeners hata do
            if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
            vapi.removeAllListeners();
        };
    }, [setIsCallActive, navigate, startWithPayload]);

    const startVictorCall = useCallback(async (basketItems, user) => {
        if (loading || isCallActive) return;
        setLoading(true);

        try {
            const config = await getNegotiationSession(basketItems, user);

            if (!config?.variableValues) {
                throw new Error("Backend se config nahi mili");
            }

            const assistantOverrides = {
                variableValues: {
                    username: String(config.variableValues.username || user?.username || "Shark"),
                    userId: String(config.variableValues.userId || user?._id || "anonymous"),
                    items_in_basket: String(config.variableValues.items_in_basket || ""),
                    raw_msrp: Number(config.variableValues.raw_msrp || 0),
                    raw_floor: Number(config.variableValues.raw_floor || 0),
                    total_msrp: String(config.variableValues.total_msrp || ""),
                    floor_limit: String(config.variableValues.floor_limit || "")
                }
            };

            lastCallPayloadRef.current = assistantOverrides;

            console.log("🚀 Starting Call:", assistantOverrides.variableValues);
            await startWithPayload(assistantOverrides);

        } catch (error) {
            console.error("❌ Connection Error:", error.message);
            setIsCallActive(false);
            alert(`Call start nahi ho paya: ${error.message}`); // User ko batao
        } finally {
            setLoading(false);
        }
    }, [isCallActive, loading, setIsCallActive, startWithPayload]);

    return {
        startVictorCall,
        loading,
        isConnected: isCallActive,
        stopCall: () => vapi.stop()
    };
};
