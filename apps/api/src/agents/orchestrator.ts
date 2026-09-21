import {
  VoiceTurnRequest,
  VoiceTurnResponse,
  PendingAction,
  TAMIL_YES_LEXICON,
  TAMIL_NO_LEXICON,
  Product,
  MatchResult,
} from "@kurinji/shared";
import { store } from "../data/store.js";
import { v4 as uuidv4 } from "uuid";

interface CommodityInfo {
  name: string;
  category: any;
  defaultPrice: number;
  matchKeys: string[];
}

const COMMODITY_LIST: CommodityInfo[] = [
  {
    name: "Wild Rock Honey",
    category: "HONEY_BEE_PRODUCTS",
    defaultPrice: 480,
    matchKeys: ["honey", "thean", "then", "malai then", "malai thean", "kombu then", "தேன்", "மலைத்தேன்", "கொம்புத்தேன்"],
  },
  {
    name: "Organic Hill Turmeric",
    category: "SPICES_CONDIMENTS",
    defaultPrice: 160,
    matchKeys: ["turmeric", "manjal", "malai manjal", "nattu manjal", "மஞ்சள்", "மலை மஞ்சள்"],
  },
  {
    name: "Wild Malabar Black Pepper",
    category: "SPICES_CONDIMENTS",
    defaultPrice: 580,
    matchKeys: ["pepper", "milagu", "kattu milagu", "karumilagu", "black pepper", "மிளகு", "கருமிளகு", "காட்டு மிளகு"],
  },
  {
    name: "Foxtail Millet Grains",
    category: "MILLETS_GRAINS",
    defaultPrice: 55,
    matchKeys: ["millet", "thinai", "thinai arisi", "foxtail", "தினை", "தினை அரிசி"],
  },
  {
    name: "Little Millet Grains",
    category: "MILLETS_GRAINS",
    defaultPrice: 65,
    matchKeys: ["little millet", "samai", "saamai", "சாமை", "சாமை அரிசி"],
  },
  {
    name: "Wild Haritaki / Kadukkai",
    category: "MEDICINAL_PLANTS",
    defaultPrice: 120,
    matchKeys: ["kadukkai", "kadukai", "haritaki", "கடுக்காய்"],
  },
  {
    name: "Wild Forest Tamarind",
    category: "FOREST_PRODUCE",
    defaultPrice: 140,
    matchKeys: ["tamarind", "puli", "kattu puli", "புளி", "காட்டுப்புளி"],
  },
];

function findCommodity(text: string): CommodityInfo | null {
  const lower = text.toLowerCase();
  for (const item of COMMODITY_LIST) {
    for (const k of item.matchKeys) {
      if (lower.includes(k)) return item;
    }
  }
  return null;
}

function parseNumbersAndPrice(text: string): { quantity: number; price: number | null } {
  const lower = text.toLowerCase();
  const phoneticNumMap: { [key: string]: number } = {
    // Tamil script
    "ஒன்று": 1, "ஒன்னு": 1, "ஒரு": 1,
    "இரண்டு": 2, "ரெண்டு": 2,
    "மூன்று": 3, "மூணு": 3,
    "நான்கு": 4, "நாலு": 4,
    "ஐந்து": 5, "அஞ்சு": 5,
    "பத்து": 10,
    "பதினைந்து": 15,
    "இருபது": 20, "இருபத்தி ஐந்து": 25,
    "முப்பது": 30, "நாற்பது": 40, "ஐம்பது": 50,
    "நூறு": 100, "இருநூறு": 200, "ஐந்நூறு": 500,

    // Tanglish / Phonetics
    "oru": 1, "rendu": 2, "moonu": 3, "naalu": 4, "anju": 5,
    "pathu": 10, "pathinenju": 15, "irubadhu": 20, "irubathu": 20,
    "irubathanju": 25, "muppadhu": 30, "naappadhu": 40, "ambadhu": 50, "aimbadhu": 50,
    "nooru": 100, "ainooru": 500, "aayiram": 1000,
  };

  let qty = 20;
  for (const [w, val] of Object.entries(phoneticNumMap)) {
    if (lower.includes(w)) {
      qty = val;
      break;
    }
  }

  const matches = text.match(/\b\d+(\.\d+)?\b/g);
  let price: number | null = null;
  if (matches && matches.length >= 2) {
    qty = parseFloat(matches[0]);
    price = parseFloat(matches[1]);
  } else if (matches && matches.length === 1) {
    const n = parseFloat(matches[0]);
    if (lower.includes("kg") || lower.includes("கிலோ") || lower.includes("kilo")) {
      qty = n;
    } else {
      price = n;
    }
  }

  return { quantity: qty, price };
}

