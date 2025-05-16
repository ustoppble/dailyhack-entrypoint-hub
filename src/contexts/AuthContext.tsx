
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../lib/api/types';

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  isAuthenticated: false,
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  
  // Check for saved user in localStorage on init
  useEffect(() => {
    const savedUser = localStorage.getItem('dailyhack_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('dailyhack_user');
      }
    }
  }, []);
  
  // Update localStorage when user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('dailyhack_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('dailyhack_user');
    }
  }, [user]);
  
  const logout = () => {
    setUser(null);
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated: !!user,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
