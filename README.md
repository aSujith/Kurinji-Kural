# Kurinji Kural (குறிஞ்சி குரல்)

**Voice-First Multilingual Multi-Agent Marketplace for Tribal Producers**

*A production-ready working model implementing the Google Agent Framework, Chirp 3 Speech Architecture, and strict Propose → Confirm Protocol.*

---

## Key Characteristics & Architecture

1. **English-First Application & Inventory**:
   - The platform inventory, database models, and web UI are maintained in **English**.
   - When a tribal producer or farmer speaks in **Tamil** (via voice or text), the **Multi-Agent Orchestrator** automatically extracts the commodity, quantity, unit, and expected rate, converts the product name to its standard English equivalent (e.g., *மலைத்தேன்* → *Wild Rock Honey*, *மலை மஞ்சள்* → *Organic Hill Turmeric*), and updates the inventory in English.

2. **Core Safety Rule R1 & R2: Propose → Confirm Protocol**:
   - Creating or updating inventory is strictly a two-phase action:
     `Propose` → `Read Back & Visual Preview` → `Explicit User Confirmation (Voice "ஆம்/Yes" or Green Button)` → `Commit`.
   - The LLM/Agent never touches the database directly and has no commit tool. Only orchestrator backend code executes commits upon verified confirmation.

3. **Core Safety Rule R4: Never Fabricate Market Prices**:
   - Mandi prices are ingested directly from **Agmarknet** and Ministry of Tribal Affairs (**TRIFED**) Minimum Support Prices (MSP).
   - If an unlisted or speculative item is queried, the agent explicitly and honestly states that no verified government price is available.

4. **Core Safety Rule R7: Producer Contact Privacy**:
   - Producer contact information is masked from wholesale buyers until the producer explicitly reviews and accepts a procurement enquiry.

5. **Observability & Rule R9**:
   - Every confirmed transaction, enquiry acceptance, and status change generates an immutable entry in the append-only **Audit Log Trail**.

---

## Monorepo Layout

```
d:/Kurinji Kural/
├── apps/
│   ├── api/                    # Express + TypeScript API & Agent Orchestrator
│   │   ├── src/
│   │   │   ├── agents/         # Orchestrator & Specialist Agents (Tamil->English translation)
│   │   │   ├── data/           # Domain store & realistic Minor Forest Produce seed data
│   │   │   ├── routes/         # Products, Market Prices, Matching, Enquiries, Voice API
│   │   │   └── server.ts       # Express server with health and graceful shutdown
│   │   └── package.json
│   └── web/                    # React + Vite + TypeScript Frontend
│       ├── src/
│       │   ├── components/     # Navbar, VoiceAssistantBar (Web Speech API & Audio output)
│       │   ├── pages/          # ProducerView, BuyerView, MarketView, AdminView
│       │   └── services/       # Typed API client
│       └── package.json
├── packages/
│   └── shared/                 # TypeScript models, enums, schemas, and Tamil Yes/No lexicon
├── tests/
│   └── integration_suite.mjs   # 13-point end-to-end integration test suite
├── package.json
└── pnpm-workspace.yaml
```

---

## Getting Started

### 1. Install Dependencies & Build
```bash
pnpm install
pnpm build
```

### 2. Run the Comprehensive Verification Test Suite
```bash
pnpm test
```

### 3. Start the Application Locally
To run both backend and frontend concurrently:
```bash
pnpm dev
```
- **Web UI**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)

---

## Testing the Voice Assistant (Tamil Speech → English Inventory)

1. Open [http://localhost:3000](http://localhost:3000) in your browser.
2. Click the **Voice Assistant** button (or the microphone icon).
3. Select **தமிழ் (Tamil)** or **English**.
4. You can speak into your microphone, type, or tap one of the quick presets:
   - Example 1: `20 கிலோ மலைத்தேன் விலை 500 ரூபாய்`
   - Example 2: `மலை மஞ்சள் 50 கிலோ விலை 170`
   - Example 3: `மஞ்சள் சந்தை விலை என்ன?`
   - Example 4: `வாங்குபவர்கள் யார்?`
5. Observe the **Propose → Confirm** dialog:
   - The AI displays the converted English commodity, quantity, and unit price.
   - Tap **Confirm & Save / ஆம் உறுதி** or speak *"Yes / ஆம்"*.
   - The item is committed and immediately appears in the active **English Produce Inventory** and the **Security Audit Trail**.
