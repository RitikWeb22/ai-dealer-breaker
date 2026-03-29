import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { HiTrendingDown } from "react-icons/hi";
import Navbar from "../../auth/components/Navbar"; // 1. Navbar Import karein (Path check karlein)
import { useAuth } from "../../auth/hooks/useAuth"; // Auth context se user lene ke liye

const Leaderboard = () => {
  const { user, authLoading } = useAuth(); // 2. Auth context se user aur loading state lein
  const [sharks, setSharks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSharks = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/vapi/leaderboard`,
          {
            withCredentials: true, // Cookies ke liye
          },
        );
        setSharks(res.data.data); // Assuming backend se { data: [...] } format mein aa raha hai
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
      }
      setLoading(false);
    };

    fetchSharks();
  }, []);
  return (
    <div className="bg-[#070707] min-h-screen text-white font-sans selection:bg-blue-500/30">
      {/* 3. Navbar ko yahan place karein */}
      <Navbar
        user={user}
        authLoading={authLoading}
        cartCount={0} // Agar cart count maintain kar rahe hain toh wo pass karein
      />

      {/* 4. Content Area (pt-32 navbar ke liye space chhodega) */}
      <div className="max-w-6xl mx-auto pt-32 p-6 md:p-10">
        {/* --- TABLE SECTION --- */}
        <div className="overflow-hidden mt-19  rounded-[2.5rem] border border-white/5 bg-zinc-900/20 backdrop-blur-md shadow-2xl">
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
                  <td
                    colSpan="4"
                    className="p-20 text-center text-zinc-600 italic"
                  >
                    Syncing shark data...
                  </td>
                </tr>
              ) : (
                sharks.map((shark, index) => (
                  <motion.tr
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key={index}
                    className="group hover:bg-white/2 transition-all cursor-default"
                  >
                    <td className="px-8 py-6">
                      {index < 3 ? (
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shadow-lg ${
                            index === 0
                              ? "bg-yellow-500 text-black shadow-yellow-500/20"
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
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-zinc-800 to-zinc-900 border border-white/5 flex items-center justify-center text-blue-500 font-black">
                          {shark.username?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-zinc-200 group-hover:text-white transition-colors capitalize">
                          {shark.username}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-wrap gap-2">
                        {shark.items?.slice(0, 3).map((item, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-white/5 border border-white/5 px-2 py-1 rounded-md text-zinc-400"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-green-400 font-black italic text-lg tracking-tighter">
                          {shark.efficiencyScore}%
                        </span>
                        <div className="flex items-center gap-1 text-[9px] font-black uppercase text-zinc-500">
                          <HiTrendingDown className="text-green-500" />
                          Price Dropped
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
