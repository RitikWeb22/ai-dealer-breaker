import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { HiTrendingDown, HiOutlineLightningBolt, HiFire } from "react-icons/hi";
import Navbar from "../../auth/components/Navbar";
import { useAuth } from "../../auth/hooks/useAuth";

const Leaderboard = () => {
  const { user, authLoading } = useAuth();
  const [sharks, setSharks] = useState([]);
  const [loading, setLoading] = useState(true);
  const MotionTableRow = motion.tr;

  // Helper to get shark title based on efficiency
  const getSharkTitle = (score) => {
    if (score >= 90) return { label: "Savage Shark", color: "text-red-500" };
    if (score >= 70) return { label: "Pro Hustler", color: "text-emerald-300" };
    if (score >= 40) return { label: "Smart Dealer", color: "text-green-400" };
    return { label: "Rookie", color: "text-zinc-500" };
  };

  useEffect(() => {
    const fetchSharks = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/vapi/leaderboard`,
          { withCredentials: true },
        );
        // Correcting access based on our controller res.status(200).json({ success: true, data: topSharks });
        setSharks(res.data.data || []);
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSharks();
  }, []);

  return (
    <div className="bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.14),transparent_30%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_28%),linear-gradient(180deg,#050816_0%,#02050d_100%)] min-h-screen text-white font-sans selection:bg-emerald-400/30">
      <Navbar user={user} authLoading={authLoading} cartCount={0} />

      <div className="max-w-6xl mx-auto pt-32 p-6 md:p-10">
        {/* --- TABLE SECTION --- */}
        <div className="overflow-x-auto mt-18 rounded-[2.5rem] border border-white/5 bg-slate-950/20 backdrop-blur-md shadow-2xl">
          <table className="w-full text-left border-collapse min-w-175">
            <thead>
              <tr className="bg-white/2 text-slate-400 uppercase text-[10px] font-black tracking-[0.2em]">
                <th className="px-8 py-7">Rank</th>
                <th className="px-8 py-7">Negotiator</th>
                <th className="px-8 py-7">Items Scored</th>
                <th className="px-8 py-7 text-right">Efficiency Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                // Skeleton Rows
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="4" className="px-8 py-8">
                      <div className="h-10 bg-white/5 rounded-xl w-full"></div>
                    </td>
                  </tr>
                ))
              ) : sharks.length > 0 ? (
                <AnimatePresence>
                  {sharks.map((shark, index) => {
                    const title = getSharkTitle(shark.efficiencyScore);
                    return (
                      <MotionTableRow
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08 }}
                        key={shark._id || index}
                        className="group hover:bg-white/4 transition-all cursor-default"
                      >
                        <td className="px-8 py-6">
                          {index < 3 ? (
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shadow-2xl relative
                              ${
                                index === 0
                                  ? "bg-linear-to-br from-yellow-400 to-orange-500 text-black ring-4 ring-yellow-500/20"
                                  : index === 1
                                    ? "bg-zinc-300 text-black ring-4 ring-zinc-300/10"
                                    : "bg-orange-700 text-white ring-4 ring-orange-700/10"
                              }`}
                            >
                              {index + 1}
                              {index === 0 && (
                                <div className="absolute -top-2 -right-2 text-lg">
                                  👑
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500 font-mono ml-4 text-sm font-bold">
                              {index + 1}
                            </span>
                          )}
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-slate-900 to-slate-950 border border-white/10 flex items-center justify-center text-emerald-400 font-black text-xl group-hover:scale-110 transition-transform">
                              {shark.username?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-zinc-100 group-hover:text-emerald-300 transition-colors capitalize text-lg">
                                {shark.username}
                              </span>
                              <span
                                className={`text-[10px] font-black uppercase tracking-tighter ${title.color}`}
                              >
                                {title.label}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-wrap gap-2 max-w-xs">
                            {shark.items && shark.items.length > 0 ? (
                              shark.items.slice(0, 2).map((it, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-slate-400 font-medium"
                                >
                                  {it}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-600 italic">
                                No items score
                              </span>
                            )}
                            {shark.items?.length > 2 && (
                              <span className="text-[10px] text-emerald-400 font-black self-center px-2">
                                +{shark.items.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-2">
                              {shark.efficiencyScore >= 80 && (
                                <HiOutlineLightningBolt className="text-amber-400 animate-pulse" />
                              )}
                              <span className="text-white font-black italic text-2xl tracking-tighter">
                                {shark.efficiencyScore?.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-500 tracking-widest mt-1">
                              <HiTrendingDown className="text-emerald-400 text-sm" />
                              Bargain Power
                            </div>
                          </div>
                        </td>
                      </MotionTableRow>
                    );
                  })}
                </AnimatePresence>
              ) : (
                <tr>
                  <td colSpan="4" className="p-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-5xl opacity-20">🌊</div>
                      <span className="text-slate-500 italic font-medium">
                        The tank is empty. No one has defeated Alex yet.
                      </span>
                    </div>
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
