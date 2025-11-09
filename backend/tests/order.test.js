import { test, before } from "node:test";
import assert from "node:assert/strict";

const API_URL = "http://localhost:5000/api";
const TEST_USER = {
  email: "test@example.com",
  password: "password123",
};

let authToken;

const getAuthToken = async () => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(TEST_USER),
  });

  const data = await response.json();

  if (response.status !== 200 || !data.token) {
    throw new Error("Unable to obtain auth token");
  }

  return data.token;
};

const getFutureDate = (daysFromNow = 1) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
};

const createOrder = async (payload, token = authToken) => {
  const response = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  return { response, data };
};

before(async () => {
  authToken = await getAuthToken();
});

test("POST /api/orders creates IN_STORE order", async () => {
  const payload = {
    deliveryType: "IN_STORE",
    deliveryDate: getFutureDate(1),
  };

  const { response, data } = await createOrder(payload);

  assert.equal(response.status, 201);
  assert.ok(data.order);
  assert.equal(data.order.deliveryType, "IN_STORE");
  assert.equal(data.order.address, null);
  assert.equal(data.order.curbsideDetails, null);
});

test("POST /api/orders creates DELIVERY order with address", async () => {
  const payload = {
    deliveryType: "DELIVERY",
    deliveryDate: getFutureDate(2),
    address: "123 Test Street",
  };

  const { response, data } = await createOrder(payload);

  assert.equal(response.status, 201);
  assert.equal(data.order.deliveryType, "DELIVERY");
  assert.equal(data.order.address, "123 Test Street");
});

test("POST /api/orders creates CURBSIDE order with details", async () => {
  const payload = {
    deliveryType: "CURBSIDE",
    deliveryDate: getFutureDate(3),
    curbsideDetails: "Blue car, license ABC123",
  };

  const { response, data } = await createOrder(payload);

  assert.equal(response.status, 201);
  assert.equal(data.order.deliveryType, "CURBSIDE");
  assert.equal(data.order.curbsideDetails, "Blue car, license ABC123");
});

test("POST /api/orders rejects missing deliveryType", async () => {
  const payload = {
    deliveryDate: getFutureDate(1),
  };

  const { response, data } = await createOrder(payload);

  assert.equal(response.status, 400);
  assert.equal(data.error, "Validation failed");
  assert.ok(Array.isArray(data.details));
  assert.ok(data.details.includes("Delivery type is required"));
});

test("POST /api/orders rejects invalid deliveryType", async () => {
  const payload = {
    deliveryType: "PICKUP",
    deliveryDate: getFutureDate(1),
  };

  const { response, data } = await createOrder(payload);

  assert.equal(response.status, 400);
  assert.equal(data.error, "Validation failed");
  assert.ok(
    data.details.includes(
      "Delivery type must be IN_STORE, DELIVERY, or CURBSIDE"
    )
  );
});

test("POST /api/orders rejects missing deliveryDate", async () => {
  const payload = {
    deliveryType: "IN_STORE",
  };

  const { response, data } = await createOrder(payload);

  assert.equal(response.status, 400);
  assert.ok(data.details.includes("Delivery date is required"));
});

test("POST /api/orders rejects past deliveryDate", async () => {
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1);

  const payload = {
    deliveryType: "IN_STORE",
    deliveryDate: pastDate.toISOString(),
  };

  const { response, data } = await createOrder(payload);

  assert.equal(response.status, 400);
  assert.ok(data.details.includes("Delivery date must be in the future"));
});

test("POST /api/orders rejects delivery without address", async () => {
  const payload = {
    deliveryType: "DELIVERY",
    deliveryDate: getFutureDate(1),
  };

  const { response, data } = await createOrder(payload);

  assert.equal(response.status, 400);
  assert.ok(data.details.includes("Address is required for delivery orders"));
});

test("POST /api/orders rejects curbside without details", async () => {
  const payload = {
    deliveryType: "CURBSIDE",
    deliveryDate: getFutureDate(1),
  };

  const { response, data } = await createOrder(payload);

  assert.equal(response.status, 400);
  assert.ok(
    data.details.includes("Curbside details are required for curbside pickup")
  );
});

test("POST /api/orders rejects in-store with address", async () => {
  const payload = {
    deliveryType: "IN_STORE",
    deliveryDate: getFutureDate(1),
    address: "Should not be here",
  };

  const { response, data } = await createOrder(payload);

  assert.equal(response.status, 400);
  assert.ok(
    data.details.includes("Address should not be provided for in-store pickup")
  );
});

test("POST /api/orders rejects request without auth token", async () => {
  const payload = {
    deliveryType: "IN_STORE",
    deliveryDate: getFutureDate(1),
  };

  const { response, data } = await createOrder(payload, null);

  assert.equal(response.status, 401);
  assert.equal(data.error, "No token provided");
});

