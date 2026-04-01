import { useState, useCallback } from "react";
import { NegotiationContext } from "./negotiation.context.value";

export const NegotiationProvider = ({ children }) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [negotiationData, setNegotiationData] = useState(null);

  // Extra states for better tracking
  const [activePrice, setActivePrice] = useState(0);
  const [dealStatus, setDealStatus] = useState("idle"); // idle, negotiating, completed, failed

  // Helper function to reset context after call ends
  const resetNegotiation = useCallback(() => {
    setIsCallActive(false);
    setNegotiationData(null);
    setDealStatus("idle");
  }, []);

  return (
    <NegotiationContext.Provider
      value={{
        isCallActive,
        setIsCallActive,
        negotiationData,
        setNegotiationData,
        activePrice,
        setActivePrice,
        dealStatus,
        setDealStatus,
        resetNegotiation,
      }}
    >
      {children}
    </NegotiationContext.Provider>
  );
};
