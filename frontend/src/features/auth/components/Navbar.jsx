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
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl z-1000">
      <div className="bg-zinc-900/40 border border-white/10 backdrop-blur-2xl rounded-[2.5rem] p-3 px-6 flex justify-between items-center shadow-2xl">
        {/* --- LOGO --- */}
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => navigate("/products")}
        >
          <div className="w-2 h-8 bg-blue-600 rounded-full group-hover:scale-y-110 transition-transform" />
          <h1 className="text-lg font-black tracking-tighter uppercase italic text-white">
            Deal <span className="text-blue-500">Breaker</span>
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
                    className="absolute inset-0 bg-blue-600 rounded-full -z-10 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
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
          <button
            onClick={() => setIsCartOpen(true)}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 relative transition-all active:scale-90"
          >
            <HiOutlineShoppingCart className="text-xl text-zinc-300" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-[#070707]">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10 hover:border-blue-500/30 transition-colors">
            <HiOutlineUserCircle className="text-2xl text-blue-500" />
            <span className="text-[10px] font-black tracking-widest uppercase text-blue-100 hidden sm:block">
              {authLoading ? "Syncing..." : user?.username || "Guest"}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
