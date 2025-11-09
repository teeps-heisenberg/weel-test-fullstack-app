import orderService from "../services/orderService.js";
import aiService from "../services/aiService.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getSummary = async (req, res) => {
  try {
    const orderId = req.params?.id;
    const { userId } = req.user ?? {};

    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!orderId || !UUID_REGEX.test(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const order = await orderService.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.user?.id !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const aiSummary = await aiService.generateOrderSummary(order);

    return res.status(200).json({
      summary: aiSummary || null,
      orderData: order
    });
  } catch (error) {
    console.error("Failed to generate summary", error);
    return res.status(500).json({ error: "Failed to generate summary" });
  }
};

