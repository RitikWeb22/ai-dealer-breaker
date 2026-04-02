import React, { memo } from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineUser, HiOutlineLogin } from "react-icons/hi";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  PRODUCTS: "/products",
  LEADERBOARD: "/leaderboard",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const AuthNav = memo(({ onLogin, onRegister }) => (
  <nav className="absolute top-8 right-8 z-1000 flex items-center gap-3">
    <button
      onClick={onLogin}
      className="px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors"
    >
      Login
    </button>
    <button
      onClick={onRegister}
      className="flex items-center gap-2 px-6 py-2.5 bg-white text-slate-950 text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-emerald-400 hover:text-slate-950 transition-all active:scale-95 shadow-xl shadow-white/5"
    >
      <HiOutlineUser className="text-sm" aria-hidden="true" />
      Register
    </button>
  </nav>
));
AuthNav.displayName = "AuthNav";

const Badge = memo(() => (
  <div
    role="status"
    className="inline-flex items-center gap-2 px-5 py-2 mb-8 rounded-full border border-white/5 bg-slate-950/35 backdrop-blur-md text-[10px] font-black tracking-[0.3em] uppercase text-emerald-300"
  >
    <span
      className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"
      aria-hidden="true"
    />
    AI-Powered Negotiation Experience
  </div>
));
Badge.displayName = "Badge";

const CTAButtons = memo(({ onShop, onLeaderboard }) => (
  <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
    <button
      onClick={onShop}
      className="group relative px-12 py-6 bg-white text-slate-950 font-black uppercase tracking-[0.2em] text-xs rounded-2xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-white/10"
    >
      <span className="relative z-10 flex items-center gap-2">
        Enter The Shop <HiOutlineLogin className="text-lg" aria-hidden="true" />
      </span>
      <div
        className="absolute inset-0 bg-emerald-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500"
        aria-hidden="true"
      />
    </button>

    <button
      onClick={onLeaderboard}
      className="px-12 py-6 bg-slate-950/50 border border-white/5 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-slate-800 transition-all backdrop-blur-md"
    >
      Wall of Sharks
    </button>
  </div>
));
CTAButtons.displayName = "CTAButtons";

const SiteFooter = memo(() => (
  <footer className="absolute bottom-10 w-full px-12 flex justify-between items-center text-[9px] font-black uppercase tracking-[0.4em] text-zinc-700">
    <div className="flex items-center gap-4">
      <span>© 2026 DEAL BREAKER</span>
      <div className="h-px w-12 bg-zinc-800" aria-hidden="true" />
      <span className="text-zinc-500 uppercase tracking-widest">
        Designed for Sharks
      </span>
    </div>
    <a
      href="https://github.com"
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-amber-400 transition-colors"
    >
      GitHub
    </a>
  </footer>
));
SiteFooter.displayName = "SiteFooter";

// ─── Main Component ───────────────────────────────────────────────────────────

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-center p-6 selection:bg-emerald-400 selection:text-slate-950 overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_32%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.16),transparent_30%),linear-gradient(180deg,#050816_0%,#02050d_100%)]">
      <AuthNav
        onLogin={() => navigate(ROUTES.LOGIN)}
        onRegister={() => navigate(ROUTES.REGISTER)}
      />

      {/* Background glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-100 bg-emerald-400/10 blur-[150px] rounded-full pointer-events-none"
        aria-hidden="true"
      />

      <main className="relative z-10 text-center max-w-4xl">
        <Badge />

        <h1 className="text-7xl md:text-7xl font-black tracking-tighter uppercase leading-[0.96] mb-10">
          Stop Buying. <br />
          <span
            className="text-slate-300 italic"
            style={{
              WebkitTextStroke: "1px rgba(255,255,255,0.12)",
              color: "transparent",
            }}
          >
            Start Dealing.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 mb-14 max-w-xl mx-auto leading-relaxed font-medium">
          Experience the future of shopping with{" "}
          <span className="text-white">Deal Breaker</span>. Negotiate in
          real-time with Alex, our expert AI shark, and score the lowest prices
          in the market.
        </p>

        <CTAButtons
          onShop={() => navigate(ROUTES.PRODUCTS)}
          onLeaderboard={() => navigate(ROUTES.LEADERBOARD)}
        />
      </main>

      <SiteFooter />
    </div>
  );
};

export default Home;