test("GET /api/orders/:id retrieves own order", async () => {
  const orderPayload = {
    deliveryType: "IN_STORE",
    deliveryDate: getFutureDate(2),
  };

  const creation = await createOrder(orderPayload);

  assert.equal(creation.response.status, 201);

  const orderId = creation.data.order.id;

  const response = await fetch(`${API_URL}/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.order.id, orderId);
});

test("GET /api/orders/:id rejects invalid UUID", async () => {
  const response = await fetch(`${API_URL}/orders/not-a-uuid`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  const data = await response.json();

  assert.equal(response.status, 400);
  assert.equal(data.error, "Invalid order ID");
});

test("GET /api/orders/:id rejects non-existent order", async () => {
  const response = await fetch(
    `${API_URL}/orders/11111111-1111-1111-1111-111111111111`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );

  const data = await response.json();

  assert.equal(response.status, 404);
  assert.equal(data.error, "Order not found");
});

test("GET /api/orders/:id rejects without auth token", async () => {
  const response = await fetch(
    `${API_URL}/orders/11111111-1111-1111-1111-111111111111`
  );
  const data = await response.json();

  assert.equal(response.status, 401);
  assert.equal(data.error, "No token provided");
});

test("PUT /api/orders/:id updates deliveryDate only", async () => {
  const initial = await createOrder({
    deliveryType: "IN_STORE",
    deliveryDate: getFutureDate(2),
  });

  assert.equal(initial.response.status, 201);

  const orderId = initial.data.order.id;
  const newDate = getFutureDate(5);

  const response = await fetch(`${API_URL}/orders/${orderId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      deliveryDate: newDate,
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.order.id, orderId);
  assert.equal(
    new Date(data.order.deliveryDate).toISOString(),
    new Date(newDate).toISOString()
  );
});

test("PUT /api/orders/:id changes type from IN_STORE to DELIVERY", async () => {
  const initial = await createOrder({
    deliveryType: "IN_STORE",
    deliveryDate: getFutureDate(2),
  });

  const orderId = initial.data.order.id;

  const response = await fetch(`${API_URL}/orders/${orderId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      deliveryType: "DELIVERY",
      address: "456 Delivery Ave",
      deliveryDate: getFutureDate(3),
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.order.deliveryType, "DELIVERY");
  assert.equal(data.order.address, "456 Delivery Ave");
});

test("PUT /api/orders/:id updates multiple fields", async () => {
  const initial = await createOrder({
    deliveryType: "CURBSIDE",
    deliveryDate: getFutureDate(2),
    curbsideDetails: "Red car",
  });

  const orderId = initial.data.order.id;

  const response = await fetch(`${API_URL}/orders/${orderId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      deliveryType: "CURBSIDE",
      deliveryDate: getFutureDate(4),
      curbsideDetails: "Green car, pickup at 5 PM",
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.order.curbsideDetails, "Green car, pickup at 5 PM");
});

test("PUT /api/orders/:id rejects past date update", async () => {
  const initial = await createOrder({
    deliveryType: "IN_STORE",
    deliveryDate: getFutureDate(2),
  });

  const orderId = initial.data.order.id;
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1);

  const response = await fetch(`${API_URL}/orders/${orderId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      deliveryDate: pastDate.toISOString(),
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 400);
  assert.ok(data.details.includes("Delivery date must be in the future"));
});

test("PUT /api/orders/:id rejects invalid deliveryType", async () => {
  const initial = await createOrder({
    deliveryType: "IN_STORE",
    deliveryDate: getFutureDate(2),
  });

  const orderId = initial.data.order.id;

  const response = await fetch(`${API_URL}/orders/${orderId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      deliveryType: "INVALID",
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 400);
  assert.ok(
    data.details.includes(
      "Delivery type must be IN_STORE, DELIVERY, or CURBSIDE"
    )
  );
});

test("PUT /api/orders/:id rejects delivery update without address", async () => {
  const initial = await createOrder({
    deliveryType: "IN_STORE",
    deliveryDate: getFutureDate(2),
  });

  const orderId = initial.data.order.id;

  const response = await fetch(`${API_URL}/orders/${orderId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      deliveryType: "DELIVERY",
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 400);
  assert.ok(data.details.includes("Address is required for delivery orders"));
});

test("PUT /api/orders/:id rejects non-existent order", async () => {
  const response = await fetch(
    `${API_URL}/orders/22222222-2222-2222-2222-222222222222`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        deliveryType: "IN_STORE",
        deliveryDate: getFutureDate(3),
      }),
    }
  );

  const data = await response.json();

  assert.equal(response.status, 404);
  assert.equal(data.error, "Order not found");
});

test("PUT /api/orders/:id rejects request without auth token", async () => {
  const initial = await createOrder({
    deliveryType: "IN_STORE",
    deliveryDate: getFutureDate(2),
  });

  const orderId = initial.data.order.id;

  const response = await fetch(`${API_URL}/orders/${orderId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      deliveryDate: getFutureDate(5),
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 401);
  assert.equal(data.error, "No token provided");
});
