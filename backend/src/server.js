import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import prisma from "./config/prisma.js";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

app.use("/api", authRoutes);
app.use("/api", orderRoutes);
app.use("/api", aiRoutes);

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log("Successfully connected to the database");

    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to the database:", error);
    process.exit(1);
  }
};

startServer();

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const message = err?.message ?? "Internal server error";

  return res.status(500).json({ error: message });
});

export default app;
