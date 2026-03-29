import { useContext } from "react";

import { LeaderboardContext } from "../leader.context";

export const useLeader = () => {
    const context = useContext(LeaderboardContext);
    if (!context) {
        throw new Error("useLeader must be used within a LeaderboardProvider");
    }
    return context;
};