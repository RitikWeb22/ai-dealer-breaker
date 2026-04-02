import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { handleLogin, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    try {
      // Wait for login to be successful
      await handleLogin({ email, password });
      navigate("/products");
    } catch (err) {
      console.error("Login trigger failed", err);
      setErrorMessage(
        err.message || "Login failed. Check your credentials and try again.",
      );
    }
  };

  // Loading State Fix
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.12),transparent_28%),linear-gradient(180deg,#050816_0%,#02050d_100%)]">
        <div className="w-full max-w-md bg-[rgba(10,16,32,0.76)] p-12 rounded-[2.5rem] border border-white/10 shadow-[0_35px_100px_rgba(0,0,0,0.45)] text-center backdrop-blur-2xl">
          <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-black text-white tracking-tight italic uppercase">
            Verifying <span className="text-emerald-400">Access</span>...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-white selection:bg-emerald-400/30 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.12),transparent_26%),linear-gradient(180deg,#050816_0%,#02050d_100%)]">
      <div className="w-full max-w-md bg-[rgba(10,16,32,0.76)] p-10 rounded-[2.5rem] border border-white/10 shadow-[0_35px_100px_rgba(0,0,0,0.45)] relative overflow-hidden backdrop-blur-2xl">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-400/10 blur-[80px] rounded-full"></div>
        <div className="absolute -bottom-20 -left-16 w-40 h-40 bg-amber-400/10 blur-[80px] rounded-full"></div>

        <div className="text-center mb-10">
          <h2 className="text-4xl font-black tracking-tighter uppercase italic">
            Welcome <span className="text-emerald-400">Back</span>
          </h2>
          <p className="text-slate-400 text-sm mt-2 font-medium">
            Log in to manage your AI negotiations.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMessage && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {errorMessage}
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-slate-950/80 border border-white/5 text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all duration-300 placeholder-slate-600 shadow-inner"
              placeholder="name@example.com"
              autoComplete="email"
              required
            />
          </div>

          {/* Password Field */}
          <div className="relative">
            <div className="flex justify-between items-center mb-2 ml-2">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-[10px] text-amber-400 hover:text-amber-300 font-bold uppercase tracking-widest transition-colors"
              >
                Forgot?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-slate-950/80 border border-white/5 text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all duration-300 placeholder-slate-600 shadow-inner"
              placeholder="••••••••"
              minLength={6}
              autoComplete="current-password"
              required
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full py-5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-widest rounded-2xl transition-all duration-300 shadow-xl shadow-emerald-900/30 active:scale-[0.96] mt-4"
          >
            Login
          </button>
        </form>

        <p className="mt-10 text-center text-sm text-slate-400 font-medium">
          New to the platform?{" "}
          <Link
            to="/register"
            className="text-amber-400 hover:text-amber-300 font-bold underline underline-offset-4 transition-colors"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
