import app from "../app";
import { User } from "../models";
import { AUTH } from "./constants";
import { validUser } from "./fixtures";
import request from "supertest";

export async function loginAs(overrides = {}) {
  const userData = { ...validUser, ...overrides };
  const signup = await request(app).post(`${AUTH}/signup`).send(userData);
  if (signup.status !== 201) {
    throw new Error(
      `loginAs signup failed (${signup.status}): ${JSON.stringify(signup.body)}`,
    );
  }
  const login = await request(app)
    .post(`${AUTH}/login`)
    .send({ email: userData.email, password: userData.password });
  const user = await User.findOne({ email: userData.email });
  if (!user) throw new Error(`loginAs failed to create user ${userData.email}`);
  return { token: login.body.token, user };
}
