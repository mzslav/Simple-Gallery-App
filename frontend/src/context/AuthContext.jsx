import React, { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser, signOut } from "aws-amplify/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkUser = async () => {
    try {
      const authUser = await getCurrentUser();
      setUser({ email: authUser.signInDetails?.loginId || "User" });
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  const loginUser = () => {
    checkUser(); // Просто перевіряємо юзера ще раз після успішного логіну
  };

  const logoutUser = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);