import React, { useEffect, useState } from "react";
import axios from "axios";

const Leaderboard = () => {
  const [sharks, setSharks] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const res = await axios.get("http://localhost:3000/api/vapi/leaderboard");
      setSharks(res.data.data);
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="bg-[#0a0a0a] min-h-screen p-10 text-white font-sans">
      <h2 className="text-4xl font-black mb-8 tracking-tighter uppercase italic">
        The Wall of Sharks
      </h2>
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30">
        <table className="w-full text-left">
          <thead className="bg-zinc-800/50 text-zinc-400 uppercase text-xs tracking-widest">
            <tr>
              <th className="px-6 py-4">Negotiator</th>
              <th className="px-6 py-4">Items Scored</th>
              <th className="px-6 py-4 text-right">Efficiency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {sharks.map((shark, index) => (
              <tr
                key={index}
                className="hover:bg-zinc-800/20 transition-colors"
              >
                <td className="px-6 py-4 font-bold">{shark.username}</td>
                <td className="px-6 py-4 text-zinc-400 text-sm">
                  {shark.items?.join(", ")}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-xs font-mono">
                    {shark.efficiencyScore}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;
