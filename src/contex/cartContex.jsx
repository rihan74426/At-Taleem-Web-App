// src/context/CartContext.tsx
"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  // load from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("bookCart") || "[]");
    setItems(saved);
  }, []);

  // persist
  useEffect(() => {
    localStorage.setItem("bookCart", JSON.stringify(items));
  }, [items]);

  const add = (book) => {
    if (!items.find((b) => b._id === book._id)) {
      setItems([...items, book]);
    }
  };
  const remove = (bookId) => {
    setItems(items.filter((b) => b._id !== bookId));
  };
  const clear = () => setItems([]);

  const total = items.reduce((sum, b) => sum + b.price, 0);
  const specialPrice = 1000; // complete set price

  return (
    <CartContext.Provider
      value={{ items, add, remove, clear, total, specialPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
