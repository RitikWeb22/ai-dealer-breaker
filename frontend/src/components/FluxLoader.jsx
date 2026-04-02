import React from "react";

const FluxLoader = ({
  title = "Loading",
  subtitle = "Preparing your experience",
  compact = false,
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-4xl border border-white/10 bg-[rgba(10,16,32,0.78)] backdrop-blur-2xl shadow-[0_30px_90px_rgba(0,0,0,0.45)] ${
        compact ? "w-full max-w-sm p-8" : "w-full max-w-md p-10"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="absolute -top-12 -right-8 h-36 w-36 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl" />

      <div className="relative flex flex-col items-center text-center">
        <div className="loader-orbit mb-6">
          <div className="loader-orbit-core" />
          <div className="loader-ring loader-ring-a" />
          <div className="loader-ring loader-ring-b" />
          <div className="loader-ring loader-ring-c" />
        </div>

        <h3 className="text-xl font-black uppercase tracking-wider text-white">
          {title}
        </h3>
        <p className="mt-2 text-sm text-slate-300">{subtitle}</p>

        <div className="mt-6 flex items-center gap-2">
          <span className="loader-dot" />
          <span className="loader-dot loader-dot-delay-1" />
          <span className="loader-dot loader-dot-delay-2" />
        </div>
      </div>
    </div>
  );
};

export default FluxLoader;
