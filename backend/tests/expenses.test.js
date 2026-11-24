import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";

process.env.JWT_SECRET = randomBytes(32).toString("hex");

const { default: app } = await import("../server.js");
const { default: pool } = await import("../db.js");

let server;
let baseUrl;

const email1 = `${randomUUID()}@example.com`;
const email2 = `${randomUUID()}@example.com`;
const password = randomBytes(16).toString("hex");

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });

  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  try {
    await pool.query(
      "DELETE FROM users WHERE email IN ($1, $2)",
      [email1, email2]
    );
  } finally {
    await pool.end();
    await new Promise((resolve) => server.close(resolve));
  }
});

async function request(path, method = "GET", body, token) {
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` })
    },
    body: body ? JSON.stringify(body) : undefined
  });
}

async function createUser(email) {
  const register = await request("/auth/register", "POST", {
    email,
    password
  });

  assert.equal(register.status, 201);

  const login = await request("/auth/login", "POST", {
    email,
    password
  });

  assert.equal(login.status, 200);

  const data = await login.json();
  return data.token;
}

test("Expense CRUD and ownership", async () => {
  const token1 = await createUser(email1);
  const token2 = await createUser(email2);

  const expense = {
    amount: 120,
    category: "Mat",
    description: "Lunch"
  };

  // Create
  const created = await request(
    "/expenses", "POST", expense, token1
  );

  assert.equal(created.status, 201);

  const data = await created.json();
  const path = `/expenses/${data.id}`;

  // Read
  const read = await request(path, "GET", undefined, token1);
  assert.equal(read.status, 200);

  // Read all
  const list = await request(
    "/expenses", "GET", undefined, token1
  );

  assert.equal(list.status, 200);
  assert.equal((await list.json()).length, 1);

  // Update
  const updated = await request(path, "PUT", {
    ...expense,
    amount: 150
  }, token1);

  assert.equal(updated.status, 200);
  assert.equal(Number((await updated.json()).amount), 150);

  // Ownership
  const forbiddenRead = await request(
    path, "GET", undefined, token2
  );

  assert.equal(forbiddenRead.status, 404);

  const forbiddenUpdate = await request(
    path, "PUT", expense, token2
  );

  assert.equal(forbiddenUpdate.status, 404);

  const forbiddenDelete = await request(
    path, "DELETE", undefined, token2
  );

  assert.equal(forbiddenDelete.status, 404);

  // Delete
  const deleted = await request(
    path, "DELETE", undefined, token1
  );

  assert.equal(deleted.status, 204);

  const missing = await request(
    path, "GET", undefined, token1
  );

  assert.equal(missing.status, 404);
});
