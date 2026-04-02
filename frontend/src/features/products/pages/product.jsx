import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllProducts } from "../services/product.api";
import { useNegotiation } from "../../negotiation/hooks/useVapi";
import { useAuth } from "../../auth/hooks/useAuth";
import Navbar from "../../auth/components/Navbar";
import {
  HiOutlineShoppingCart,
  HiOutlineTrash,
  HiX,
  HiOutlineChatAlt2,
  HiStatusOnline,
} from "react-icons/hi";

const ProductPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);
  const hasNavigated = useRef(false);
  const surfaceRef = useRef(null);

  const { user, loading: authLoading } = useAuth();
  const {
    startVictorCall,
    loading: vapiLoading,
    isConnected,
    stopCall,
    vapi,
  } = useNegotiation();

  // Fetch products with optional chaining fix
  // ProductPage.jsx ke andar
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchAllProducts();
        console.log("📦 API Response:", data); // 👈 Check karo console mein kya aa raha hai

        if (data && data.products) {
          setProducts(data.products);
        } else if (Array.isArray(data)) {
          // Agar backend direct array bhej raha hai bina wrapper ke
          setProducts(data);
        }
      } catch (err) {
        console.error("Failed to load products", err);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    if (!vapi) return;

    hasNavigated.current = false;

    const navigateAway = (delay = 1000) => {
      if (hasNavigated.current) return;
      hasNavigated.current = true;

      setIsCartOpen(false);
      setTimeout(() => {
        setSelectedItems([]);
        navigate("/leaderboard");
      }, delay);
    };

    const handleMessage = (msg) => {
      // ✅ FIX 1: Correct Tool Call Detection (Vapi SDK uses msg.toolCalls)
      if (msg?.type === "tool-calls") {
        const toolCalls = msg.toolCalls || msg.toolCallList || [];
        const dealTool = toolCalls.find(
          (t) => t.function?.name === "confirmDeal",
        );

        if (dealTool) {
          console.log("✅ confirmDeal Detected. Ending call in 10s...");
          // Let Alex finish his "Mubarak ho" line
          setTimeout(() => {
            vapi.stop();
          }, 10000);
        }
      }

      // ✅ FIX 2: Transcript-based fallback for disconnect
      if (
        msg?.type === "transcript" &&
        msg?.role === "assistant" &&
        msg?.transcriptType === "final"
      ) {
        const text = msg.transcript.toLowerCase();
        if (
          text.includes("mubarak ho") ||
          text.includes("have a great day") ||
          text.includes("shukriya")
        ) {
          console.log("🎯 Disconnect phrase detected in transcript");
          setTimeout(() => {
            vapi.stop();
          }, 2000);
        }
      }
    };

    // ✅ FIX 3: Centralized Navigation on Call End
    const handleCallEnd = () => {
      console.log("🏁 Call disconnected. Moving to Leaderboard...");
      navigateAway(500);
    };

    vapi.on("message", handleMessage);
    vapi.on("call-end", handleCallEnd);

    return () => {
      vapi.off("message", handleMessage);
      vapi.off("call-end", handleCallEnd);
    };
  }, [vapi, navigate]);

  // Timer & Reset Logic
  useEffect(() => {
    if (isConnected) {
      setTimer(0);
      timerRef.current = setInterval(() => setTimer((prev) => prev + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isConnected]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const totalPrice = selectedItems.reduce(
    (acc, item) => acc + (item.msrp || 0),
    0,
  );

  const toggleSelect = (product) => {
    const isSelected = selectedItems.find((i) => i._id === product._id);
    if (isSelected) {
      setSelectedItems(selectedItems.filter((i) => i._id !== product._id));
    } else {
      setSelectedItems([...selectedItems, product]);
    }
  };

  const handleNegotiate = () => {
    if (selectedItems.length === 0 || authLoading) return;
    startVictorCall(selectedItems, user);
    setIsCartOpen(false);
  };

  const handleMouseMove = (e) => {
    if (!surfaceRef.current) return;
    const rect = surfaceRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    surfaceRef.current.style.setProperty("--mx", `${x}px`);
    surfaceRef.current.style.setProperty("--my", `${y}px`);
  };

  return (
    <div
      ref={surfaceRef}
      onMouseMove={handleMouseMove}
      className="mouse-glow-surface min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.14),transparent_30%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_28%),linear-gradient(180deg,#050816_0%,#02050d_100%)] text-white font-sans selection:bg-emerald-400/30"
    >
      <Navbar
        user={user}
        authLoading={authLoading}
        cartCount={selectedItems.length}
        setIsCartOpen={setIsCartOpen}
      />

      <div className="max-w-7xl mx-auto p-4 sm:p-6 pt-28 sm:pt-34 pb-40 sm:pb-48">
        <div className="mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter uppercase italic">
            Fresh <span className="text-emerald-400">Drops</span>
          </h2>
          <p className="text-slate-400 text-[11px] sm:text-sm font-bold uppercase tracking-widest mt-2">
            Select products to start your negotiation
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
          {/* ✅ Safe Render with Optional Chaining */}
          {products?.length > 0 ? (
            products.map((product) => {
              const isSelected = selectedItems.find(
                (i) => i._id === product._id,
              );
              return (
                <div
                  key={product._id}
                  onClick={() => toggleSelect(product)}
                  className={`group relative p-4 rounded-[2.5rem] border transition-all duration-700 overflow-hidden cursor-pointer ${
                    isSelected
                      ? "border-emerald-400 bg-emerald-400/5 shadow-2xl shadow-emerald-400/10 scale-[1.02]"
                      : "border-white/5 bg-slate-950/30 hover:border-white/20"
                  }`}
                >
                  <div className="aspect-square bg-slate-900/30 rounded-xl mb-6 overflow-hidden relative">
                    <img
                      src={product.image}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                      alt={product.name}
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-emerald-400/10 backdrop-blur-xs flex items-center justify-center animate-in fade-in duration-300">
                        <div className="bg-emerald-400 text-slate-950 p-4 rounded-full shadow-[0_0_30px_rgba(45,212,191,0.55)]">
                          <HiOutlineShoppingCart className="text-2xl" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="px-2">
                    <h3 className="font-bold text-slate-400 group-hover:text-white transition-colors duration-300 truncate">
                      {product.name}
                    </h3>
                    <p className="text-2xl font-black mt-2 tracking-tighter italic group-hover:text-emerald-400 transition-colors">
                      ₹{product.msrp?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-20 text-center text-slate-400 uppercase tracking-widest font-bold">
              Fetching inventory...
            </div>
          )}
        </div>
      </div>

      {/* --- CART DROPDOWN --- */}
      {isCartOpen && (
        <div className="fixed top-22 sm:top-24 left-3 right-3 sm:left-auto sm:right-10 w-auto sm:w-96 bg-slate-950/90 border border-white/10 rounded-4xl sm:rounded-[2.5rem] shadow-[0_25px_80px_rgba(0,0,0,0.8)] z-110 overflow-hidden backdrop-blur-xl">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/30">
            <h2 className="font-black uppercase tracking-widest text-xs text-slate-400">
              Your Basket
            </h2>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 hover:bg-white/5 rounded-full"
            >
              <HiX className="text-zinc-400 hover:text-red-500" />
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto custom-scrollbar p-2">
            {selectedItems.length > 0 ? (
              <table className="w-full text-left">
                <tbody className="divide-y divide-white/5">
                  {selectedItems.map((item) => (
                    <tr key={item._id} className="group hover:bg-white/2">
                      <td className="p-5 text-sm font-bold truncate max-w-37.5">
                        {item.name}
                      </td>
                      <td className="p-5 text-sm font-mono text-emerald-300">
                        ₹{item.msrp?.toLocaleString()}
                      </td>
                      <td className="p-5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItems(
                              selectedItems.filter((i) => i._id !== item._id),
                            );
                          }}
                          className="text-slate-500 hover:text-red-400"
                        >
                          <HiOutlineTrash className="text-xl" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-zinc-600 italic">
                Basket is empty...
              </div>
            )}
          </div>
          {selectedItems.length > 0 && (
            <div className="p-6 bg-zinc-900/80 border-t border-white/5">
              <div className="flex justify-between items-end mb-6">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-slate-400 font-bold tracking-[0.2em] mb-1">
                    Subtotal
                  </span>
                  <span className="text-2xl font-black italic tracking-tighter text-white">
                    ₹{totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                onClick={handleNegotiate}
                className="w-full py-4 bg-white text-slate-950 font-black uppercase rounded-2xl hover:bg-emerald-400 hover:text-slate-950 transition-all"
              >
                Start Negotiation
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- FLOATING INTERACTION BAR --- */}
      <div className="fixed bottom-5 sm:bottom-10 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 sm:px-6 z-120">
        {isConnected ? (
          <div className="bg-slate-50 text-slate-950 p-5 sm:p-8 rounded-[2.4rem] sm:rounded-[3.5rem] shadow-2xl flex flex-col gap-4 sm:gap-6 animate-in slide-in-from-bottom-24">
            <div className="flex justify-between items-center px-1 sm:px-4 gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <HiStatusOnline className="text-amber-500 animate-pulse" />
                  <p className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-500">
                    Negotiating Live
                  </p>
                </div>
                <h4 className="text-sm sm:text-lg font-black italic text-slate-800">
                  Alex is listening...
                </h4>
              </div>
              <p className="font-mono text-2xl sm:text-4xl font-black tabular-nums tracking-tighter">
                {formatTime(timer)}
              </p>
            </div>
            <button
              onClick={stopCall}
              className="w-full py-3.5 sm:py-5 bg-slate-950 text-white font-black uppercase rounded-4xl hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-3 text-xs sm:text-sm"
            >
              End Conversation
            </button>
          </div>
        ) : (
          selectedItems.length > 0 && (
            <button
              onClick={handleNegotiate}
              disabled={vapiLoading}
              className="w-full group relative flex items-center justify-between p-2.5 sm:p-3 pl-5 sm:pl-10 bg-emerald-500 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-[0_25px_60px_rgba(45,212,191,0.35)] hover:bg-emerald-400 transition-all active:scale-95 overflow-hidden border border-emerald-300/20"
            >
              <span className="font-black uppercase tracking-[0.18em] sm:tracking-[0.3em] text-[11px] sm:text-sm relative z-10 text-slate-950">
                {vapiLoading ? "Connecting AI..." : "Talk to Shopkeeper"}
              </span>
              <div className="bg-white/20 p-3.5 sm:p-5 rounded-full backdrop-blur-md group-hover:bg-white group-hover:text-emerald-600 transition-all relative z-10">
                <HiOutlineChatAlt2 className="text-xl sm:text-2xl" />
              </div>
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default ProductPage;
