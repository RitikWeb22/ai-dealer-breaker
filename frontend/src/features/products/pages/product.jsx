import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom"; // 1. Added Navigate
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
  const navigate = useNavigate(); // Initialize navigation
  const [products, setProducts] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);

  const { user, loading: authLoading } = useAuth();
  const {
    startVictorCall,
    loading: vapiLoading,
    isConnected,
    vapi,
  } = useNegotiation();

  // Fetch products on mount
  useEffect(() => {
    fetchAllProducts().then((data) => setProducts(data.products));
  }, []);

  // ProductPage.jsx (Sirf Redirect Logic wala part)
  useEffect(() => {
    if (!vapi) return;

    const handleCallEnd = () => {
      console.log("Call ended - cleaning up...");

      // UI Cleanups
      setSelectedItems([]);
      setIsCartOpen(false);

      // Redirect with a small delay for better UX
      setTimeout(() => {
        navigate("/leaderboard");
      }, 1200);
    };

    // FIXED: Mismatch between "call-ended" and SDK's "call-end"
    vapi.on("call-end", handleCallEnd);

    return () => {
      vapi.off("call-end", handleCallEnd);
    };
  }, [vapi, navigate]);
  // Timer logic
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

  const totalPrice = selectedItems.reduce((acc, item) => acc + item.msrp, 0);

  const toggleSelect = (product) => {
    const isSelected = selectedItems.find((i) => i._id === product._id);
    if (isSelected) {
      setSelectedItems(selectedItems.filter((i) => i._id !== product._id));
    } else {
      setSelectedItems([...selectedItems, product]);
    }
  };

  const handleNegotiate = () => {
    if (selectedItems.length === 0) return;
    startVictorCall(selectedItems, user);
    setIsCartOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white font-sans selection:bg-blue-500/30">
      <Navbar
        user={user}
        authLoading={authLoading}
        cartCount={selectedItems.length}
        setIsCartOpen={setIsCartOpen}
      />

      <div className="max-w-7xl mx-auto p-6 pt-32 pb-48">
        <div className="mb-12">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic">
            Fresh <span className="text-blue-600">Drops</span>
          </h2>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mt-2">
            Select products to start your negotiation
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => {
            const isSelected = selectedItems.find((i) => i._id === product._id);
            return (
              <div
                key={product._id}
                onClick={() => toggleSelect(product)}
                className={`group relative p-4 rounded-[2.5rem] border transition-all duration-700 overflow-hidden cursor-pointer ${
                  isSelected
                    ? "border-blue-500 bg-blue-600/5 shadow-2xl shadow-blue-500/10 scale-[1.02]"
                    : "border-white/5 bg-zinc-900/30 hover:border-white/20"
                }`}
              >
                <div className="aspect-square bg-zinc-800/30 rounded-xl mb-6 overflow-hidden relative">
                  <img
                    src={product.image}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    alt={product.name}
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-blue-600/10 backdrop-blur-xs flex items-center justify-center animate-in fade-in duration-300">
                      <div className="bg-blue-600 text-white p-4 rounded-full shadow-[0_0_30px_rgba(37,99,235,0.6)]">
                        <HiOutlineShoppingCart className="text-2xl" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="px-2">
                  <h3 className="font-bold text-zinc-500 group-hover:text-white transition-colors duration-300 truncate">
                    {product.name}
                  </h3>
                  <p className="text-2xl font-black mt-2 tracking-tighter italic group-hover:text-blue-400 transition-colors">
                    ₹{product.msrp.toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- CART DROPDOWN --- */}
      {isCartOpen && (
        <div className="fixed top-24 right-10 w-96 bg-[#111]/90 border border-white/10 rounded-[2.5rem] shadow-[0_25px_80px_rgba(0,0,0,0.8)] z-110 overflow-hidden backdrop-blur-xl">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/30">
            <h2 className="font-black uppercase tracking-widest text-xs text-zinc-500">
              Your Basket
            </h2>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 hover:bg-white/5 rounded-full"
            >
              <HiX className="text-zinc-400 hover:text-red-500" />
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {selectedItems.length > 0 ? (
              <table className="w-full text-left">
                <tbody className="divide-y divide-white/5">
                  {selectedItems.map((item) => (
                    <tr key={item._id} className="group hover:bg-white/2">
                      <td className="p-5 text-sm font-bold truncate max-w-37.5">
                        {item.name}
                      </td>
                      <td className="p-5 text-sm font-mono text-blue-400">
                        ₹{item.msrp.toLocaleString()}
                      </td>
                      <td className="p-5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItems(
                              selectedItems.filter((i) => i._id !== item._id),
                            );
                          }}
                          className="text-zinc-600 hover:text-red-500"
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
                  <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-[0.2em] mb-1">
                    Subtotal
                  </span>
                  <span className="text-2xl font-black italic tracking-tighter text-white">
                    ₹{totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                onClick={handleNegotiate}
                className="w-full py-4 bg-white text-black font-black uppercase rounded-2xl hover:bg-blue-600 hover:text-white transition-all"
              >
                Start Negotiation
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- FLOATING INTERACTION BAR --- */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 z-120">
        {isConnected ? (
          <div className="bg-white text-black p-8 rounded-[3.5rem] shadow-2xl flex flex-col gap-6 animate-in slide-in-from-bottom-24">
            <div className="flex justify-between items-center px-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <HiStatusOnline className="text-red-600 animate-pulse" />
                  <p className="font-black uppercase text-[10px] tracking-[0.2em] text-zinc-400">
                    Negotiating Live
                  </p>
                </div>
                <h4 className="text-lg font-black italic">
                  Alex is listening...
                </h4>
              </div>
              <p className="font-mono text-4xl font-black tabular-nums tracking-tighter">
                {formatTime(timer)}
              </p>
            </div>
            <button
              onClick={() => vapi?.stop()}
              className="w-full py-5 bg-black text-white font-black uppercase rounded-4xl hover:bg-zinc-800 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              End Conversation
            </button>
          </div>
        ) : (
          selectedItems.length > 0 && (
            <button
              onClick={handleNegotiate}
              disabled={vapiLoading}
              className="w-full group relative flex items-center justify-between p-3 pl-10 bg-blue-600 rounded-[3.5rem] shadow-[0_25px_60px_rgba(37,99,235,0.4)] hover:bg-blue-500 transition-all active:scale-95 overflow-hidden border border-blue-400/20"
            >
              <span className="font-black uppercase tracking-[0.3em] text-sm relative z-10">
                {vapiLoading ? "Connecting AI..." : "Talk to Shopkeeper"}
              </span>
              <div className="bg-white/20 p-5 rounded-full backdrop-blur-md group-hover:bg-white group-hover:text-blue-600 transition-all relative z-10">
                <HiOutlineChatAlt2 className="text-2xl" />
              </div>
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default ProductPage;
