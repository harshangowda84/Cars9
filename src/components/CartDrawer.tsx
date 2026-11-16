"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useCart, CartItem } from "@/context/CartContext";
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  Check, 
  FileText, 
  ShoppingBag,
  RotateCcw
} from "lucide-react";

export function CartDrawer() {
  const { 
    items, 
    isCartDrawerOpen, 
    setIsCartDrawerOpen, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    loadItemsFromData
  } = useCart();

  // 5-second Undo state for Clear All Items
  const [undoBackup, setUndoBackup] = useState<{ items: CartItem[]; seconds: number } | null>(null);

  useEffect(() => {
    if (!undoBackup) return;
    if (undoBackup.seconds <= 0) {
      setUndoBackup(null);
      return;
    }
    const timer = setTimeout(() => {
      setUndoBackup((prev) => (prev ? { ...prev, seconds: prev.seconds - 1 } : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [undoBackup]);

  const handleClearAll = () => {
    if (items.length === 0) return;
    const backup = [...items];
    clearCart();
    setUndoBackup({ items: backup, seconds: 5 });
  };

  const handleUndoClear = () => {
    if (undoBackup && undoBackup.items.length > 0) {
      loadItemsFromData(undoBackup.items);
      setUndoBackup(null);
    }
  };

  if (!isCartDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Enquiry List
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {items.length} {items.length === 1 ? "accessory" : "accessories"} selected
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 5-Second Undo Notification Banner */}
          {undoBackup && (
            <div className="mx-6 mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium">
                <RotateCcw className="w-4 h-4 animate-spin-reverse" />
                <span>Cart cleared ({undoBackup.seconds}s remaining)</span>
              </div>
              <button
                onClick={handleUndoClear}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-sm transition text-xs active:scale-95"
              >
                Undo
              </button>
            </div>
          )}

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length > 0 ? (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 group"
                >
                  <img
                    src={item.imageUrl || "/images/placeholder.jpg"}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 bg-slate-950"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                      {item.brand} • {item.subbrand}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 leading-snug">
                      {item.name}
                    </h4>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      SKU: {item.sku}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity Selector */}
                      <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 bg-white dark:bg-slate-900">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:text-red-500 text-slate-500 transition"
                          title="Decrease"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold px-1.5 min-w-5 text-center text-slate-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:text-emerald-500 text-slate-500 transition"
                          title="Increase"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-400 hover:text-red-600 transition p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center text-slate-400 space-y-3">
                <ShoppingBag className="w-10 h-10 mx-auto opacity-30" />
                <p className="text-xs font-medium">Your enquiry list is empty.</p>
                <p className="text-[11px] text-slate-500">
                  Select accessories from the catalog to build your custom setup.
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {items.length > 0 && (
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-950/50">
              {/* Proceed to Full Quotation Page */}
              <Link
                href="/quotation"
                onClick={() => setIsCartDrawerOpen(false)}
                className="w-full py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition active:scale-98"
              >
                <FileText className="w-4 h-4" />
                <span>Open Formal Quotation</span>
              </Link>

              <button
                onClick={handleClearAll}
                className="w-full text-center text-[11px] text-slate-400 hover:text-red-500 transition py-1"
              >
                Clear All Items
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
