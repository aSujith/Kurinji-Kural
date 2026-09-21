import {
  User,
  Product,
  MarketPrice,
  BuyerRequirement,
  Enquiry,
  PendingAction,
  AuditLog,
} from "@kurinji/shared";
import {
  SEED_USERS,
  SEED_PRODUCTS,
  SEED_MARKET_PRICES,
  SEED_BUYER_REQUIREMENTS,
} from "./seed.js";

class InMemoryStore {
  users: User[] = [...SEED_USERS];
  products: Product[] = [...SEED_PRODUCTS];
  marketPrices: MarketPrice[] = [...SEED_MARKET_PRICES];
  buyerRequirements: BuyerRequirement[] = [...SEED_BUYER_REQUIREMENTS];
  enquiries: Enquiry[] = [];
  pendingActions: PendingAction[] = [];
  auditLogs: AuditLog[] = [];

  logAudit(
    actorId: string,
    action: string,
    entityType: string,
    entityId: string,
    previousState: any,
    newState: any,
    confirmationMethod: "voice" | "tap" = "tap"
  ) {
    const entry: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      actorId,
      action,
      entityType,
      entityId,
      previousState,
      newState,
      confirmationMethod,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(entry);
    return entry;
  }
}

export const store = new InMemoryStore();
