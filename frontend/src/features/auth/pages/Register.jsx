import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import FluxLoader from "../../../components/FluxLoader";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { handleRegister, loading } = useAuth();
  const navigate = useNavigate();
  const pageRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!pageRef.current) return;
    const rect = pageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    pageRef.current.style.setProperty("--mx", `${x}px`);
    pageRef.current.style.setProperty("--my", `${y}px`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      // Wait for registration to complete
      await handleRegister({ username, email, password });
      // Redirect only after successful registration
      navigate("/products");
    } catch (err) {
      console.error("Registration failed", err);
      setErrorMessage(err.message || "Registration failed. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.12),transparent_28%),linear-gradient(180deg,#050816_0%,#02050d_100%)]">
        <FluxLoader
          title="Setting Up Profile"
          subtitle="Preparing your account for negotiation"
        />
      </div>
    );
  }

  return (
    <div
      ref={pageRef}
      onMouseMove={handleMouseMove}
      className="mouse-glow-surface min-h-screen flex items-center justify-center px-4 selection:bg-emerald-400/30 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.12),transparent_26%),linear-gradient(180deg,#050816_0%,#02050d_100%)]"
    >
      <div className="w-full max-w-md bg-[rgba(10,16,32,0.76)] p-8 rounded-[2.5rem] border border-white/10 shadow-[0_35px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">
            Join the <span className="text-emerald-400">AI Dealer</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Experience the next generation of shopping.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMessage && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {errorMessage}
            </div>
          )}

          {/* Username Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-2">
              Full Name
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-slate-950/80 border border-white/5 text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all duration-300 placeholder-slate-600 shadow-inner"
              placeholder="Enter your name"
              minLength={3}
              autoComplete="name"
              required
            />
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-2">
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
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-slate-950/80 border border-white/5 text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all duration-300 placeholder-slate-600 shadow-inner"
              placeholder="••••••••"
              minLength={6}
              autoComplete="new-password"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full mt-6 py-4 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-widest rounded-2xl transition-all duration-300 shadow-lg shadow-emerald-900/30 active:scale-[0.96]"
          >
            Create Account
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-400 font-medium">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-amber-400 hover:text-amber-300 underline underline-offset-4 transition-colors"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
