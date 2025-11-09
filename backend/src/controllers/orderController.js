import orderService from "../services/orderService.js";
import {
  validateOrderData,
  sanitizeOrderData,
  DELIVERY_TYPES,
} from "../utils/orderValidation.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const createOrder = async (req, res) => {
  const { userId } = req.user ?? {};
  const { deliveryType, deliveryDate, address, curbsideDetails } = req.body ?? {};

  if (!userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const validation = validateOrderData(
    { deliveryType, deliveryDate, address, curbsideDetails },
    false,
  );

  if (!validation.valid) {
    return res.status(400).json({ error: "Validation failed", details: validation.errors });
  }

  const sanitizedData = sanitizeOrderData(
    { deliveryType, deliveryDate, address, curbsideDetails },
    deliveryType,
  );

  try {
    const order = await orderService.create(userId, sanitizedData);

    return res.status(201).json({ order });
  } catch (error) {
    console.error("Failed to create order", error);

    return res.status(500).json({ error: "Failed to create order" });
  }
};

const getOrder = async (req, res) => {
  const orderId = req.params?.id;
  const { userId } = req.user ?? {};

  if (!userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (!orderId || !UUID_REGEX.test(orderId)) {
    return res.status(400).json({ error: "Invalid order ID" });
  }

  try {
    const order = await orderService.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.user?.id !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    return res.status(200).json({ order });
  } catch (error) {
    console.error("Failed to fetch order", error);

    return res.status(500).json({ error: "Failed to fetch order" });
  }
};

const updateOrder = async (req, res) => {
  const orderId = req.params?.id;
  const { userId } = req.user ?? {};
  const payload = req.body ?? {};

  if (!userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (!orderId || !UUID_REGEX.test(orderId)) {
    return res.status(400).json({ error: "Invalid order ID" });
  }

  try {
    const existingOrder = await orderService.findById(orderId);

    if (!existingOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (existingOrder.user?.id !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const validation = validateOrderData(payload, true);

    if (!validation.valid) {
      return res.status(400).json({ error: "Validation failed", details: validation.errors });
    }

    const nextDeliveryType = Object.hasOwn(payload, "deliveryType")
      ? payload.deliveryType
      : existingOrder.deliveryType;

    const sanitizedData = sanitizeOrderData(payload, nextDeliveryType);

    const updated = await orderService.update(orderId, sanitizedData);

    if (!updated) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.status(200).json({ order: updated });
  } catch (error) {
    console.error("Failed to update order", error);

    return res.status(500).json({ error: "Failed to update order" });
  }
};

export {
  createOrder,
  getOrder,
  updateOrder,
};

