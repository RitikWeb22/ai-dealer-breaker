import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 selection:bg-white selection:text-black">
      {/* Background Glow Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-white/5 blur-[120px] rounded-full pointer-events-none" />

      <main className="relative z-10 text-center max-w-3xl">
        {/* Badge */}
        <div className="inline-block px-4 py-1.5 mb-6 rounded-full border border-zinc-800 bg-zinc-900/50 text-xs font-medium tracking-widest uppercase text-zinc-400">
          AI-Powered Negotiation Experience
        </div>

        {/* Hero Title */}
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9] mb-8">
          Stop Buying. <br />
          <span className="text-zinc-500 italic">Start Dealing.</span>
        </h1>

        {/* Description */}
        <p className="text-lg md:text-xl text-zinc-400 mb-12 max-w-xl mx-auto leading-relaxed">
          Experience the future of shopping with AI Deal Breaker. Our
          cutting-edge platform uses advanced AI to negotiate the best deals for
          you, ensuring you never overpay again.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => navigate("/products")}
            className="group relative px-10 py-5 bg-white text-black font-black uppercase tracking-widest rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95"
          >
            <span className="relative z-10">Enter The Shop</span>
            <div className="absolute inset-0 bg-zinc-200 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </button>

          <button
            onClick={() => navigate("/leaderboard")}
            className="px-10 py-5 bg-zinc-900 border border-zinc-800 text-white font-bold uppercase tracking-widest rounded-full hover:bg-zinc-800 transition-all shadow-xl"
          >
            Leaderboard
          </button>
        </div>
      </main>

      {/* Footer / Stats */}
      <footer className="absolute bottom-10 w-full px-10 flex justify-between items-center text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-bold">
        <div>© 2026 AI DEAL BREAKER</div>
        <div className="flex gap-6">
          <span className="hover:text-zinc-400 cursor-pointer transition-colors">
            GitHub
          </span>
          <span className="hover:text-zinc-400 cursor-pointer transition-colors">
            Docs
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Home;
