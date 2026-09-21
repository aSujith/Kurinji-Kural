# Kurinji Kural — Stack, Architecture, Credits Plan & Tools

*Voice-first multi-agent marketplace for tribal producers.*
*Facts checked on 19 Sep 2026. Google renames products and changes prices often, so re-check anything marked (verify) before you commit budget.*

---

## 1. Read this first: seven things that will affect your plan

1. **Your $300 has a clock.** The trial credit lasts 90 days or until it is spent, whichever comes first. If it ends, the trial billing account closes and its projects stop. Check *Billing → Credits* for your actual expiry date. Upgrading to a paid account keeps the unused credit until day 90 and keeps your resources alive, but anything above the credit is then billed to your card, so set budget alerts before you upgrade. Free-trial accounts also cannot use GPUs, Marketplace, or third-party generative-AI models such as Claude on Vertex. Reports also say quota-increase requests are blocked, so plan for default quotas.
2. **Use Vertex AI with a service account, not an AI Studio API key.** The trial credit is reported not to cover the Gemini API in AI Studio. Vertex AI (ADC or service-account auth) is the route your credits pay for.
3. **Names changed.** Vertex AI is now labelled **Gemini Enterprise Agent Platform** in the console and docs. Agent Engine appears as **Agent Runtime** on the pricing pages. The services are the same, so search the docs under either name.
4. **Tamil speech is your biggest technical risk.**
   - Google Cloud Speech-to-Text **Chirp 3** supports Tamil (`ta-IN`) with streaming, but Tamil is listed as **Preview**, not GA.
   - Chirp 3 is GA in the `us` and `eu` multi-regions. India regions have been listed as Preview (verify with the locations API).
   - **Chirp 3 HD text-to-speech** has Tamil, but it is not offered in an India region and is not regionalised. Audio will leave India.
   - No mainstream ASR covers tribal languages (Irula, Kurumba, Toda and others). Start Tamil-first and collect consented audio for later.
   - Mitigation: provider adapters, a **Stage 0 bake-off** (Google vs Sarvam on real speaker audio), read-back confirmation, and speech adaptation for product names.
5. **Models and prices churn.** Gemini 2.5 Flash-Lite retires on 16 Oct 2026. The Flash 3.6 / 3.7 / 3.8 introductory price ($0.75 in / $3.75 out per 1M tokens) doubles on 1 Jan 2027. Never hard-code model IDs. Read them from config.
6. **The free Gemini CLI is gone.** Since 18 Jun 2026, Gemini CLI and Code Assist IDE extensions no longer serve free or individual accounts. Google's replacement is **Antigravity** (IDE and CLI).
7. **"No verified price" is a valid answer.** Agmarknet (mandi prices) covers regulated-market commodities. Expect gaps for forest produce such as honey and lac. Your "never fabricate a price" rule will trigger often, and that is correct behaviour.

---

## 2. Recommended stack

