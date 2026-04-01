import { useState, useEffect } from "react";
import { register, login, getProfile } from "./services/auth.api";
import { AuthContext } from "./auth.context.value";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Unified Initialization
  const initAuth = async () => {
    try {
      setLoading(true);
      const data = await getProfile();

      // CRITICAL: Check your API response structure here
      // Agar backend { user: { ... } } bhej raha hai toh data.user use karein
      if (data && data.user) {
        setUser(data.user);
      } else if (data) {
        setUser(data);
      }
    } catch (error) {
      console.error("Session initialization failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const handleRegister = async (formData) => {
    try {
      setLoading(true);
      const data = await register(formData);
      setUser(data.user || data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (credentials) => {
    try {
      setLoading(true);
      const data = await login(credentials);
      setUser(data.user || data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        handleRegister,
        handleLogin,
        setUser,
        refreshProfile: initAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
