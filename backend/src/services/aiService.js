import { GoogleGenerativeAI } from "@google/generative-ai";

const AI_TIMEOUT_MS = 10000;
const MAX_RETRIES = 1;

const aiService = {
  async generateOrderSummary(order, retryCount = 0) {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("Gemini API key not configured - AI summaries disabled");
      return null;
    }

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      let additionalInfo = "";
      if (order.deliveryType === "DELIVERY" && order.address) {
        additionalInfo = `\nDelivery Address: ${order.address}`;
      } else if (order.deliveryType === "CURBSIDE" && order.curbsideDetails) {
        additionalInfo = `\nCurbside Details: ${order.curbsideDetails}`;
      }

      const prompt = `You are a helpful customer service assistant. Create a warm, professional order confirmation summary for the following delivery preference:

Delivery Type: ${order.deliveryType}
Delivery Date: ${new Date(
        order.deliveryDate
      ).toLocaleDateString()}${additionalInfo}

The summary should:
- Welcome the customer warmly
- Confirm their delivery choice
- Mention the date
- Add a helpful, relevant tip based on delivery type
- Be friendly and professional
- Be 3-4 sentences maximum
- Use a conversational tone

Generate only the summary text, no extra formatting.`;

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("AI request timeout")), AI_TIMEOUT_MS)
      );

      const generatePromise = model.generateContent(prompt);
      const result = await Promise.race([generatePromise, timeoutPromise]);

      const response = await result.response;
      const text = response.text();

      if (!text || text.trim().length === 0) {
        throw new Error("AI returned empty response");
      }

      return text;
    } catch (error) {
      const errorMessage = error?.message || "Unknown error";

      if (retryCount < MAX_RETRIES) {
        console.warn(
          `AI generation failed (attempt ${retryCount + 1}/${
            MAX_RETRIES + 1
          }): ${errorMessage}. Retrying...`
        );
        return this.generateOrderSummary(order, retryCount + 1);
      }

      console.error(
        `AI generation failed after ${
          MAX_RETRIES + 1
        } attempts: ${errorMessage}`
      );

      return null;
    }
  },
};

export default aiService;