| Layer | Choice | Why | Swap-in (via adapter) |
|---|---|---|---|
| Web app | React + TypeScript + Vite **PWA**, Tailwind, shadcn/ui (Radix), TanStack Query, Zustand, React Router, i18next, Recharts (admin) | Installable on low-end Android, offline-tolerant shell, accessible components, Tamil UI strings | — |
| Hosting (web) | Firebase Hosting (static SPA + CDN) | Free tier, global CDN, no server to scale | Cloud Storage + Cloud CDN |
| API | Node.js LTS, Express, TypeScript (strict), Zod, Pino, Helmet, rate-limiter-flexible | Matches your MERN requirement. The bottleneck is AI latency, not Express | Fastify |
| Realtime voice | Socket.IO (binary events) with Redis adapter, in a **separate `voice-gateway` service** | Independent scaling for long-lived sockets, reconnection built in | raw `ws` |
| Agents | **Google ADK for TypeScript** on Gemini via Vertex AI, in a separate `agent-service` | ADK is available in TS, keeps one language. Multi-agent, tools, MCP and eval are built in | ADK Python service (same HTTP contract) |
| LLMs | Gemini **Flash-tier** for agents and extraction, **Flash-Lite-tier** for routing, yes/no fallback and support | Cheap and fast enough for voice turns | Claude on Vertex (after upgrading billing), others |
| ASR | Cloud Speech-to-Text v2 **Chirp 3**, `ta-IN`, streaming | Uses your GCP credits | Sarvam **Saaras v3** (India-resident), Bhashini, AI4Bharat models |
| TTS | Cloud Text-to-Speech **Chirp 3 HD**, `ta-IN`, streaming (OGG_OPUS) | Uses your GCP credits, low latency | Sarvam **Bulbul v3**, Bhashini |
| Embeddings | `gemini-embedding-001` (GA, 100+ languages) or newer `gemini-embedding-2` | Tamil and English product-name matching | — |
| Database | **MongoDB Atlas** (M0 for dev, then a paid Flex/M10+), Mongoose | Your MERN choice. Atlas has a GCP Mumbai region | Firestore, Postgres (not recommended now) |
| Vector store | **Atlas Vector Search** (same DB) behind `VectorStoreProvider` | One less system to run | Vertex AI Vector Search |
| Cache / sessions / queue | **Redis**: Upstash free tier in dev, Memorystore in production. BullMQ on top | Conversation state, rate limits, Socket.IO adapter, job queue | Pub/Sub + Cloud Tasks |
| Files | Cloud Storage with signed URLs and lifecycle rules | Images, raw audio (short retention), pre-generated TTS phrases | — |
| Compute | **Cloud Run**, region `asia-south1` (Mumbai) | Autoscaling, scale-to-zero, WebSocket support | GKE later if you need very long-lived sockets |
| Jobs | Cloud Run jobs + Cloud Scheduler | Daily market-price sync, embeddings, rollups | — |
| Auth | Phone OTP behind an `OtpProvider` adapter. JWT access token plus rotating refresh token | Producers have phones, not email. Dev OTP is logged to console | Firebase Auth phone, MSG91, Twilio Verify |
| CI/CD | GitHub Actions, Workload Identity Federation, Artifact Registry, Cloud Run | No service-account key files | Cloud Build |
| Observability | Pino JSON logs, OpenTelemetry, Cloud Logging, Trace and Monitoring | Per-stage latency dashboards | Sentry (free tier) |
| Secrets | Secret Manager, service accounts, ADC | Nothing in the client, nothing in git | — |

**SMS OTP in India** needs DLT registration with local providers. It can take days, so start early. For low-literacy users, plan an **assisted-onboarding** path where an SHG coordinator registers producers.

---

## 3. Architecture

```
 Producer phone (PWA, Tamil UI)
   mic -> AudioWorklet (16 kHz PCM or Opus) --WSS--+
   speaker <- Opus audio chunks <------------------+
                                                   v
 Firebase Hosting (SPA)         Cloud Run: voice-gateway (Socket.IO)
                                  |- streaming STT (Chirp 3, ta-IN) --> Cloud Speech-to-Text v2
                                  |- sentence-chunked TTS ------------> Cloud Text-to-Speech (Chirp 3 HD)
                                  v
                         Cloud Run: agent-service (ADK)  --> Vertex AI: Gemini Flash / Flash-Lite, embeddings
                           Orchestrator -> 6 agents
                                  | tools = authenticated HTTP calls
                                  v
 React SPA --REST/JWT--> Cloud Run: api (Express)
                           validation, RBAC, propose/confirm, audit
                                  v
     MongoDB Atlas (Mumbai) | Redis (state, limits, queue, cache) | Cloud Storage
                                  ^
                         Cloud Run job/worker <-- Cloud Scheduler (daily market-price sync)
```

**Build order:** Stages 1–5 need only `web` and `api` (plus shared packages). `voice-gateway` arrives in Stage 6, `agent-service` in Stages 7–8, `worker` in Stage 9. You never carry more services than the current stage needs.

**Why split services?** Voice sockets are long-lived and memory-bound. Agent calls are I/O-bound and wait on Gemini. REST is short and bursty. Cloud Run scales each one on its own signal.

---

## 4. Multi-user design: what makes it hold up under concurrent users

1. **Stateless services.** Conversation state, pending confirmations, rate-limit counters and the Socket.IO adapter live in Redis. Any instance can serve any user.
2. **Cloud Run starting points** (load-test before trusting them):

   | Service | Concurrency | Other settings |
   |---|---|---|
   | api | 80 | 1 vCPU, 512 MiB–1 GiB, min 0 (1 for demos), max about 10 |
   | voice-gateway | about 50 sockets, raise after measuring (Cloud Run allows up to 1000) | request timeout 3600 s, session affinity on, **no end-to-end HTTP/2**, min 1 during demos, max about 20 |
   | agent-service | 20–40 | 1 vCPU, 1 GiB, streaming (SSE) timeout, max about 20 |

   WebSocket connections end at the request timeout and session affinity is best-effort. The client must **auto-reconnect and resume** with a conversation ID and last-event ID.
