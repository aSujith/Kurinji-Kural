import { Router } from "express";
import { store } from "../data/store.js";
import { orchestrator } from "../agents/orchestrator.js";
import { Product, Enquiry, MatchResult } from "@kurinji/shared";
import { v4 as uuidv4 } from "uuid";

export const apiRouter = Router();

// --- Health ---
apiRouter.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// --- Products (English Inventory) ---
apiRouter.get("/products", (req, res) => {
  const { category, search } = req.query;
  let items = store.products;

  if (category) {
    items = items.filter((p) => p.category === category);
  }
  if (search) {
    const q = String(search).toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.nameTamil.toLowerCase().includes(q) ||
        p.location.district.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, count: items.length, products: items });
});

apiRouter.post("/products", (req, res) => {
  const { name, category, quantity, unit, expectedPrice, location, quality, producerName } = req.body;
  const newProduct: Product = {
    id: `prd_${Date.now()}`,
    producerId: "usr_prod_1",
    producerName: producerName || "Maruthan (Nilgiris)",
    name: name || "Wild Forest Honey",
    nameTamil: "",
    category: category || "HONEY_BEE_PRODUCTS",
    quantity: Number(quantity) || 10,
    unit: unit || "kg",
    expectedPrice: Number(expectedPrice) || 450,
    quality: quality || "Wild-Harvested",
    location: location || { village: "Chellapuram", district: "Nilgiris", state: "Tamil Nadu" },
    status: "ACTIVE",
    images: ["https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop&q=60"],
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.products.unshift(newProduct);
  store.logAudit("usr_prod_1", "CREATE_PRODUCT_DIRECT", "Product", newProduct.id, null, newProduct, "tap");
  res.status(201).json({ success: true, product: newProduct });
});

apiRouter.patch("/products/:id", (req, res) => {
  const product = store.products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });

  const old = { ...product };
  Object.assign(product, req.body, { updatedAt: new Date().toISOString(), version: product.version + 1 });
  store.logAudit(product.producerId, "UPDATE_PRODUCT", "Product", product.id, old, product, "tap");
  res.json({ success: true, product });
});

// --- Market Prices (Agmarknet & TRIFED MSP) ---
apiRouter.get("/market-prices", (req, res) => {
  res.json({ success: true, count: store.marketPrices.length, prices: store.marketPrices });
});

// --- Buyer Requirements ---
apiRouter.get("/requirements", (req, res) => {
  res.json({ success: true, count: store.buyerRequirements.length, requirements: store.buyerRequirements });
});

apiRouter.post("/requirements", (req, res) => {
  const { commodity, category, quantity, unit, targetPrice, location } = req.body;
  const newReq = {
    id: `req_${Date.now()}`,
    buyerId: "usr_buyer_1",
    buyerName: "Sundaram Organic Spices & Honey Co.",
    commodity: commodity || "Wild Rock Honey",
    commodityTamil: "",
    category: category || "HONEY_BEE_PRODUCTS",
    quantity: Number(quantity) || 50,
    unit: unit || "kg",
    targetPrice: Number(targetPrice) || 500,
    location: location || "Chennai",
    status: "OPEN" as const,
    createdAt: new Date().toISOString(),
  };
  store.buyerRequirements.unshift(newReq);
  res.status(201).json({ success: true, requirement: newReq });
});

// --- Buyer Matching Engine (with Explainability) ---
apiRouter.get("/matches", (req, res) => {
  const matches: MatchResult[] = [];

  store.products.forEach((prod) => {
    store.buyerRequirements.forEach((req) => {
      // Calculate matching compatibility
      const categoryMatch = prod.category === req.category;
      if (categoryMatch) {
        const priceDiff = Math.abs(prod.expectedPrice - req.targetPrice);
        const priceScore = Math.max(0, 100 - priceDiff * 2);
        const qtyScore = Math.min(100, Math.round((prod.quantity / req.quantity) * 100));
        const overallScore = Math.round(priceScore * 0.5 + qtyScore * 0.5);

        matches.push({
          id: `match_${prod.id}_${req.id}`,
          productId: prod.id,
          productName: prod.name,
          requirementId: req.id,
          producerId: prod.producerId,
          buyerId: req.buyerId,
          buyerName: req.buyerName,
          overallScore,
          breakdown: {
            productScore: 100,
            quantityScore: qtyScore,
            locationScore: 85,
            priceScore,
            qualityScore: 90,
          },
          explanationEnglish: `High compatibility (${overallScore}%): Product matches perfectly. Quantity fulfills ${qtyScore}% of demand. Expected price ₹${prod.expectedPrice} is close to buyer budget ₹${req.targetPrice}.`,
          explanationTamil: `பொருத்தம் ${overallScore}%: பொருள் மற்றும் தரம் மிகச்சரியாக பொருந்துகிறது. விலை மற்றும் அளவு பொருத்தம் சிறப்பானது.`,
        });
      }
    });
  });

  res.json({ success: true, count: matches.length, matches });
});

