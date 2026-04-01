import { useContext } from "react";

import { NegotiationContext } from "../negotiation.context.value";

export const useNegotiationContext = () => {
    const context = useContext(NegotiationContext);

    if (!context) {
        throw new Error(
            "useNegotiationContext must be used within a NegotiationProvider",
        );
    }

    return context;
};
