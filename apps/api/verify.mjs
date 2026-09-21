async function run() {
  const { orchestrator } = await import("./dist/agents/orchestrator.js");
  const { store } = await import("./dist/data/store.js");
  console.log("Initial products count:", store.products.length);

  // Turn 1: Propose with conversationId
  const convId = "conv_producer_maruthan";
  const turn1 = orchestrator.handleTurn({
    transcript: "20 kg honey price 500",
    language: "en-IN",
    conversationId: convId,
    userId: "usr_prod_1"
  });
  console.log("Turn 1 state:", turn1.state);
  console.log("Turn 1 propose name:", turn1.pendingAction?.payload?.name);
  console.log("Turn 1 pendingAction ID:", turn1.pendingAction?.id);

  // Turn 2: Confirm with same conversationId & decision YES
  const turn2 = orchestrator.handleTurn({
    transcript: "yes",
    conversationId: convId,
    userId: "usr_prod_1",
    isTapConfirm: true,
    tapDecision: "YES"
  });
  console.log("Turn 2 state:", turn2.state);
  console.log("Products count after commit:", store.products.length);
  console.log("Newly committed product:", store.products[0].name, "| Qty:", store.products[0].quantity, "| Price:", store.products[0].expectedPrice);
  console.log("Latest audit log:", store.auditLogs[0]?.action, "| Entity:", store.auditLogs[0]?.entityType);

  // Turn 3: Market price
  const price = orchestrator.handleTurn({ transcript: "market price of turmeric" });
  console.log("Price response:", price.spokenResponseEnglish);
}
run();
