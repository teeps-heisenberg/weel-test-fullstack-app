import express from "express";

import {
  createOrder,
  getOrder,
  updateOrder,
} from "../controllers/orderController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post("/orders", authMiddleware, createOrder);
router.get("/orders/:id", authMiddleware, getOrder);
router.put("/orders/:id", authMiddleware, updateOrder);

export default router;

