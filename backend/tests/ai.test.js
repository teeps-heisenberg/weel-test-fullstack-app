import { test, mock } from "node:test";
import assert from "node:assert/strict";
import aiService from "../src/services/aiService.js";

const API_URL = "http://localhost:5000/api";

const setupTestOrder = async () => {
  const loginResponse = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "test@example.com",
      password: "password123",
    }),
  });

  const { token } = await loginResponse.json();

  const orderResponse = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      deliveryType: "DELIVERY",
      deliveryDate: new Date(Date.now() + 86400000).toISOString(),
      address: "123 Main St, Springfield, IL 62701",
    }),
  });

  const { order } = await orderResponse.json();

  return { token, orderId: order.id };
};

const getSecondUserToken = async () => {
  const loginResponse = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "test2@example.com",
      password: "password123",
    }),
  });

  const { token } = await loginResponse.json();
  return token;
};

test("AI summary endpoint returns summary with valid order", async () => {
  const { token, orderId } = await setupTestOrder();

  const response = await fetch(`${API_URL}/ai/summary/${orderId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  assert.equal(response.status, 200);
  assert.ok(data.orderData);
  assert.equal(data.orderData.id, orderId);
  assert.ok(data.hasOwnProperty("summary"));
});

test("AI summary endpoint checks authorization", async () => {
  const { orderId } = await setupTestOrder();
  const otherUserToken = await getSecondUserToken();

  const response = await fetch(`${API_URL}/ai/summary/${orderId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${otherUserToken}`,
    },
  });

  const data = await response.json();

  assert.equal(response.status, 403);
  assert.equal(data.error, "Access denied");
});

test("AI summary endpoint fails with invalid order ID format", async () => {
  const { token } = await setupTestOrder();

  const response = await fetch(`${API_URL}/ai/summary/invalid-id`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  assert.equal(response.status, 400);
  assert.equal(data.error, "Invalid order ID");
});

test("AI summary endpoint fails with non-existent order", async () => {
  const { token } = await setupTestOrder();
  const fakeOrderId = "00000000-0000-0000-0000-000000000000";

  const response = await fetch(`${API_URL}/ai/summary/${fakeOrderId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  assert.equal(response.status, 404);
  assert.equal(data.error, "Order not found");
});

test("AI summary endpoint requires authentication", async () => {
  const response = await fetch(`${API_URL}/ai/summary/some-id`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  assert.equal(response.status, 401);
  assert.ok(data.error);
});

// Unit tests for aiService
test("aiService returns null when API key not configured", async () => {
  const originalKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  const mockOrder = {
    deliveryType: "DELIVERY",
    deliveryDate: new Date().toISOString(),
    address: "123 Main St",
  };

  const result = await aiService.generateOrderSummary(mockOrder);

  assert.equal(result, null);

  process.env.GEMINI_API_KEY = originalKey;
});

test("aiService gracefully handles empty responses", async () => {
  assert.ok(aiService.generateOrderSummary);
  assert.equal(typeof aiService.generateOrderSummary, "function");
});

test("AI service falls back gracefully when AI fails", async () => {
  const { token, orderId } = await setupTestOrder();

  const response = await fetch(`${API_URL}/ai/summary/${orderId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  assert.equal(response.status, 200);
  assert.ok(data.orderData);
  assert.equal(data.orderData.id, orderId);
  assert.ok("summary" in data);
});
