import React, { useState } from "react";
import { Product, Enquiry, api } from "../services/api";
import { Plus, Sparkles, CheckCircle, Package, PhoneCall, ShieldCheck, MapPin } from "lucide-react";

interface ProducerProps {
  products: Product[];
  enquiries: Enquiry[];
  onRefresh: () => void;
  onOpenVoice: () => void;
}

export const ProducerView: React.FC<ProducerProps> = ({ products, enquiries, onRefresh, onOpenVoice }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [marketingPitch, setMarketingPitch] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "Wild Rock Honey",
    category: "HONEY_BEE_PRODUCTS",
    quantity: 30,
    unit: "kg",
    expectedPrice: 480,
    quality: "Wild-Harvested",
  });

  const handleAddDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createProduct({
      ...formData,
      producerName: "Maruthan (Nilgiris)",
      location: { village: "Chellapuram", district: "Nilgiris", state: "Tamil Nadu" },
    });
    setShowAddModal(false);
    onRefresh();
  };

  const handleGeneratePitch = async (product: Product) => {
    const res = await api.sendVoiceTurn(`விளம்பரம் தயார் செய் for ${product.name}`);
    setMarketingPitch(res.spokenResponseEnglish);
  };

  const handleAcceptEnquiry = async (enquiryId: string) => {
    await api.acceptEnquiry(enquiryId);
    onRefresh();
  };

  return (
    <div className="space-y-8">
      {/* Top Banner with Action Triggers */}
      <div className="bg-gradient-to-r from-green-800 to-green-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 bg-green-700/60 px-3 py-1 rounded-full text-xs font-semibold text-green-200 border border-green-600">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Tribal Producer Portal (Nilgiris & Dindigul Collectives)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            English Produce Inventory
          </h1>
          <p className="text-sm text-green-200 max-w-xl">
            Producers speak naturally in Tamil or English. Our multi-agent system extracts commodities, units, and rates, converts them to English, and safely manages this inventory.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenVoice}
            className="bg-white hover:bg-green-50 text-green-900 font-bold px-5 py-3 rounded-xl shadow-lg transition flex items-center space-x-2 active:scale-95"
          >
            <span>🎤 Add via Voice (Tamil/English)</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-700 hover:bg-green-600 text-white font-semibold px-4 py-3 rounded-xl border border-green-600 flex items-center space-x-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Direct Add</span>
          </button>
        </div>
      </div>

      {/* Marketing Pitch Alert if generated */}
      {marketingPitch && (
        <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-5 relative">
          <div className="flex items-start space-x-3">
            <Sparkles className="w-5 h-5 text-purple-700 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-purple-900">Marketing Agent Generated Pitch (Verified Claims Only)</h4>
              <p className="text-sm text-purple-800 italic">"{marketingPitch}"</p>
            </div>
          </div>
          <button
            onClick={() => setMarketingPitch(null)}
            className="absolute top-4 right-4 text-xs font-bold text-purple-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Inventory Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-stone-900 flex items-center space-x-2">
            <Package className="w-5 h-5 text-green-700" />
            <span>Active Produce Batches ({products.length})</span>
          </h2>
          <span className="text-xs text-stone-500 font-semibold uppercase">Real-Time Inventory</span>
        </div>

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
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-100 text-green-800">
                      {item.quality}
                    </span>
                    <span className="text-xs text-stone-400">ID: {item.id}</span>
                  </div>
                  <h3 className="font-bold text-stone-900 text-base">{item.name}</h3>
                  {item.nameTamil && (
                    <p className="text-xs text-stone-500 font-medium">Tamil Input: {item.nameTamil}</p>
                  )}

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-sm">
                    <div>
                      <span className="text-xs text-stone-400 block">Available Quantity</span>
                      <span className="font-bold text-stone-800">{item.quantity} {item.unit}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-stone-400 block">Expected Price</span>
                      <span className="font-bold text-green-700 text-base">₹{item.expectedPrice}/{item.unit}</span>
                    </div>
                  </div>

                  <div className="text-xs text-stone-500 flex items-center space-x-1 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span>{item.location.village}, {item.location.district}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
                <span className="text-xs text-stone-500 font-medium">{item.producerName}</span>
                <button
                  onClick={() => handleGeneratePitch(item)}
                  className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center space-x-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Pitch</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Buyer Enquiries Section (with Privacy Guard) */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-stone-900 mb-2 flex items-center space-x-2">
          <PhoneCall className="w-5 h-5 text-green-700" />
          <span>Incoming Buyer Enquiries ({enquiries.length})</span>
        </h3>
        <p className="text-xs text-stone-500 mb-4">
          Privacy Guard (Rule R7): Your mobile number is hidden until you tap "Accept & Share Contact".
        </p>

        {enquiries.length === 0 ? (
          <p className="text-sm text-stone-400 italic py-4">No incoming enquiries yet. Buyers can send procurement requests from the marketplace.</p>
        ) : (
          <div className="divide-y divide-stone-100">
            {enquiries.map((enq) => (
              <div key={enq.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-stone-900 text-sm">{enq.buyerName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      enq.status === "ACCEPTED" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      {enq.status}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-1">
                    Interested in <span className="font-semibold text-stone-900">{enq.productName}</span>: {enq.quantity} kg at ₹{enq.offeredPrice}/kg
                  </p>
                  <p className="text-xs text-stone-500 italic mt-0.5">"{enq.message}"</p>
                </div>

                <div>
                  {enq.status === "ACCEPTED" ? (
                    <div className="flex items-center space-x-1.5 text-xs text-green-800 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
                      <CheckCircle className="w-4 h-4" />
                      <span>Contact Shared with Buyer ({enq.buyerPhone})</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAcceptEnquiry(enq.id)}
                      className="bg-green-700 hover:bg-green-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition active:scale-95 shadow-sm"
                    >
                      Accept & Share Contact
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Direct Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg text-stone-900">Add Inventory Item (English)</h3>
            <form onSubmit={handleAddDirect} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-600 block mb-1">Produce Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-600 block mb-1">Quantity</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-600 block mb-1">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="kg">kg</option>
                    <option value="quintal">quintal</option>
                    <option value="litre">litre</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-600 block mb-1">Expected Price (₹)</label>
                <input
                  type="number"
                  value={formData.expectedPrice}
                  onChange={(e) => setFormData({ ...formData, expectedPrice: Number(e.target.value) })}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="flex space-x-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-700 hover:bg-green-800 text-white font-bold py-2.5 rounded-lg text-sm transition"
                >
                  Save to Inventory
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold py-2.5 px-4 rounded-lg text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
