import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 1. Loading State: Jab tak AuthContext user fetch kar raha hai
  if (loading) {
    return (
      <div className="min-h-screen bg-[#070707] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 font-bold tracking-widest uppercase text-xs">
            Verifying Session...
          </p>
        </div>
      </div>
    );
  }

  // 2. Auth Check: Agar user nahi hai, toh login page par bhejo
  // state={{ from: location }} isliye taaki login ke baad user wapas isi page par aaye
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Success: Agar user hai, toh requested component (children) dikhao
  return children;
};

export default Protected;
