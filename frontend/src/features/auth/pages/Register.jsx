import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { handleRegister, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Wait for registration to complete
      await handleRegister({ username, email, password });
      // Redirect only after successful registration
      navigate("/products");
    } catch (err) {
      console.error("Registration failed", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
        <div className="w-full max-w-md bg-[#141414] p-12 rounded-3xl border border-white/5 shadow-2xl text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Setting up your <span className="text-blue-500">Profile</span>...
          </h2>
          <p className="text-gray-500 mt-2 text-sm italic">
            Getting things ready for the future of commerce.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4 selection:bg-blue-500/30">
      <div className="w-full max-w-md bg-[#141414] p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">
            Join the <span className="text-blue-500">AI Dealer</span>
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Experience the next generation of shopping.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 ml-2">
              Full Name
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-[#1e1e1e] border border-white/5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-300 placeholder-gray-600 shadow-inner"
              placeholder="Enter your name"
              required
            />
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 ml-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-[#1e1e1e] border border-white/5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-300 placeholder-gray-600 shadow-inner"
              placeholder="name@example.com"
              required
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 ml-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-[#1e1e1e] border border-white/5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-300 placeholder-gray-600 shadow-inner"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full mt-6 py-4 px-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all duration-300 shadow-lg shadow-blue-900/40 active:scale-[0.96]"
          >
            Create Account
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500 font-medium">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-500 hover:text-blue-400 underline underline-offset-4 transition-colors"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
