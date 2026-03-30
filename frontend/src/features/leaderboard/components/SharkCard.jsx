import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { HiTrendingDown, HiOutlineLightningBolt } from "react-icons/hi"; // Naya icon for hype
import Navbar from "../../auth/components/Navbar";
import { useAuth } from "../../auth/hooks/useAuth";

const Leaderboard = () => {
  const { user, authLoading } = useAuth();
  const [sharks, setSharks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSharks = async () => {
      try {
        // Backend controller se response format check karein (agar res.json(data) hai toh res.data use karein)
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/vapi/leaderboard`,
          { withCredentials: true },
        );
        // Sync with your controller logic
        setSharks(res.data.data || res.data);
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSharks();
  }, []);

  return (
    <div className="bg-[#070707] min-h-screen text-white font-sans selection:bg-blue-500/30">
      <Navbar user={user} authLoading={authLoading} cartCount={0} />

      <div className="max-w-6xl mx-auto pt-32 p-6 md:p-10">
        {/* --- HEADER SECTION --- */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-5xl font-black tracking-tighter uppercase italic flex items-center gap-3">
              The <span className="text-blue-600">Shark</span> Tank
              <HiOutlineLightningBolt className="text-yellow-500 animate-pulse text-3xl" />
            </h2>
            <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mt-2">
              Top negotiators who squeezed the best deals out of Alex
            </p>
          </div>
        </div>

        {/* --- TABLE SECTION --- */}
        <div className="overflow-hidden rounded-[2.5rem] border border-white/5 bg-zinc-900/20 backdrop-blur-md shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/3 text-zinc-500 uppercase text-[10px] font-black tracking-[0.2em]">
                <th className="px-8 py-6">Rank</th>
                <th className="px-8 py-6">Negotiator</th>
                <th className="px-8 py-6">Items Scored</th>
                <th className="px-8 py-6 text-right">Efficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-zinc-600 italic font-medium">
                        Syncing shark data...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : sharks.length > 0 ? (
                sharks.map((shark, index) => (
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={shark._id || index}
                    className="group hover:bg-white/[0.03] transition-all cursor-default"
                  >
                    <td className="px-8 py-6">
                      {index < 3 ? (
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shadow-xl ${
                            index === 0
                              ? "bg-yellow-500 text-black shadow-yellow-500/20 ring-4 ring-yellow-500/10"
                              : index === 1
                                ? "bg-zinc-300 text-black shadow-white/20"
                                : "bg-orange-600 text-white shadow-orange-500/20"
                          }`}
                        >
                          {index + 1}
                        </div>
                      ) : (
                        <span className="text-zinc-600 font-mono ml-3 text-sm">
                          {index + 1}
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-zinc-800 border border-white/5 flex items-center justify-center text-blue-500 font-black text-lg">
                          {shark.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-zinc-200 group-hover:text-white transition-colors capitalize">
                            {shark.username}
                          </span>
                          <span className="text-[10px] text-zinc-600 font-medium">
                            Verified Dealer
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-wrap gap-2 max-w-xs">
                        {/* Schema sync: Using 'items' instead of 'item' */}
                        {shark.items && shark.items.length > 0 ? (
                          shark.items.slice(0, 2).map((it, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-white/5 border border-white/5 px-3 py-1 rounded-full text-zinc-400 truncate"
                            >
                              {it}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-zinc-700">
                            No items listed
                          </span>
                        )}
                        {shark.items?.length > 2 && (
                          <span className="text-[10px] text-zinc-500 self-center">
                            +{shark.items.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-green-400 font-black italic text-xl tracking-tighter">
                          {shark.efficiencyScore?.toFixed(1)}%
                        </span>
                        <div className="flex items-center gap-1 text-[9px] font-black uppercase text-zinc-500">
                          <HiTrendingDown className="text-green-500 text-sm" />
                          Master Bargain
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-20 text-center text-zinc-500">
                    No sharks in the tank yet. Be the first to strike a deal!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
