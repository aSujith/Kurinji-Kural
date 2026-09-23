import { z } from "zod";

// --- Roles & Statuses ---
export type UserRole = "PRODUCER" | "BUYER" | "ADMIN";

export type ProductStatus =
  | "DRAFT"
  | "PENDING_CONFIRMATION"
  | "ACTIVE"
  | "PAUSED"
  | "SOLD"
  | "EXPIRED";

export type UnitType = "kg" | "quintal" | "litre" | "gram" | "piece" | "bunch";

export type ProductCategory =
  | "HONEY_BEE_PRODUCTS"
  | "SPICES_CONDIMENTS"
  | "MILLETS_GRAINS"
  | "MEDICINAL_PLANTS"
  | "FOREST_PRODUCE"
  | "HANDICRAFTS";

export type PendingActionStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED";

export type EnquiryStatus = "SENT" | "ACCEPTED" | "REJECTED" | "CANCELLED" | "EXPIRED";

// --- Voice & Conversation ---
export type ConversationState =
  | "IDLE"
  | "LISTENING"
  | "TRANSCRIBING"
  | "INTENT_DETECTED"
  | "COLLECTING_INFORMATION"
  | "AGENT_PROCESSING"
  | "CONFIRMATION_REQUIRED"
  | "CONFIRMED"
  | "CANCELLED"
  | "SAVED"
  | "RESPONSE_SPOKEN"
  | "ERROR";

export type IntentType =
  | "REGISTER_USER"
  | "ADD_PRODUCT"
  | "UPDATE_PRODUCT"
  | "DELETE_PRODUCT"
  | "CHECK_MARKET_PRICE"
  | "FIND_BUYERS"
  | "CREATE_PROMOTION"
  | "BUYER_SEARCH"
  | "CREATE_REQUIREMENT"
  | "SEND_ENQUIRY"
  | "SUPPORT"
  | "REPEAT"
  | "CANCEL"
  | "HELP"
  | "UNKNOWN";

export type AgentType =
  | "ROUTER"
  | "REGISTRATION"
  | "PRODUCT"
  | "MARKETING"
  | "MARKET_INTELLIGENCE"
  | "BUYER_MATCHING"
  | "SUPPORT";

// --- Tamil, Tanglish & English Yes/No Lexicon ---
export const TAMIL_YES_LEXICON = [
  "ஆம்", "ஆமாம்", "சரி", "சரிதான்", "உறுதி", "உறுதிப்படுத்து", "சேமி", "போடு", "அனுப்பு", "சரி செய்", "ஓகே",
  "aam", "aamaam", "sari", "sarithan", "urudhi", "seri", "semi", "kodu",
  "yes", "correct", "confirm", "save", "ok", "sure", "done"
];

export const TAMIL_NO_LEXICON = [
  "இல்லை", "வேண்டாம்", "வேணாம்", "தவறு", "மாற்று", "ரத்து செய்", "நிறுத்து",
  "illai", "illa", "vendam", "venaam", "thavaru", "maathu", "rathu",
  "no", "cancel", "wrong", "stop", "nope"
];

// --- Domain Entity Interfaces ---
export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  language: string;
  village?: string;
  district?: string;
  state?: string;
  producerType?: "FARMER" | "FOREST_COLLECTOR" | "SHG_MEMBER" | "ENTREPRENEUR";
  productsHandled?: string[];
  consent: {
    given: boolean;
    version: string;
    givenAt: string;
    method: "voice" | "tap";
    language: string;
  };
  createdAt: string;
}

export interface Product {
  id: string;
  producerId: string;
  producerName: string;
  name: string;
  nameTamil: string;
  category: ProductCategory;
  quantity: number;
  unit: UnitType;
  expectedPrice: number;
  quality: "Standard" | "Organic" | "Wild-Harvested" | "Grade-A";
  location: {
    village: string;
    district: string;
    state: string;
  };
  status: ProductStatus;
  images: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
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
  unit: UnitType;
  date: string;
  source: "Agmarknet" | "TRIFED MSP (Minor Forest Produce)";
  isSupportPrice: boolean;
}

export interface BuyerRequirement {
  id: string;
  buyerId: string;
  buyerName: string;
  commodity: string;
  commodityTamil: string;
  category: ProductCategory;
  quantity: number;
  unit: UnitType;
  targetPrice: number;
  location: string;
  status: "OPEN" | "FULFILLED" | "CLOSED";
  createdAt: string;
}

export interface MatchResult {
  id: string;
  productId: string;
  productName: string;
  requirementId: string;
  producerId: string;
  buyerId: string;
  buyerName: string;
  overallScore: number;
  breakdown: {
    productScore: number;
    quantityScore: number;
    locationScore: number;
    priceScore: number;
    qualityScore: number;
  };
  explanationTamil: string;
  explanationEnglish: string;
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
  status: EnquiryStatus;
  message?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PendingAction {
  id: string;
  userId: string;
  conversationId: string;
  type: "CREATE_PRODUCT" | "UPDATE_PRODUCT" | "SEND_ENQUIRY" | "UPDATE_PROFILE";
  payload: Record<string, any>;
  payloadHash: string;
  spokenSummaryTamil: string;
  spokenSummaryEnglish: string;
  status: PendingActionStatus;
  idempotencyKey: string;
  expiresAt: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  previousState?: any;
  newState?: any;
  confirmationMethod: "voice" | "tap";
  timestamp: string;
}

// --- Voice DTOs ---
export interface VoiceTurnRequest {
  transcript: string;
  language: "ta-IN" | "en-IN";
  conversationId?: string;
  userId?: string;
  isTapConfirm?: boolean;
  tapDecision?: "YES" | "NO";
}

export interface VoiceTurnResponse {
  conversationId: string;
  state: ConversationState;
  detectedIntent: IntentType;
  agent: AgentType;
  spokenResponseTamil: string;
  spokenResponseEnglish: string;
  pendingAction?: PendingAction;
  data?: any;
}


export function getDefaultCommodityImage(commodityName: string): string {
  const lower = (commodityName || "").toLowerCase();
  if (lower.includes("honey") || lower.includes("தேன்") || lower.includes("thean")) {
    return "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("turmeric") || lower.includes("மஞ்சள்") || lower.includes("manjal")) {
    return "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("pepper") || lower.includes("மிளகு") || lower.includes("milagu")) {
    return "https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("foxtail") || lower.includes("thinai") || lower.includes("தினை")) {
    return "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("little millet") || lower.includes("samai") || lower.includes("சாமை")) {
    return "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("tamarind") || lower.includes("puli") || lower.includes("புளி")) {
    return "https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("cardamom") || lower.includes("elakkai") || lower.includes("ஏலக்காய்")) {
    return "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("haritaki") || lower.includes("kadukkai") || lower.includes("கடுக்காய்") || lower.includes("herbal")) {
    return "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("bamboo") || lower.includes("basket") || lower.includes("கூடை") || lower.includes("craft")) {
    return "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("amla") || lower.includes("nellikai") || lower.includes("நெல்லிக்காய்")) {
    return "https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("wax") || lower.includes("மெழுகு")) {
    return "https://images.unsplash.com/photo-1608248597359-5f2571ce9793?w=600&auto=format&fit=crop&q=80";
  }
  return "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80";
}
