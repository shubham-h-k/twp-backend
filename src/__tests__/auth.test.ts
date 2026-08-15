import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../app";

const AUTH = "/api/v1/auth";
const validUser = {
  name: "Test user",
  email: "test@test.com",
  password: "test123",
  role: "org_staff",
};

describe("Auth routes", () => {
  // 1
  it("rejects signup with missing fields", async () => {
    const res = await request(app)
      .post(`${AUTH}/signup`)
      .send({ email: "test@test.com" }); // missing password, name, role

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Missing required field");
  });

  // 2
  it("rejects login with missing fields", async () => {
    const res = await request(app)
      .post(`${AUTH}/login`)
      .send({ email: "a@b.com" });
    expect(res.status).toBe(400);
  });

  // 3
  it("returns identical response for unknown email or wrong password", async () => {
    // both should be 401 with the SAME message - this proves no user enumeration
    const unknownEmail = await request(app)
      .post(`${AUTH}/login`)
      .send({ email: "nobody@nowhere.com", password: "whatever123" });

    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body.message).toBe("Invalid email or password");
  });

  // 4
  it("creates a user on valid signup", async () => {
    const res = await request(app).post(`${AUTH}/signup`).send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.userId).toBeDefined();
  });

  // 5
  it("logs in with correct credentials and returns a token", async () => {
    // first create the user
    await request(app).post(`${AUTH}/signup`).send(validUser);

    // ...then log in as them
    const res = await request(app)
      .post(`${AUTH}/login`)
      .send({ email: "test@test.com", password: "test123" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  // 6
  it("rejects duplicate email signup", async () => {
    // first create the user
    await request(app).post(`${AUTH}/signup`).send(validUser);

    const res = await request(app).post(`${AUTH}/signup`).send(validUser);

    expect(res.status).toBe(409);
  });

  // 7
  it("rejects /me with no token", async () => {
    const res = await request(app).get(`${AUTH}/me`);
    expect(res.status).toBe(401);
  });

  // 8
  it("rejects /me with an invalid token", async () => {
    const res = await request(app)
      .get(`${AUTH}/me`)
      .set("Authorization", "Bearer garbage");
    expect(res.status).toBe(401);
  });

  // 9
  it("returns user data on /me with a valid token", async () => {
    await request(app).post(`${AUTH}/signup`).send(validUser);
    const login = await request(app)
      .post(`${AUTH}/login`)
      .send({ email: validUser.email, password: validUser.password });
    const res = await request(app)
      .get(`${AUTH}/me`)
      .set("Authorization", `Bearer ${login.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("org_staff");
  });
});
