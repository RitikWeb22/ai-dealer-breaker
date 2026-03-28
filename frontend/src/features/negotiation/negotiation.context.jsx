import { createContext, useContext, useState } from "react";

const NegotiationContext = createContext();

export const NegotiationProvider = ({ children }) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [negotiationData, setNegotiationData] = useState(null);

  return (
    <NegotiationContext.Provider
      value={{
        isCallActive,
        setIsCallActive,
        negotiationData,
        setNegotiationData,
      }}
    >
      {children}
    </NegotiationContext.Provider>
  );
};

export const useNegotiationContext = () => useContext(NegotiationContext);
