import React, { useState, useEffect } from "react";
import { MarketPrice, api } from "../services/api";
import { TrendingUp, ShieldAlert, CheckCircle, Calendar, Building2 } from "lucide-react";

export const MarketView: React.FC = () => {
  const [prices, setPrices] = useState<MarketPrice[]>([]);

  useEffect(() => {
    api.getMarketPrices().then((res) => setPrices(res.prices || []));
  }, []);

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm">
        <span className="text-xs font-bold text-green-700 uppercase tracking-wider bg-green-50 px-2.5 py-1 rounded-md border border-green-200">
          Stage 9: Market Intelligence
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-2">
          Verified Mandi & TRIFED Support Prices
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Direct ingestion from Agmarknet and Ministry of Tribal Affairs (TRIFED) Minimum Support Prices.
        </p>

        {/* Safety Rule R4 Alert Box */}
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-amber-700 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <span className="font-bold">Core Safety Rule R4: Never Fabricate Market Prices</span>
            <p>
              When a producer asks for prices of unlisted or seasonal forest produce (e.g. rare herbs or wild lac), our agents honestly answer "No verified price available" rather than hallucinating speculative numbers.
            </p>
          </div>
        </div>
      </div>

      {/* Price Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {prices.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm hover:shadow-md transition space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                  p.isSupportPrice
                    ? "bg-purple-100 text-purple-800 border border-purple-200"
                    : "bg-blue-100 text-blue-800 border border-blue-200"
                }`}>
                  {p.isSupportPrice ? "TRIFED Government MSP" : "Agmarknet Mandi"}
                </span>
                <h3 className="font-bold text-stone-900 text-lg mt-2">{p.commodity}</h3>
                <span className="text-xs text-stone-400">Tamil Name: {p.commodityTamil}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-stone-400 block">Modal / Benchmark Rate</span>
                <span className="text-2xl font-black text-green-700">₹{p.modalPrice}</span>
                <span className="text-xs text-stone-500 font-medium">/{p.unit}</span>
              </div>
            </div>

            <div className="bg-stone-50 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs border border-stone-100">
              <div>
                <span className="text-stone-400 block">Min Auction Rate:</span>
                <span className="font-bold text-stone-800">₹{p.minPrice}/{p.unit}</span>
              </div>
              <div>
                <span className="text-stone-400 block">Max Auction Rate:</span>
                <span className="font-bold text-stone-800">₹{p.maxPrice}/{p.unit}</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-stone-100 text-xs text-stone-500">
              <div className="flex items-center space-x-2">
                <Building2 className="w-3.5 h-3.5 text-stone-400" />
                <span>Market: <strong className="text-stone-700">{p.market}</strong></span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span>Recorded Date: <strong className="text-stone-700">{p.date}</strong></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
