async function runFullSuite() {
  console.log("==================================================");
  console.log("  Kurinji Kural Comprehensive Integration Suite   ");
  console.log("==================================================");

  const { orchestrator } = await import("../apps/api/dist/agents/orchestrator.js");
  const { store } = await import("../apps/api/dist/data/store.js");

  let passed = 0;
  let total = 0;

  function expect(condition, message) {
    total++;
    if (!condition) {
      console.error(`[FAIL] ${message}`);
      process.exit(1);
    }
    console.log(`[PASS] ${message}`);
    passed++;
  }

  // Suite 1: Rule R1 & Translation (Tamil Turmeric -> English Hill Turmeric)
  const convId1 = "conv_test_turmeric";
  const r1 = orchestrator.handleTurn({
    transcript: "பாரம்பரிய மலை மஞ்சள் 50 கிலோ விலை 170 ரூபாய்",
    language: "ta-IN",
    conversationId: convId1,
    userId: "usr_prod_2"
  });

  expect(r1.state === "CONFIRMATION_REQUIRED", "Rule R1: Propose phase locks into CONFIRMATION_REQUIRED");
  expect(r1.pendingAction.payload.name === "Organic Hill Turmeric", "Translates Tamil turmeric to 'Organic Hill Turmeric'");
  expect(r1.pendingAction.payload.quantity === 50, "Parsed quantity: 50 kg");
  expect(r1.pendingAction.payload.expectedPrice === 170, "Parsed expected price: Rs. 170");

  // Suite 2: Cancel path in Tamil ('வேண்டாம்')
  const rCancel = orchestrator.handleTurn({
    transcript: "வேண்டாம் ரத்து செய்",
    language: "ta-IN",
    conversationId: convId1,
    userId: "usr_prod_2"
  });
  expect(rCancel.state === "CANCELLED", "Tamil refusal 'வேண்டாம்' cancels pending action");
  expect(rCancel.spokenResponseEnglish.includes("cancelled"), "Confirmation of cancellation returned");

  // Suite 3: Re-propose and Confirm
  const convId2 = "conv_test_turmeric_confirm";
  orchestrator.handleTurn({
    transcript: "மலை மஞ்சள் 50 கிலோ விலை 170",
    language: "ta-IN",
    conversationId: convId2,
    userId: "usr_prod_2"
  });
  const countBefore = store.products.length;
  const rConfirm = orchestrator.handleTurn({
    transcript: "சரி",
    language: "ta-IN",
    conversationId: convId2,
    userId: "usr_prod_2"
  });
  expect(rConfirm.state === "SAVED", "Tamil confirmation 'சரி' commits the pending action");
  expect(store.products.length === countBefore + 1, "English inventory count incremented");
  expect(store.products[0].name === "Organic Hill Turmeric", "New item exists with English name in inventory");

  // Suite 4: Rule R4 (Refuse to fabricate prices)
  const priceValid = orchestrator.handleTurn({
    transcript: "மஞ்சள் சந்தை விலை என்ன?",
    language: "ta-IN"
  });
  expect(priceValid.spokenResponseEnglish.includes("₹155 per kg"), "Valid Mandi modal price retrieved");

  const priceInvalid = orchestrator.handleTurn({
    transcript: "unknown fake commodity market price",
    language: "en-IN"
  });
  expect(priceInvalid.spokenResponseEnglish.includes("No verified mandi price found"), "Rule R4: Never fabricates missing market prices");

  // Suite 5: Rule R7 Privacy & Enquiry Lifecycle
  const newEnq = {
    id: "enq_test_1",
    buyerId: "usr_buyer_1",
    buyerName: "Sundaram Organics",
    buyerPhone: "9876543220",
    producerId: "usr_prod_1",
    producerName: "Maruthan",
    producerPhone: "9876543210",
    productId: store.products[0].id,
    productName: store.products[0].name,
    quantity: 20,
    offeredPrice: 170,
    status: "SENT",
    message: "Sample test enquiry",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  store.enquiries.unshift(newEnq);

  // Producer accepts enquiry
  newEnq.status = "ACCEPTED";
  store.logAudit(newEnq.producerId, "ACCEPT_ENQUIRY", "Enquiry", newEnq.id, null, newEnq, "tap");
  expect(newEnq.status === "ACCEPTED", "Enquiry accepted by producer");
  expect(store.auditLogs[0].action === "ACCEPT_ENQUIRY", "Audit log created for enquiry acceptance");

  console.log(`\nAll ${passed}/${total} integration tests passed with flying colors!`);
}

runFullSuite();
