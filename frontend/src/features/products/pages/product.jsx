import React, { useEffect, useState, useRef } from "react";
import { fetchAllProducts } from "../services/product.api";
import { useNegotiation } from "../../negotiation/hooks/useVapi";

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);

  // useNegotiation hook se loading aur isConnected mil raha hai
  const { startVictorCall, loading, isConnected, vapi } = useNegotiation();

  useEffect(() => {
    fetchAllProducts().then((data) => setProducts(data.products));
  }, []);

  // TIMER LOGIC
  useEffect(() => {
    if (isConnected) {
      console.log("Call Connected! Starting Timer...");
      setTimer(0);
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      console.log("Call Disconnected! Stopping Timer...");
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isConnected]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleSelect = (name) => {
    setSelectedItems((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name],
    );
  };

  const handleNegotiate = () => {
    if (selectedItems.length === 0) return alert("Pehle kuch uthao toh sahi!");
    const user = { name: "Ritik", id: "user_01" };
    startVictorCall(selectedItems, user);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8 pb-48 relative">
      <header className="flex justify-between items-center mb-12">
        <h1 className="text-3xl font-black tracking-tighter uppercase italic">
          Ai Deal Breaker Shop
        </h1>
        <div className="bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800 text-sm">
          {selectedItems.length} Items Selected
        </div>
      </header>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div
            key={product._id}
            onClick={() => toggleSelect(product.name)}
            className={`cursor-pointer p-5 rounded-2xl border transition-all duration-300 ${
              selectedItems.includes(product.name)
                ? "border-white bg-zinc-800"
                : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
            }`}
          >
            <div className="h-40 bg-zinc-800 rounded-xl mb-4 overflow-hidden">
              <img
                src={product.image}
                className="object-cover w-full h-full"
                alt={product.name}
              />
            </div>
            <h3 className="font-bold text-lg">{product.name}</h3>
            <span className="text-xl font-mono font-bold text-green-400">
              ₹{product.msrp}
            </span>
          </div>
        ))}
      </div>

      {/* --- FLOATING ACTION PANEL (The Fix) --- */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-md px-6 z-[9999]">
        {/* CASE 1: JAB CALL CHAL RAHI HO */}
        {isConnected ? (
          <div className="bg-white text-black p-5 rounded-[2.5rem] shadow-[0_20px_60px_rgba(255,255,255,0.3)] flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-10 duration-500">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-ping" />
                <span className="font-black uppercase tracking-tighter text-sm">
                  Alex Live
                </span>
              </div>
              <div className="font-mono text-2xl font-black tabular-nums">
                {formatTime(timer)}
              </div>
            </div>

            <button
              onClick={() => vapi?.stop()}
              className="w-full py-4 bg-black text-white font-black uppercase rounded-3xl hover:bg-zinc-800 transition-colors"
            >
              End Conversation
            </button>
          </div>
        ) : (
          /* CASE 2: JAB ITEMS SELECTED HAIN PAR CALL NAHI CHAL RAHI */
          selectedItems.length > 0 && (
            <button
              onClick={handleNegotiate}
              disabled={loading}
              className="w-full py-6 bg-white text-black font-black uppercase tracking-widest rounded-[2.5rem] shadow-[0_10px_40px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? "Waking up Alex..." : "Talk to Shopkeeper"}
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default ProductPage;
