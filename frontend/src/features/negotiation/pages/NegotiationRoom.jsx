import { useNegotiation } from "../hooks/useVapi";
import { useNegotiationContext } from "../negotiation.context";

const NegotiationPage = () => {
  const { startVictorCall, endCall, loading } = useNegotiation();
  const { isCallActive } = useNegotiationContext();

  // Mock data (Aap ise products feature se pass karenge)
  const basket = ["iPhone 15", "Sony WH-1000XM5"];
  const user = { name: "Ritik", id: "123" };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6">
      <h1 className="text-4xl font-bold mb-8 text-gray-200">The Pawn Shop</h1>

      <div
        className={`w-64 h-64 rounded-full flex items-center justify-center border-4 ${isCallActive ? "border-red-600 animate-pulse" : "border-gray-700"}`}
      >
        <span className="text-xl italic">
          {isCallActive ? "Victor is listening..." : "Victor is idle"}
        </span>
      </div>

      <div className="mt-12 flex gap-4">
        {!isCallActive ? (
          <button
            onClick={() => startVictorCall(basket, user)}
            disabled={loading}
            className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-300 transition"
          >
            {loading ? "Waking up Victor..." : "Negotiate with Victor"}
          </button>
        ) : (
          <button
            onClick={endCall}
            className="bg-red-600 text-white px-8 py-3 rounded-full font-bold hover:bg-red-700 transition"
          >
            End Call
          </button>
        )}
      </div>
    </div>
  );
};

export default NegotiationPage;
