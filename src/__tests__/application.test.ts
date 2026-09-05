import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../app";
import Employee, { IEmployee } from "../models/Employee";
import Organization, { IOrganization } from "../models/Organization";
import { validUser } from "./fixtures";
import { HydratedDocument } from "mongoose";
import { APPLICATIONS, AUTH } from "./constants";

let orgA: HydratedDocument<IOrganization>;
let orgB: HydratedDocument<IOrganization>;
let employeeA: HydratedDocument<IEmployee>;

async function loginAs(overrides = {}) {
  const user = { ...validUser, ...overrides };
  await request(app).post(`${AUTH}/signup`).send(user);
  const login = await request(app)
    .post(`${AUTH}/login`)
    .send({ email: user.email, password: user.password });
  return login.body.token;
}

describe("Application routes", () => {
  beforeEach(async () => {
    orgA = await Organization.create({ name: "Org A" });
    orgB = await Organization.create({ name: "Org B" });
    employeeA = await Employee.create({
      firstName: "Rohan",
      lastName: "kumar",
      organization: orgA._id,
      birthDate: "1997-09-05",
      nationality: "India",
    });
  });

  // 1
  it("rejects if user and employee belong to different organization", async () => {
    const token = await loginAs({ organization: orgB._id });
    const res = await request(app)
      .post(APPLICATIONS)
      .send({ employeeId: employeeA._id })
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Employee not found");
  });

  // 2
  it("creates application if user and employee belong to same organization", async () => {
    const token = await loginAs({ organization: orgA._id });
    const res = await request(app)
      .post(APPLICATIONS)
      .send({ employeeId: employeeA._id })
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Application created");
  });

  // 3
  it("rejects /applications with no token", async () => {
    const res = await request(app)
      .post(APPLICATIONS)
      .send({ employeeId: employeeA._id });

    expect(res.status).toBe(401);
  });

  // 4
  it("rejects if caseworker tries to create application ", async () => {
    const token = await loginAs({ role: "caseworker", organization: orgA._id });
    const res = await request(app)
      .post(APPLICATIONS)
      .send({ employeeId: employeeA._id })
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  // 5
  it("rejects if employeeId is absent", async () => {
    const token = await loginAs({ organization: orgA._id });
    const res = await request(app)
      .post(APPLICATIONS)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Missing required field");
  });

  // 6
  it("rejects if employeeId is malformed", async () => {
    const token = await loginAs({ organization: orgA._id });
    const res = await request(app)
      .post(APPLICATIONS)
      .send({ employeeId: "mdflmmems" })
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid ID");
  });
});
