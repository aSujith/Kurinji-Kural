import express from "express";
import cors from "cors";
import { apiRouter } from "./routes/api.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "*" }));
app.use(express.json());

// Routes
app.use("/api/v1", apiRouter);

// Kubernetes / Cloud Run health endpoints
app.get("/healthz", (req, res) => res.status(200).send("OK"));
app.get("/readyz", (req, res) => res.status(200).send("READY"));

const server = app.listen(PORT, () => {
  console.log(`[Kurinji Kural API] Server listening on port ${PORT}`);
});

process.on("SIGTERM", () => {
  console.log("[Kurinji Kural API] SIGTERM received, closing server...");
  server.close(() => {
    console.log("[Kurinji Kural API] Server closed gracefully.");
    process.exit(0);
  });
});