// --- Enquiries (with Privacy Protection - Master Rule R7) ---
apiRouter.get("/enquiries", (req, res) => {
  // Hide producer contact unless status is ACCEPTED
  const sanitized = store.enquiries.map((e) => ({
    ...e,
    producerPhone: e.status === "ACCEPTED" ? e.producerPhone : "Masked (Revealed upon acceptance)",
  }));
  res.json({ success: true, enquiries: sanitized });
});

apiRouter.post("/enquiries", (req, res) => {
  const { productId, buyerName, buyerPhone, quantity, offeredPrice, message } = req.body;
  const product = store.products.find((p) => p.id === productId);
  if (!product) return res.status(404).json({ error: "Product not found" });

  const enquiry: Enquiry = {
    id: `enq_${Date.now()}`,
    buyerId: "usr_buyer_1",
    buyerName: buyerName || "Sundaram Organic Spices & Honey Co.",
    buyerPhone: buyerPhone || "9876543220",
    producerId: product.producerId,
    producerName: product.producerName,
    producerPhone: "9876543210", // Real number stored, but masked in read API until accepted
    productId: product.id,
    productName: product.name,
    quantity: Number(quantity) || product.quantity,
    offeredPrice: Number(offeredPrice) || product.expectedPrice,
    status: "SENT",
    message: message || "We are interested in procuring this batch for our wholesale distribution.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.enquiries.unshift(enquiry);
  store.logAudit(enquiry.buyerId, "SEND_ENQUIRY", "Enquiry", enquiry.id, null, enquiry, "tap");
  res.status(201).json({ success: true, enquiry });
});

apiRouter.patch("/enquiries/:id/accept", (req, res) => {
  const enquiry = store.enquiries.find((e) => e.id === req.params.id);
  if (!enquiry) return res.status(404).json({ error: "Enquiry not found" });

  enquiry.status = "ACCEPTED";
  enquiry.updatedAt = new Date().toISOString();
  store.logAudit(enquiry.producerId, "ACCEPT_ENQUIRY_REVEAL_PHONE", "Enquiry", enquiry.id, null, enquiry, "tap");
  res.json({ success: true, enquiry });
});

// --- Voice & AI Turn (Multi-Agent Dispatch) ---
apiRouter.post("/voice/turn", (req, res) => {
  const { transcript, language, conversationId, userId } = req.body;
  if (!transcript) return res.status(400).json({ error: "Transcript is required" });

  const response = orchestrator.handleTurn({
    transcript,
    language: language || "en-IN",
    conversationId,
    userId,
  });

  res.json({ success: true, ...response });
});

// --- Voice & Tap Confirmation (PendingAction Protocol) ---
apiRouter.post("/voice/confirm", (req, res) => {
  const { pendingActionId, decision, conversationId, userId } = req.body;
  const pending = store.pendingActions.find((pa) => pa.id === pendingActionId);
  if (!pending) return res.status(404).json({ error: "Pending action not found or expired" });

  const response = orchestrator.handleTurn({
    transcript: decision === "YES" ? "ஆம் உறுதி" : "இல்லை வேண்டாம்",
    language: "ta-IN",
    conversationId: conversationId || pending.conversationId,
    userId: userId || pending.userId,
    isTapConfirm: true,
    tapDecision: decision,
  });

  res.json({ success: true, ...response });
});

// --- Admin Analytics & Audit Logs ---
apiRouter.get("/admin/analytics", (req, res) => {
  res.json({
    success: true,
    stats: {
      totalProducts: store.products.length,
      totalProducers: store.users.filter((u) => u.role === "PRODUCER").length,
      totalBuyers: store.users.filter((u) => u.role === "BUYER").length,
      totalRequirements: store.buyerRequirements.length,
      totalEnquiries: store.enquiries.length,
      totalMarketCommodities: store.marketPrices.length,
      recentAuditLogs: store.auditLogs.slice(0, 10),
    },
  });
});
