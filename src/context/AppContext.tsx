import React, { createContext, useContext, useState, useCallback } from "react";
import { CartItem, StoreItem } from "@/lib/store";

interface AppContextType {
  username: string | null;
  login: (name: string) => void;
  logout: () => void;
  cart: CartItem[];
  addToCart: (item: StoreItem, qty?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, qty: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  showLogin: boolean;
  setShowLogin: (v: boolean) => void;
  showCart: boolean;
  setShowCart: (v: boolean) => void;
  showCheckout: boolean;
  setShowCheckout: (v: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem("mc_username"));
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showLogin, setShowLogin] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const login = useCallback((name: string) => {
    setUsername(name);
    localStorage.setItem("mc_username", name);
  }, []);

  const logout = useCallback(() => {
    setUsername(null);
    localStorage.removeItem("mc_username");
    setCart([]);
  }, []);

  const addToCart = useCallback((item: StoreItem, qty = 1) => {
    setCart(prev => {
      const min = item.minQuantity || 1;
      const max = item.maxQuantity || 9999;
      const finalQty = Math.max(min, Math.min(qty, max));
      
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + finalQty, max);
        return prev.map(c => c.item.id === item.id ? { ...c, quantity: newQty } : c);
      }
      return [...prev, { item, quantity: finalQty }];
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart(prev => prev.filter(c => c.item.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, qty: number) => {
    setCart(prev => prev.map(c => {
      if (c.item.id === itemId) {
        const min = c.item.minQuantity || 1;
        const max = c.item.maxQuantity || 9999;
        
        if (qty < min) {
          // Remove item if quantity is below minimum
          return null;
        }
        
        return { ...c, quantity: Math.min(qty, max) };
      }
      return c;
    }).filter((item): item is CartItem => item !== null));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  return (
    <AppContext.Provider value={{
      username, login, logout,
      cart, addToCart, removeFromCart, updateQuantity, clearCart,
      cartTotal, cartCount,
      showLogin, setShowLogin,
      showCart, setShowCart,
      showCheckout, setShowCheckout,
    }}>
      {children}
    </AppContext.Provider>
  );
};
