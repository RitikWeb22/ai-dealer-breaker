import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineShoppingBag,
  HiOutlineChartBar,
  HiOutlineUserCircle,
  HiOutlineShoppingCart,
} from "react-icons/hi";

const Navbar = ({ user, authLoading, cartCount, setIsCartOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const MotionDiv = motion.div;

  const navItems = [
    { name: "Products", path: "/products", icon: <HiOutlineShoppingBag /> },
    { name: "Leaderboard", path: "/leaderboard", icon: <HiOutlineChartBar /> },
  ];

  return (
    <nav className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl z-1000">
      <div className="bg-slate-950/60 border border-white/10 backdrop-blur-2xl rounded-[2.5rem] p-2.5 sm:p-3 px-3 sm:px-6 flex justify-between items-center shadow-[0_25px_90px_rgba(0,0,0,0.45)]">
        {/* --- LOGO --- */}
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => navigate("/products")}
        >
          <div className="w-2 h-8 bg-emerald-400 rounded-full group-hover:scale-y-110 transition-transform" />
          <h1 className="text-sm sm:text-lg font-black tracking-tighter uppercase italic text-white">
            Deal <span className="text-amber-400">Breaker</span>
          </h1>
        </div>

        {/* --- NAVIGATION TABS --- */}
        <div className="hidden md:flex items-center bg-black/20 p-1.5 rounded-full border border-white/5 relative">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`relative px-6 py-2.5 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors z-10 ${
                  isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.name}
                {isActive && (
                  <MotionDiv
                    layoutId="activeTab"
                    className="absolute inset-0 bg-emerald-500 rounded-full -z-10 shadow-[0_0_24px_rgba(45,212,191,0.38)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* --- ACTIONS (Cart & User) --- */}
        <div className="flex items-center gap-4">
          {/* Cart Icon */}
          {typeof setIsCartOpen === "function" && (
            <button
              onClick={() => setIsCartOpen(true)}
              className="p-2.5 sm:p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 relative transition-all active:scale-90"
            >
              <HiOutlineShoppingCart className="text-xl text-zinc-300" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-400 text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-[#02050d] text-slate-950">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* User Profile */}
          <div className="flex items-center gap-2 sm:gap-3 bg-white/5 px-2.5 sm:px-4 py-2 rounded-2xl border border-white/10 hover:border-emerald-400/30 transition-colors">
            <HiOutlineUserCircle className="text-2xl text-emerald-400" />
            <span className="text-[10px] font-black tracking-widest uppercase text-emerald-100 hidden md:block">
              {authLoading ? "Syncing..." : user?.username || "Guest"}
            </span>
          </div>
        </div>
      </div>

      <div className="md:hidden mt-3 rounded-full bg-slate-950/60 border border-white/10 backdrop-blur-xl p-1.5 flex items-center justify-center gap-1.5 shadow-[0_14px_40px_rgba(0,0,0,0.35)]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <button
              key={`mobile-${item.path}`}
              onClick={() => navigate(item.path)}
              className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wide transition-colors flex items-center gap-1.5 ${
                isActive
                  ? "bg-emerald-500 text-slate-950"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <span className="text-sm">{item.icon}</span>
              {item.name}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navbar;