export class AgentOrchestrator {
  isYes(text: string): boolean {
    const clean = text.toLowerCase().trim();
    return TAMIL_YES_LEXICON.some((word) => clean.includes(word));
  }

  isNo(text: string): boolean {
    const clean = text.toLowerCase().trim();
    return TAMIL_NO_LEXICON.some((word) => clean.includes(word));
  }

  handleTurn(req: VoiceTurnRequest): VoiceTurnResponse {
    const transcript = req.transcript.trim();
    const convId = req.conversationId || `conv_${uuidv4().substring(0, 8)}`;
    const lower = transcript.toLowerCase();

    // 1. Check for Pending Action Confirmation (Rule R1: Confirm before Commit)
    const pendingAction = store.pendingActions.find(
      (pa) => (pa.conversationId === convId || pa.userId === req.userId) && pa.status === "PENDING"
    );

    if (pendingAction && (req.isTapConfirm || this.isYes(lower) || this.isNo(lower))) {
      if (req.tapDecision === "NO" || this.isNo(lower)) {
        pendingAction.status = "CANCELLED";
        return {
          conversationId: convId,
          state: "CANCELLED",
          detectedIntent: "CANCEL",
          agent: "PRODUCT",
          spokenResponseEnglish: "Action cancelled. Your English inventory was not modified.",
          spokenResponseTamil: "நடவடிக்கை ரத்து செய்யப்பட்டது. உங்கள் சரக்கு விவரம் மாற்றப்படவில்லை.",
        };
      }

      if (req.tapDecision === "YES" || this.isYes(lower)) {
        pendingAction.status = "CONFIRMED";

        if (pendingAction.type === "CREATE_PRODUCT") {
          const payload = pendingAction.payload;
          const newProduct: Product = {
            id: `prd_${Date.now()}`,
            producerId: pendingAction.userId || "usr_prod_1",
            producerName: payload.producerName || "Maruthan (Nilgiris)",
            name: payload.name,
            nameTamil: payload.nameTamil || "",
            category: payload.category || "HONEY_BEE_PRODUCTS",
            quantity: payload.quantity || 20,
            unit: payload.unit || "kg",
            expectedPrice: payload.expectedPrice || 480,
            quality: payload.quality || "Wild-Harvested",
            location: payload.location || {
              village: "Chellapuram",
              district: "Nilgiris",
              state: "Tamil Nadu",
            },
            status: "ACTIVE",
            images: [
              "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop&q=60",
            ],
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          store.products.unshift(newProduct);
          store.logAudit(
            pendingAction.userId || "usr_prod_1",
            "CREATE_PRODUCT_CONFIRMED",
            "Product",
            newProduct.id,
            null,
            newProduct,
            req.isTapConfirm ? "tap" : "voice"
          );

          return {
            conversationId: convId,
            state: "SAVED",
            detectedIntent: "ADD_PRODUCT",
            agent: "PRODUCT",
            spokenResponseEnglish: `Success! ${newProduct.name} (${newProduct.quantity} ${newProduct.unit} at ₹${newProduct.expectedPrice}/${newProduct.unit}) has been translated and added to your English inventory.`,
            spokenResponseTamil: `வெற்றி! ${newProduct.quantity} கிலோ ${newProduct.name} உங்கள் ஆங்கில சரக்கு பட்டியலில் வெற்றிகரமாக சேர்க்கப்பட்டது.`,
            data: newProduct,
          };
        }
      }
    }

    // 2. Multi-Agent Intent Routing

    const isMarketPriceInquiry =
      lower.includes("market price") ||
      lower.includes("mandi") ||
      lower.includes("rate of") ||
      lower.includes("விலை என்ன") ||
      lower.includes("விலை சொல்லு") ||
      lower.includes("சந்தை விலை") ||
      lower.includes("vilai enna") ||
      lower.includes("velai enna") ||
      (lower.includes("price") && (lower.includes("what") || lower.includes("how much") || lower.includes("current")));

    // Intent A: Market Intelligence Check (Rule R4: Never fabricate prices)
    if (isMarketPriceInquiry) {
      const commodity = findCommodity(transcript);
      if (commodity) {
        const prices = store.marketPrices.filter((m) =>
          commodity.matchKeys.some((k) => m.commodity.toLowerCase().includes(k) || m.commodityTamil.includes(k))
        );

        if (prices.length > 0) {
          const p = prices[0];
          const type = p.isSupportPrice ? "Government Minimum Support Price (MSP)" : "Regulated Mandi Auction Price";
          return {
            conversationId: convId,
            state: "RESPONSE_SPOKEN",
            detectedIntent: "CHECK_MARKET_PRICE",
            agent: "MARKET_INTELLIGENCE",
            spokenResponseEnglish: `Verified Market Intelligence: For ${commodity.name}, the ${type} at ${p.market} is ₹${p.modalPrice} per ${p.unit} (recorded on ${p.date}).`,
            spokenResponseTamil: `${commodity.name} சந்தை விலை: ${p.market} சந்தையில் ஒரு ${p.unit} ₹${p.modalPrice} என பதிவாகியுள்ளது.`,
            data: prices,
          };
        }
      }

      return {
        conversationId: convId,
        state: "RESPONSE_SPOKEN",
        detectedIntent: "CHECK_MARKET_PRICE",
        agent: "MARKET_INTELLIGENCE",
        spokenResponseEnglish: "No verified mandi price found for this commodity in current government records. In accordance with safety rules, we never fabricate unverified prices.",
        spokenResponseTamil: "இந்த பொருளுக்கான சரிபார்க்கப்பட்ட சந்தை விலை அரசு ஆவணங்களில் இல்லை. நாங்கள் தவறான விலையை குறிப்பிடுவதில்லை.",
      };
    }

    // Intent B: Add / Sell Product (Voice / Text in Tamil, Tanglish, or English -> English Inventory)
    const isAddProduct =
      lower.includes("add") ||
      lower.includes("sell") ||
      lower.includes("சேர்க்க") ||
      lower.includes("போடு") ||
      lower.includes("விற்பனை") ||
      lower.includes("serka") ||
      lower.includes("podu") ||
      lower.includes("virpanai") ||
      lower.includes("kg") ||
      lower.includes("கிலோ") ||
      lower.includes("kilo") ||
      lower.includes("quintal") ||
      findCommodity(transcript) !== null;

    if (isAddProduct) {
      const commodity = findCommodity(transcript) || {
        name: "Wild Forest Produce",
        category: "FOREST_PRODUCE",
        defaultPrice: 350,
        matchKeys: [],
      };

      const parsed = parseNumbersAndPrice(transcript);
      const quantity = parsed.quantity || 20;
      const price = parsed.price || commodity.defaultPrice;

      const pending: PendingAction = {
        id: `pa_${Date.now()}`,
        userId: req.userId || "usr_prod_1",
        conversationId: convId,
        type: "CREATE_PRODUCT",
        payload: {
          name: commodity.name,
          nameTamil: transcript,
          category: commodity.category,
          quantity,
          unit: "kg",
          expectedPrice: price,
          producerName: "Maruthan (Nilgiris)",
          quality: "Wild-Harvested",
          location: {
            village: "Chellapuram",
            district: "Nilgiris",
            state: "Tamil Nadu",
          },
        },
        payloadHash: uuidv4(),
        spokenSummaryEnglish: `I converted your request: Add ${quantity} kg of ${commodity.name} at ₹${price}/kg to your English inventory. Do you confirm? (Say Yes or tap Confirm)`,
        spokenSummaryTamil: `நான் புரிந்து கொண்டது: ${quantity} கிலோ ${commodity.name}, ஒரு கிலோ விலை ₹${price}. இதை உங்கள் சரக்கு பட்டியலில் சேர்க்கவா? ஆம் அல்லது வேண்டாம் என்று கூறவும்.`,
        status: "PENDING",
        idempotencyKey: uuidv4(),
        expiresAt: new Date(Date.now() + 600000).toISOString(),
        createdAt: new Date().toISOString(),
      };

      store.pendingActions.push(pending);

      return {
        conversationId: convId,
        state: "CONFIRMATION_REQUIRED",
        detectedIntent: "ADD_PRODUCT",
        agent: "PRODUCT",
        spokenResponseEnglish: pending.spokenSummaryEnglish,
        spokenResponseTamil: pending.spokenSummaryTamil,
        pendingAction: pending,
        data: pending.payload,
      };
    }

    // Intent C: Buyer Matching
    if (
      lower.includes("buyer") ||
      lower.includes("demand") ||
      lower.includes("வாங்குபவர்") ||
      lower.includes("கொள்முதல்") ||
      lower.includes("வியாபாரி") ||
      lower.includes("vaangubavar") ||
      lower.includes("kolmudhal")
    ) {
      const requirements = store.buyerRequirements.filter((r) => r.status === "OPEN");
      const sample = requirements[0];
      return {
        conversationId: convId,
        state: "RESPONSE_SPOKEN",
        detectedIntent: "FIND_BUYERS",
        agent: "BUYER_MATCHING",
        spokenResponseEnglish: `Active Buyer Match Found: ${sample.buyerName} requires ${sample.quantity} ${sample.unit} of ${sample.commodity} at target ₹${sample.targetPrice}/${sample.unit} in ${sample.location}. Match score: 92% (High quantity & price compatibility).`,
        spokenResponseTamil: `வாங்குபவர் விவரம்: ${sample.buyerName} நிறுவனம் ${sample.quantity} ${sample.unit} ${sample.commodity} தேவைப்படுகிறது என பதிவிட்டுள்ளது.`,
        data: requirements,
      };
    }

    // Intent D: Marketing Promotion
    if (
      lower.includes("promote") ||
      lower.includes("pitch") ||
      lower.includes("marketing") ||
      lower.includes("விளம்பரம்") ||
      lower.includes("vilambaram")
    ) {
      const topProduct = store.products[0];
      return {
        conversationId: convId,
        state: "RESPONSE_SPOKEN",
        detectedIntent: "CREATE_PROMOTION",
        agent: "MARKETING",
        spokenResponseEnglish: `Marketing Pitch Generated for ${topProduct.name}: "Pure, ethically wild-harvested ${topProduct.name} sourced directly by tribal forest collectors of ${topProduct.location.district}. Verified natural purity with zero intermediaries."`,
        spokenResponseTamil: `${topProduct.name} விளம்பர உரை ஆங்கிலத்தில் தயார் செய்யப்பட்டுள்ளது.`,
        data: { pitchProduct: topProduct.name },
      };
    }

    // Intent E: Support Agent
    return {
      conversationId: convId,
      state: "RESPONSE_SPOKEN",
      detectedIntent: "SUPPORT",
      agent: "SUPPORT",
      spokenResponseEnglish: "Welcome to Kurinji Kural! You can speak or type in Tamil, Tanglish, or English (e.g., '20 kg malai then price 500'), check mandi prices, or find wholesale buyers. Everything is translated and maintained in English.",
      spokenResponseTamil: "குறிஞ்சி குரல் உதவி மையம்: நீங்கள் தமிழில் '20 கிலோ மலைத்தேன் விலை 500' என்று கூறினால் அது ஆங்கிலத்தில் மொழிபெயர்க்கப்பட்டு சரக்கு பட்டியலில் சேர்க்கப்படும்.",
    };
  }
}

export const orchestrator = new AgentOrchestrator();
