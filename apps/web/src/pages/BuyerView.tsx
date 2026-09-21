import React, { useState } from "react";
import { Product, BuyerRequirement, api } from "../services/api";
import { ShoppingBag, Search, Send, Sparkles, CheckCircle2 } from "lucide-react";

interface BuyerProps {
  products: Product[];
  requirements: BuyerRequirement[];
  matches: any[];
  onRefresh: () => void;
}

export const BuyerView: React.FC<BuyerProps> = ({ products, requirements, matches, onRefresh }) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [enquirySuccess, setEnquirySuccess] = useState(false);
  const [formData, setFormData] = useState({
    buyerName: "Sundaram Organics",
    buyerPhone: "9876543220",
    quantity: 20,
    offeredPrice: 480,
    message: "We are looking to purchase this lot for our wholesale organic retail stores in Chennai.",
  });

  const handleSendEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    await api.createEnquiry({
      productId: selectedProduct.id,
      buyerName: formData.buyerName,
      buyerPhone: formData.buyerPhone,
      quantity: formData.quantity,
      offeredPrice: formData.offeredPrice,
      message: formData.message,
    });

    setEnquirySuccess(true);
    setTimeout(() => {
      setEnquirySuccess(false);
      setSelectedProduct(null);
      onRefresh();
    }, 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-green-700 uppercase tracking-wider bg-green-50 px-2.5 py-1 rounded-md border border-green-200">
            Wholesale Procurement Marketplace
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-2">
            Procure Directly from Tribal Collectives
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Access authentic forest honey, hill turmeric, organic millets, and wild spices with full traceability and direct farmer compensation.
          </p>
        </div>
      </div>

      {/* AI Explainable Matches Section */}
      {matches.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-900 to-green-950 rounded-2xl p-6 text-white shadow-lg space-y-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-emerald-300" />
            <h3 className="font-bold text-lg">AI Matching Engine & Explainability (Stage 10)</h3>
          </div>
          <p className="text-xs text-emerald-200">
            Automated compatibility scoring between available tribal inventory and wholesale buyer requirements.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {matches.map((m) => (
              <div key={m.id} className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-white">{m.productName}</span>
                  <span className="text-xs font-black bg-emerald-400 text-emerald-950 px-2 py-0.5 rounded-full">
                    {m.overallScore}% Match
                  </span>
                </div>
                <p className="text-xs text-emerald-100 italic">"{m.explanationEnglish}"</p>
                <div className="flex items-center justify-between text-xs text-emerald-300 pt-2 border-t border-white/10">
                  <span>Buyer: {m.buyerName}</span>
                  <span>Producer Score: 95%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Catalog */}
      <div>
        <h2 className="text-xl font-bold text-stone-900 mb-4 flex items-center space-x-2">
          <ShoppingBag className="w-5 h-5 text-green-700" />
          <span>Available Tribal Produce ({products.length})</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <img
                  src={item.images[0] || "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500"}
                  alt={item.name}
                  className="w-full h-44 object-cover"
                />
                <div className="p-4 space-y-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-100 text-green-800">
                    {item.quality}
                  </span>
                  <h3 className="font-bold text-stone-900 text-base">{item.name}</h3>
                  <p className="text-xs text-stone-500">Collected by: {item.producerName}</p>
                  <p className="text-xs text-stone-500">Region: {item.location.district}, {item.location.state}</p>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-sm">
                    <span className="text-stone-700 font-bold">{item.quantity} {item.unit} available</span>
                    <span className="text-green-700 font-extrabold text-base">₹{item.expectedPrice}/{item.unit}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-stone-50 border-t border-stone-100">
                <button
                  onClick={() => {
                    setSelectedProduct(item);
                    setFormData({ ...formData, quantity: item.quantity, offeredPrice: item.expectedPrice });
                  }}
                  className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-2.5 rounded-xl text-xs transition shadow-sm"
                >
                  Send Procurement Enquiry
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Send Enquiry Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            {enquirySuccess ? (
              <div className="text-center py-8 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto animate-bounce" />
                <h3 className="font-bold text-lg text-stone-900">Enquiry Sent to Producer!</h3>
                <p className="text-xs text-stone-500">
                  The producer has been notified. Per privacy rule R7, contact details will be unlocked once they accept.
                </p>
              </div>
            ) : (
              <>
                <h3 className="font-bold text-lg text-stone-900">
                  Procurement Enquiry for {selectedProduct.name}
                </h3>
                <form onSubmit={handleSendEnquiry} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-stone-600 block mb-1">Buyer Organization</label>
                    <input
                      type="text"
                      value={formData.buyerName}
                      onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                      className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-600 block mb-1">Buyer Phone</label>
                    <input
                      type="text"
                      value={formData.buyerPhone}
                      onChange={(e) => setFormData({ ...formData, buyerPhone: e.target.value })}
                      className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-stone-600 block mb-1">Quantity ({selectedProduct.unit})</label>
                      <input
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                        className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-stone-600 block mb-1">Offered Price (₹)</label>
                      <input
                        type="number"
                        value={formData.offeredPrice}
                        onChange={(e) => setFormData({ ...formData, offeredPrice: Number(e.target.value) })}
                        className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-stone-600 block mb-1">Message to Producer</label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={2}
                      className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="flex space-x-3 pt-3">
                    <button
                      type="submit"
                      className="flex-1 bg-green-700 hover:bg-green-800 text-white font-bold py-2.5 rounded-lg text-sm transition"
                    >
                      Submit Enquiry
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(null)}
                      className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold py-2.5 px-4 rounded-lg text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
