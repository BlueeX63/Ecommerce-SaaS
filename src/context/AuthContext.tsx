"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check localStorage on mount
    const stored = localStorage.getItem("saas_dummy_auth");
    if (stored === "true") {
      setIsLoggedIn(true);
    }
  }, []);

  const login = () => {
    setIsLoggedIn(true);
    localStorage.setItem("saas_dummy_auth", "true");
  };

  const logout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("saas_dummy_auth");
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
