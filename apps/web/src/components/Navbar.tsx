import React from "react";
import { Sprout, ShoppingBag, TrendingUp, ShieldCheck, Mic } from "lucide-react";

interface NavbarProps {
  currentTab: "producer" | "buyer" | "market" | "admin";
  setCurrentTab: (tab: "producer" | "buyer" | "market" | "admin") => void;
  onOpenVoice: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenVoice }) => {
  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab("producer")}>
          <div className="w-10 h-10 rounded-xl bg-green-700 flex items-center justify-center text-white shadow-md">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xl tracking-tight text-stone-900">Kurinji Kural</span>
              <span className="text-xs bg-green-100 text-green-800 font-semibold px-2 py-0.5 rounded-full border border-green-200">
                English Inventory
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium">Voice-First Tribal Marketplace</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center space-x-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
          <button
            onClick={() => setCurrentTab("producer")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              currentTab === "producer" ? "bg-white text-green-700 shadow-sm" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Sprout className="w-4 h-4" />
            <span>Producer Inventory</span>
          </button>

          <button
            onClick={() => setCurrentTab("buyer")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              currentTab === "buyer" ? "bg-white text-green-700 shadow-sm" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Buyer Marketplace</span>
          </button>

          <button
            onClick={() => setCurrentTab("market")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              currentTab === "market" ? "bg-white text-green-700 shadow-sm" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Mandi & MSP Prices</span>
          </button>

          <button
            onClick={() => setCurrentTab("admin")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              currentTab === "admin" ? "bg-white text-green-700 shadow-sm" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Admin & Audit</span>
          </button>
        </nav>

        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenVoice}
            className="flex items-center space-x-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2.5 rounded-xl font-semibold shadow-md transition-all active:scale-95 animate-pulse"
          >
            <Mic className="w-5 h-5" />
            <span className="hidden sm:inline">Voice Assistant</span>
          </button>
        </div>
      </div>
    </header>
  );
};
