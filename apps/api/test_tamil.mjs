async function runTamilFlow() {
  const { orchestrator } = await import("./dist/agents/orchestrator.js");
  const { store } = await import("./dist/data/store.js");
  console.log("\n=== Testing Tamil Voice Input -> English Inventory Flow ===");

  const convId = "conv_tamil_user_1";
  const countBefore = store.products.length;

  // Step 1: User speaks in Tamil
  const turn1 = orchestrator.handleTurn({
    transcript: "20 கிலோ மலைத்தேன் விலை 500 ரூபாய் சேர்க்க",
    language: "ta-IN",
    conversationId: convId,
    userId: "usr_prod_1"
  });

  console.log("Tamil Voice Input Received: '20 கிலோ மலைத்தேன் விலை 500 ரூபாய் சேர்க்க'");
  console.log("-> Orchestrator State:", turn1.state);
  console.log("-> Translated English Name:", turn1.pendingAction?.payload?.name);
  console.log("-> Extracted Quantity:", turn1.pendingAction?.payload?.quantity, turn1.pendingAction?.payload?.unit);
  console.log("-> Extracted Price: Rs.", turn1.pendingAction?.payload?.expectedPrice);
  console.log("-> Spoken English Confirmation Prompt:", turn1.spokenResponseEnglish);

  // Step 2: User says "ஆம்" (Yes) in Tamil
  const turn2 = orchestrator.handleTurn({
    transcript: "ஆம்",
    language: "ta-IN",
    conversationId: convId,
    userId: "usr_prod_1"
  });

  console.log("\nUser Confirmed with Tamil Word: 'ஆம்'");
  console.log("-> Orchestrator State:", turn2.state);
  console.log("-> Total Products in English Inventory:", store.products.length);
  console.log("-> Success Spoken Response:", turn2.spokenResponseEnglish);
  console.log("-> Verified Commit Added to Store:", store.products[0].name === "Wild Rock Honey");
  console.log("-> Audit Trail Event:", store.auditLogs[0]?.action, "via method:", store.auditLogs[0]?.confirmationMethod);
}

runTamilFlow();
