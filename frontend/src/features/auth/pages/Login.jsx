import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { handleLogin, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Wait for login to be successful
      await handleLogin({ email, password });
      navigate("/products");
    } catch {
      // Error handling (context already logs this, but you can add a toast here)
      console.error("Login trigger failed");
    }
  };

  // Loading State Fix
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
        <div className="w-full max-w-md bg-[#141414] p-12 rounded-[2.5rem] border border-white/5 shadow-2xl text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-black text-white tracking-tight italic uppercase">
            Verifying <span className="text-blue-500">Access</span>...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4 font-sans text-white selection:bg-blue-500/30">
      <div className="w-full max-w-md bg-[#141414] p-10 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 blur-[80px] rounded-full"></div>

        <div className="text-center mb-10">
          <h2 className="text-4xl font-black tracking-tighter uppercase italic">
            Welcome <span className="text-blue-500">Back</span>
          </h2>
          <p className="text-gray-500 text-sm mt-2 font-medium">
            Log in to manage your AI negotiations.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2 ml-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-[#1a1a1a] border border-white/5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-300 placeholder-zinc-700 shadow-inner"
              placeholder="name@example.com"
              required
            />
          </div>

          {/* Password Field */}
          <div className="relative">
            <div className="flex justify-between items-center mb-2 ml-2">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-[10px] text-blue-500 hover:text-blue-400 font-bold uppercase tracking-widest transition-colors"
              >
                Forgot?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-[#1a1a1a] border border-white/5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-300 placeholder-zinc-700 shadow-inner"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full py-5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all duration-300 shadow-xl shadow-blue-900/40 active:scale-[0.96] mt-4"
          >
            Login
          </button>
        </form>

        <p className="mt-10 text-center text-sm text-zinc-500 font-medium">
          New to the platform?{" "}
          <Link
            to="/register"
            className="text-blue-500 hover:text-blue-400 font-bold underline underline-offset-4 transition-colors"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
