export interface Product {
  id: string;
  producerId: string;
  producerName: string;
  name: string;
  nameTamil?: string;
  category: string;
  quantity: number;
  unit: string;
  expectedPrice: number;
  quality: string;
  location: {
    village: string;
    district: string;
    state: string;
  };
  status: string;
  images: string[];
  createdAt: string;
}

export interface MarketPrice {
  id: string;
  commodity: string;
  commodityTamil: string;
  market: string;
  district: string;
  state: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: string;
  date: string;
  source: string;
  isSupportPrice: boolean;
}

export interface BuyerRequirement {
  id: string;
  buyerId: string;
  buyerName: string;
  commodity: string;
  commodityTamil?: string;
  category: string;
  quantity: number;
  unit: string;
  targetPrice: number;
  location: string;
  status: string;
  createdAt: string;
}

export interface Enquiry {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  producerId: string;
  producerName: string;
  producerPhone: string;
  productId: string;
  productName: string;
  quantity: number;
  offeredPrice: number;
  status: "SENT" | "ACCEPTED" | "REJECTED";
  message: string;
  createdAt: string;
}

export interface PendingAction {
  id: string;
  type: string;
  payload: any;
  spokenSummaryEnglish: string;
  spokenSummaryTamil: string;
  status: string;
}

export interface VoiceTurnResult {
  success: boolean;
  conversationId: string;
  state: string;
  detectedIntent: string;
  agent: string;
  spokenResponseEnglish: string;
  spokenResponseTamil: string;
  pendingAction?: PendingAction;
  data?: any;
}

const API_BASE = "/api/v1";

export const api = {
  getProducts: async (category?: string, search?: string) => {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (search) params.append("search", search);
    const res = await fetch(API_BASE + "/products?" + params.toString());
    return res.json();
  },
  createProduct: async (productData: any) => {
    const res = await fetch(API_BASE + "/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    });
    return res.json();
  },
  getMarketPrices: async () => {
    const res = await fetch(API_BASE + "/market-prices");
    return res.json();
  },
  getRequirements: async () => {
    const res = await fetch(API_BASE + "/requirements");
    return res.json();
  },
  createRequirement: async (reqData: any) => {
    const res = await fetch(API_BASE + "/requirements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqData),
    });
    return res.json();
  },
  getMatches: async () => {
    const res = await fetch(API_BASE + "/matches");
    return res.json();
  },
  getEnquiries: async () => {
    const res = await fetch(API_BASE + "/enquiries");
    return res.json();
  },
  createEnquiry: async (enquiryData: any) => {
    const res = await fetch(API_BASE + "/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(enquiryData),
    });
    return res.json();
  },
  acceptEnquiry: async (id: string) => {
    const res = await fetch(API_BASE + "/enquiries/" + id + "/accept", {
      method: "PATCH",
    });
    return res.json();
  },
  sendVoiceTurn: async (transcript: string, language: string = "en-IN", conversationId?: string): Promise<VoiceTurnResult> => {
    const res = await fetch(API_BASE + "/voice/turn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, language, conversationId }),
    });
    return res.json();
  },
  confirmPendingAction: async (pendingActionId: string, decision: "YES" | "NO", conversationId?: string): Promise<VoiceTurnResult> => {
    const res = await fetch(API_BASE + "/voice/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pendingActionId, decision, conversationId }),
    });
    return res.json();
  },
  getAdminAnalytics: async () => {
    const res = await fetch(API_BASE + "/admin/analytics");
    return res.json();
  },
};
