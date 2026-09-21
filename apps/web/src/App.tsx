import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { VoiceAssistantBar } from "./components/VoiceAssistantBar";
import { ProducerView } from "./pages/ProducerView";
import { BuyerView } from "./pages/BuyerView";
import { MarketView } from "./pages/MarketView";
import { AdminView } from "./pages/AdminView";
import { api, Product, Enquiry, BuyerRequirement } from "./services/api";

export function App() {
  const [currentTab, setCurrentTab] = useState<"producer" | "buyer" | "market" | "admin">("producer");
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [requirements, setRequirements] = useState<BuyerRequirement[]>([]);
  const [matches, setMatches] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const [prodRes, enqRes, reqRes, matchRes] = await Promise.all([
        api.getProducts(),
        api.getEnquiries(),
        api.getRequirements(),
        api.getMatches(),
      ]);
      if (prodRes.products) setProducts(prodRes.products);
      if (enqRes.enquiries) setEnquiries(enqRes.enquiries);
      if (reqRes.requirements) setRequirements(reqRes.requirements);
      if (matchRes.matches) setMatches(matchRes.matches);
    } catch (err) {
      console.error("Failed to load initial data", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-between">
      <div>
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          onOpenVoice={() => setIsVoiceOpen(true)}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {currentTab === "producer" && (
            <ProducerView
              products={products}
              enquiries={enquiries}
              onRefresh={loadData}
              onOpenVoice={() => setIsVoiceOpen(true)}
            />
          )}

          {currentTab === "buyer" && (
            <BuyerView
              products={products}
              requirements={requirements}
              matches={matches}
              onRefresh={loadData}
            />
          )}

          {currentTab === "market" && <MarketView />}

          {currentTab === "admin" && <AdminView />}
        </main>
      </div>

      <VoiceAssistantBar
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onProductAdded={loadData}
      />

      <footer className="bg-white border-t border-stone-200 py-6 mt-16 text-center text-xs text-stone-500">
        <p className="font-semibold text-stone-700">Kurinji Kural — Voice-First Multilingual Multi-Agent Marketplace for Tribal Producers</p>
        <p className="mt-1">Built with Google Agent Framework, Chirp 3 Speech Architecture, and Strict Propose → Confirm Protocol.</p>
      </footer>
    </div>
  );
}

export default App;
