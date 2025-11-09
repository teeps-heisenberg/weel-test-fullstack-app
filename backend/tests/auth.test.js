import { test } from "node:test";
import assert from "node:assert/strict";

const API_URL = "http://localhost:5000/api";

const loginRequest = async (payload) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  return { response, data };
};

test("login with valid credentials", async () => {
  const { response, data } = await loginRequest({
    email: "test@example.com",
    password: "password123",
  });

  assert.equal(response.status, 200);
  assert.ok(data.token);
  assert.ok(data.user);
  assert.equal(data.user.email, "test@example.com");
});

test("login fails with missing email", async () => {
  const { response, data } = await loginRequest({
    password: "password123",
  });

  assert.equal(response.status, 400);
  assert.equal(data.error, "Email and password are required");
});

test("login fails with missing password", async () => {
  const { response, data } = await loginRequest({
    email: "test@example.com",
  });

  assert.equal(response.status, 400);
  assert.equal(data.error, "Email and password are required");
});

test("login fails with invalid email", async () => {
  const { response, data } = await loginRequest({
    email: "unknown@example.com",
    password: "password123",
  });

  assert.equal(response.status, 401);
  assert.equal(data.error, "Invalid credentials");
});

test("login fails with wrong password", async () => {
  const { response, data } = await loginRequest({
    email: "test@example.com",
    password: "wrongpassword",
  });

  assert.equal(response.status, 401);
  assert.equal(data.error, "Invalid credentials");
});

test("getMe returns user data with valid token", async () => {
  const loginResult = await loginRequest({
    email: "test@example.com",
    password: "password123",
  });

  assert.equal(loginResult.response.status, 200);

  const token = loginResult.data.token;

  const response = await fetch(`${API_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  assert.equal(response.status, 200);
  assert.ok(data.user);
  assert.equal(data.user.email, "test@example.com");
  assert.ok(data.user.id);
  assert.ok(data.user.createdAt);
});

test("getMe fails without token", async () => {
  const response = await fetch(`${API_URL}/me`);
  const data = await response.json();

  assert.equal(response.status, 401);
  assert.equal(data.error, "No token provided");
});

test("getMe fails with invalid token", async () => {
  const response = await fetch(`${API_URL}/me`, {
    headers: {
      Authorization: "Bearer invalid-token",
    },
  });

  const data = await response.json();

  assert.equal(response.status, 401);
  assert.equal(data.error, "Invalid token");
});
