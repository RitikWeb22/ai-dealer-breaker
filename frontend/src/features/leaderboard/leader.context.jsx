import { createContext } from "react";

export const LeaderboardContext = createContext();

export const LeaderboardProvider = ({ children }) => {
  return (
    <div className="min-h-screen bg-linear-to-b from-zinc-900 to-black text-white">
      {children}
    </div>
  );
};
