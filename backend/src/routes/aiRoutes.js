import express from "express";
import { getSummary } from "../controllers/aiController.js";
import authMiddleware from "../middleware/auth.js";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const router = express.Router();

router.post("/ai/summary/:id", authMiddleware, getSummary);

export default router;
