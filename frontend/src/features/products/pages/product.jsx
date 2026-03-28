import React, { useEffect, useState } from "react";
import { fetchAllProducts } from "../services/product.api";
import { useNegotiation } from "../../negotiation/hooks/useVapi";

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const { startVictorCall, loading } = useNegotiation();

  useEffect(() => {
    fetchAllProducts().then((data) => setProducts(data.products));
  }, []);

  const toggleSelect = (name) => {
    setSelectedItems((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name],
    );
  };

  const handleNegotiate = () => {
    if (selectedItems.length === 0) return alert("Pehle kuch uthao toh sahi!");
    const user = { name: "Ritik", id: "user_01" }; // Replace with real Auth data
    startVictorCall(selectedItems, user);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <header className="flex justify-between items-center mb-12">
        <h1 className="text-3xl font-black tracking-tighter uppercase">
          Ai Deal Breaker Shop
        </h1>
        <div className="bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800">
          Items Selected: {selectedItems.length}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div
            key={product._id}
            onClick={() => toggleSelect(product.name)}
            className={`cursor-pointer p-5 rounded-2xl border transition-all ${
              selectedItems.includes(product.name)
                ? "border-white bg-zinc-800"
                : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
            }`}
          >
            <div className="h-40 bg-zinc-800 rounded-xl mb-4 overflow-hidden">
              <img src={product.image} className="object-cover w-full h-full" />
            </div>
            <h3 className="font-bold text-lg">{product.name}</h3>
            <p className="text-zinc-500 text-sm mb-3">{product.description}</p>
            <span className="text-xl font-mono">₹{product.msrp}</span>
          </div>
        ))}
      </div>

      {/* Sticky Negotiate Bar */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
          <button
            onClick={handleNegotiate}
            disabled={loading}
            className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-full shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 transition-transform disabled:opacity-50"
          >
            {loading ? "Waking up Shopkeeper..." : "Talk to Shopkeeper"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductPage;