3. **Back-pressure to Vertex.** Use a per-instance concurrency limiter plus a Redis token bucket. On 429 or `RESOURCE_EXHAUSTED`, retry with exponential backoff and jitter, fall back from Flash to Flash-Lite, and finally play a pre-recorded "please wait a moment" prompt.
4. **Database pool arithmetic.** Total connections = max instances × `maxPoolSize`, summed over services. Example: 10 instances × pool 10 = 100 per service. M0 allows 500 connections in total. M10 allows about 1,500 per node. Cap `max-instances` so you never exhaust the pool.
5. **Mongo hygiene.**
   - Compound indexes ordered equality → sort → range.
   - `lean()` reads, cursor pagination, projections.
   - **Never embed unbounded arrays.** Store conversation turns in their own collection, because a growing `messages[]` will eventually hit the 16 MB document limit.
   - TTL indexes on raw audio, sessions and pending actions.
   - Optimistic concurrency (`versionKey`) on products.
6. **Stream everything.** STT streams to the agent. LLM tokens stream to a sentence chunker. Each sentence streams to TTS. Audio chunks stream to the phone.
7. **Create clients once.** STT, TTS and Vertex clients are singletons. Rebuilding gRPC clients per request is a classic latency killer.
8. **Cache aggressively.**
   - Pre-generate common TTS phrases (greetings, confirmations, error prompts) into Cloud Storage. It saves cost and latency.
   - Cache market-price answers in Redis until the next data sync.
   - Rely on Gemini context caching for the long system prompt and tool schemas.
9. **Idempotency.** `Idempotency-Key` on every confirm/commit call. Bind each pending action to a payload hash.
10. **Graceful degradation ladder.** Full streaming voice → push-to-talk upload → big-button guided screens (no LLM) → "we'll call you back" queue.
11. **Heavy work goes to the queue.** Matching, embeddings, imports and analytics rollups run in workers, triggered by events. Never do them inside a voice turn.
12. **Load test with mock providers first.** k6 (supports WebSockets) against mock ASR/TTS/LLM with realistic fixed latencies. Then run one small soak test against the real providers. This proves the infrastructure without spending credits.

