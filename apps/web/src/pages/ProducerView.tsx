import React, { useState } from "react";
import { Product, Enquiry, api } from "../services/api";
import { ProductImage } from "../components/ProductImage";
import { Plus, Sparkles, CheckCircle, Package, PhoneCall, ShieldCheck, MapPin, Tag } from "lucide-react";

interface ProducerProps {
  products: Product[];
  enquiries: Enquiry[];
  onRefresh: () => void;
  onOpenVoice: () => void;
}

const CATEGORY_NAMES: Record<string, string> = {
  HONEY_BEE_PRODUCTS: "Honey & Bee Products (தேன் பொருட்கள்)",
  SPICES_CONDIMENTS: "Spices & Condiments (மலை வாசனை பொருட்கள்)",
  MILLETS_GRAINS: "Millets & Traditional Grains (பாரம்பரிய சிறுதானியங்கள்)",
  MEDICINAL_PLANTS: "Medicinal Herbs (நாட்டு மூலிகைகள்)",
  FOREST_PRODUCE: "Minor Forest Produce (சிறு வனப்பொருட்கள்)",
  HANDICRAFTS: "Tribal Handicrafts (பாரம்பரிய கைவினைப் பொருட்கள்)",
};

export const ProducerView: React.FC<ProducerProps> = ({ products, enquiries, onRefresh, onOpenVoice }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [marketingPitch, setMarketingPitch] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "Wild Rock Honey",
    nameTamil: "இயற்கை கொம்புத்தேன்",
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
      producerName: "Maruthan (Nilgiris Tribal Collective)",
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
            <span>Tribal Producer Portal (Tamil Nadu Forest Collectives)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            English Produce Inventory
          </h1>
          <p className="text-sm text-green-200 max-w-xl">
            Producers speak naturally in Tamil. Our multi-agent system extracts commodities, units, and rates, converts them to English, and manages this live inventory.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenVoice}
            className="bg-white hover:bg-green-50 text-green-900 font-bold px-5 py-3 rounded-xl shadow-lg transition flex items-center space-x-2 active:scale-95"
          >
            <span>🎤 Add via Voice (Tamil Speech)</span>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <ProductImage
                  src={item.images?.[0]}
                  alt={item.name}
                  name={item.name}
                  nameTamil={item.nameTamil}
                  category={item.category}
                  className="w-full h-48 object-cover"
                />

                <div className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-800">
                      {item.quality || "Organic"}
                    </span>
                    <span className="text-[11px] text-stone-400 font-mono">ID: {item.id}</span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-stone-900 text-lg leading-tight">{item.name}</h3>
                    {item.nameTamil && (
                      <div className="inline-flex items-center space-x-1 bg-green-50 text-green-800 border border-green-200 px-2 py-0.5 rounded text-xs font-semibold mt-1">
                        <span>🌱</span>
                        <span>{item.nameTamil}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-1 text-xs text-stone-500">
                    <Tag className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                    <span className="truncate">{CATEGORY_NAMES[item.category] || item.category}</span>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-sm">
                    <div>
                      <span className="text-[11px] text-stone-400 block font-medium">Available Quantity</span>
                      <span className="font-extrabold text-stone-800">{item.quantity} {item.unit}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-stone-400 block font-medium">Expected Price</span>
                      <span className="font-black text-green-700 text-lg">₹{item.expectedPrice}</span>
                      <span className="text-xs text-stone-500 font-medium">/{item.unit}</span>
                    </div>
                  </div>

                  <div className="text-xs text-stone-500 flex items-center space-x-1 pt-1 border-t border-stone-50">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                    <span>{item.location?.village}, {item.location?.district}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
                <span className="text-xs text-stone-600 font-medium truncate max-w-[150px]">{item.producerName}</span>
                <button
                  onClick={() => handleGeneratePitch(item)}
                  className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center space-x-1 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Pitch</span>
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
                <label className="text-xs font-semibold text-stone-600 block mb-1">Produce English Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-600 block mb-1">Tamil Traditional Name</label>
                <input
                  type="text"
                  value={formData.nameTamil}
                  onChange={(e) => setFormData({ ...formData, nameTamil: e.target.value })}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-600 block mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="HONEY_BEE_PRODUCTS">Honey & Bee Products</option>
                  <option value="SPICES_CONDIMENTS">Spices & Condiments</option>
                  <option value="MILLETS_GRAINS">Millets & Traditional Grains</option>
                  <option value="MEDICINAL_PLANTS">Medicinal Herbs</option>
                  <option value="FOREST_PRODUCE">Minor Forest Produce</option>
                  <option value="HANDICRAFTS">Tribal Handicrafts</option>
                </select>
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
                    <option value="piece">piece</option>
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