**Latency targets (validate, don't assume):** end of speech → final transcript 0.4–0.8 s; → first agent token 0.5–1.0 s; → first audio 0.3–0.6 s. Perceived p50 of about 2 s.

---

## 5. Voice pipeline details worth using

- **Endpointing:** Chirp 3 offers `SHORT` and `SUPERSHORT` sensitivity. Use `SHORT` normally and `SUPERSHORT` when the state machine is waiting for yes/no.
- **Speech adaptation:** up to 1,000 phrases. Keep it small and focused on product names such as honey, turmeric, millets and pepper, plus place names.
- **Denoiser:** turn it on for outdoor audio.
- **TTS custom pronunciations:** fix product and village names.
- **Barge-in:** stop playback as soon as the user starts speaking.
- **Compression:** send Opus, not raw PCM, on weak networks. Keep a push-to-talk upload fallback.
- **Free dev fallback:** a `BrowserSpeechProvider` using the browser's Web Speech API (no SLA, may send audio to Google).
- **Gemini Live API** (native audio, WebSocket) exists. Treat it as an experiment: check that it supports Tamil, and note it gives you less control over the transcript that your confirmation and audit rules depend on.

---

## 6. Agent design on Vertex AI

**Use:** ADK (code), Vertex AI Studio / Agent Studio (prompt prototyping), ADK eval plus the Gen AI evaluation service (quality), Model Armor (optional prompt-injection and safety layer, verify cost). **Deploy agents to Cloud Run first.** Agent Runtime (managed sessions and Memory Bank, billed per vCPU-hour, $0.085 at time of writing) is worth evaluating later.

| Agent | Model tier | Read tools | Mutating (propose only) |
|---|---|---|---|
| Router / intent | Flash-Lite, structured output | — | — |
| Registration | Flash | `getProfile` | `proposeProfileUpsert` |
| Product | Flash | `searchMyProducts`, `getProduct` | `proposeCreate/Update/Delete/StatusChange` |
| Marketing | Flash | `getProduct` | `proposeSavePromotion` |
| Market Intelligence | Flash | `queryMarketPrices`, `searchMarketDocs` | none |
| Buyer Matching | Flash-Lite / none | `findMatches`, `explainMatch` | `proposeSendEnquiry` |
| Support | Flash-Lite | `faqSearch` | none (hands off) |

**Propose → confirm protocol (the core safety mechanism):**
1. The agent calls a `propose*` tool. The API stores a `PendingAction` (payload, payload hash, spoken summary, TTL).
2. The state machine moves to `CONFIRMATION_REQUIRED`, and the app reads the summary back in Tamil and shows it on screen.
3. The user says yes or taps the green button. A **deterministic classifier** (Tamil yes/no lexicon plus a small LLM fallback) checks the raw transcript and ASR confidence. Low confidence means "please say it again".
4. **Orchestrator code, not the LLM,** calls `commit(pendingActionId, payloadHash)`. **The LLM has no commit tool.**
5. The audit log records actor, old and new state, transcript snippet, confidence and method (voice or tap).

**Two more rules:**
- Tool arguments **never contain `userId` or role**. The server injects them from the authenticated context, so a prompt-injected model cannot act as someone else.
- User-generated text (descriptions, enquiries, buyer requirements) is **data, never instructions**.

---

## 7. Market-intelligence data

- **Agmarknet on data.gov.in:** daily min, max and modal prices per market, quoted per quintal. Normalise quintal to kg and keep the source and date on every row.
- **MSP for Minor Forest Produce** (Ministry of Tribal Affairs / TRIFED scheme, which includes wild honey among its items): keep it as a separate **"support price"** reference, never blended into market prices.
- **Retrieval:** market prices are structured. Query them with Mongo filters, not with vector search. Use embeddings for **entity resolution** (Tamil/English names, spelling variants, "மஞ்சள்" = turmeric) and for narrative documents (scheme notices, FAQs). The LLM only phrases the answer from tool results.
- **Staleness rule:** if the newest price is older than a set threshold (start with 7 days), say so and give its date.

---

## 8. Credits plan

**Back-of-envelope cost per voice turn** (assumptions in the second column; verify against the pricing pages):

| Part | Assumption | Approx. cost |
|---|---|---|
| Speech-to-Text v2 | about 8 s of audio at about $0.016/min | $0.002 |
| Router (Flash-Lite) | 1k tokens in, 50 out | < $0.001 |
| Agent (Flash tier) | 3k in, 500 out (thinking tokens bill as output), intro $0.75 / $3.75 per 1M | $0.004 |
| TTS Chirp 3 HD | about 120 characters at $30 per 1M | $0.004 |
| **Total** | | **about $0.01 per turn** |

That is roughly 30 turns for the full acceptance scenario, or about 30 cents. $300 of AI usage is around 30,000 turns *if nothing else used it*. Cloud Run, Redis, Atlas, Logging and Storage will use part of the credit. **Atlas paid tiers are billed by MongoDB, not by your GCP credit** (Marketplace is restricted on trial accounts).

**Cost levers:** static TTS cache, Flash-Lite for routing, low thinking budget on routine turns, context caching, batch mode (50% off) for embeddings and evals. Expect Flash costs to double after 1 Jan 2027.

**Guardrails:**
- Budget alerts at 25 / 50 / 80 / 100% from day one.
- Optional kill-switch: a Pub/Sub-triggered function that disables the Vertex API when the budget threshold fires. Budgets alone do not stop spending on a paid account.
- While you stay on the **trial** billing account, you cannot be charged. Upgrade only when you must keep the project alive past day 90 or need something the trial blocks.

**Use the 90 days wisely:**
- Build Stages 1–5 **locally with mock adapters**, which costs nothing. If your trial hasn't started its clock yet, delay activation until you reach Stage 6.
- Do the **Tamil speech spike (Stage 0) in week 1**, with about 100 recorded phrases. It is cheap and it decides your ASR choice.
- Target Stages 6–8 by about day 55, Stage 9–10 by about day 70, Stages 11–12 by about day 85.

---

## 9. Tools and AI to build the complete app

### A. AI inside the product
| Tool | Job |
|---|---|
| Gemini Flash / Flash-Lite (Vertex AI) | Agents, extraction, marketing text, routing |
| Google ADK (TypeScript) | Multi-agent orchestration, tool calling, evals |
| Cloud Speech-to-Text v2, Chirp 3 | Tamil streaming ASR, speech adaptation, denoiser |
| Cloud Text-to-Speech, Chirp 3 HD | Tamil streaming voice, custom pronunciations |
| Gemini embeddings | Entity resolution, document retrieval |
| Sarvam Saaras v3 / Bulbul v3 | India-resident Tamil ASR/TTS alternative. Not covered by GCP credits, has free signup credits |
| Bhashini, AI4Bharat models | Government language stack and open models for the future tribal-language path |
| Model Armor (optional) | Prompt-injection and safety screening |

### B. AI to build the code
| Tool | Note |
|---|---|
| **Antigravity** (IDE and CLI) | Google's current coding agent. Has a free tier and fits your Google credits |
| **Claude Code** | Anthropic's agentic coding tool for terminal, desktop and IDEs. Good at executing multi-file stage prompts. See docs.claude.com. *I'm made by Anthropic, so weigh this recommendation accordingly.* |
| Cursor / GitHub Copilot | Alternatives |
| Vertex AI Studio, Agent Studio | Prompt and agent prototyping before you write code |

Pick **one** primary coding agent. Put the master prompt (file 02) in its project-instructions file (for example `CLAUDE.md` or `AGENTS.md`) and paste one stage prompt at a time.

### C. Development and infrastructure
GitHub and Actions · pnpm workspaces + Turborepo · ESLint, Prettier, Husky · Docker and Compose (Mongo, Redis, mock providers) · gcloud CLI · Firebase CLI · Terraform (optional) · OpenAPI docs from Zod schemas · MongoDB Compass · RedisInsight · Bruno or Postman.

### D. Testing and evaluation
| Tool | Use |
|---|---|
| Vitest, Supertest, mongodb-memory-server | Unit and integration |
| **Playwright** with Chromium's fake-audio-capture flags | End-to-end voice tests using recorded WAV files as the "microphone" |
| **k6** | Load and WebSocket tests |
| **promptfoo** (has a Vertex provider), ADK eval | LLM regression and intent/extraction evals |
| `jiwer` (Python) | Word Error Rate on Tamil audio |

### E. Design
Tailwind and shadcn/ui, Lucide icons, Noto Sans Tamil, pictogram-first layouts with spoken labels, Figma (optional).

---

## 10. Day-0 GCP bootstrap

```bash
gcloud auth login
gcloud auth application-default login
gcloud projects create kural-angadi-dev --set-as-default   # pick your own ID
gcloud config set run/region asia-south1

gcloud services enable aiplatform.googleapis.com speech.googleapis.com \
  texttospeech.googleapis.com run.googleapis.com secretmanager.googleapis.com \
  artifactregistry.googleapis.com cloudbuild.googleapis.com cloudscheduler.googleapis.com

# One service account per service, least privilege (add roles as each stage needs them)
gcloud iam service-accounts create sa-agent --display-name "agent-service"
```

Then, in the console: link billing, create **budget alerts**, and confirm your credit expiry date. Ask your coding agent to check the current regional availability of each model and voice with the locations APIs before you fix regions in config.

---

## 11. Gaps I fixed in your existing prompts, and open decisions

**Fixed in the new prompts (file 02):**
- No `Enquiry` model existed in Stage 2, yet Stages 5 and 12 depend on it. Added.
- The confirmation step had no durable storage. Added a `PendingAction` model and the propose → confirm protocol.
- `Conversation.messages[]` would grow without bound. Moved turns to their own collection.
- Nothing said how it behaves with many users at once. Added concurrency, back-pressure and load-test requirements.
- Stage 12 targeted Docker only. Added a Cloud Run deployment, Secret Manager and budget guardrails.
- "RAG for prices" over structured data is fragile. Switched to structured queries plus embeddings for entity resolution.
- Consent and privacy were thin. Added consent capture in voice, retention limits, and contact details revealed only after acceptance.
- No Tamil speech risk step. Added Stage 0.

**Decide these yourself:**
- Final product name.
- ASR/TTS winner after the Stage 0 bake-off.
- OTP provider (and whether SHG coordinators do assisted onboarding).
- Whether audio leaving India is acceptable (Google TTS and some STT regions) or you route to India-resident providers.
- Which tribal language comes after Tamil, and who will record consented training and evaluation audio.
- A later phone-call (IVR) channel for producers without smartphones. The agent pipeline can be reused for it.
- Legal review of consent and data handling under India's DPDP Act, 2023.
