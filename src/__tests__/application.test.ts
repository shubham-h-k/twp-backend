import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../app";
import Employee, { IEmployee } from "../models/Employee";
import Organization, { IOrganization } from "../models/Organization";
import { HydratedDocument } from "mongoose";
import { APPLICATIONS } from "./constants";
import Application from "../models/Application";
import User, { IUser } from "../models/User";
import { loginAs } from "./helpers";

let orgA: HydratedDocument<IOrganization>;
let orgB: HydratedDocument<IOrganization>;
let employee1: HydratedDocument<IEmployee>;
let employee2: HydratedDocument<IEmployee>;
let creator: HydratedDocument<IUser>;

describe("Application routes", () => {
  beforeEach(async () => {
    orgA = await Organization.create({ name: "Org A" });
    orgB = await Organization.create({ name: "Org B" });
    employee1 = await Employee.create({
      firstName: "Rohan",
      lastName: "kumar",
      organization: orgA._id,
      birthDate: "1997-09-05",
      nationality: "India",
    });
    employee2 = await Employee.create({
      firstName: "Neha",
      lastName: "Kaur",
      organization: orgB._id,
      birthDate: "1995-04-28",
      nationality: "India",
    });
    creator = await User.create({
      name: "Setup User",
      email: "setup@test.com",
      password: "hashed-not-used",
      role: "org_staff",
      organization: orgA._id,
    });
  });

  // 1
  it("rejects if user and employee belong to different organization", async () => {
    const { token } = await loginAs({ organization: orgB._id });
    const res = await request(app)
      .post(APPLICATIONS)
      .send({ employeeId: employee1._id })
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Employee not found");
  });

  // 2
  it("creates application if user and employee belong to same organization", async () => {
    const { token } = await loginAs({ organization: orgA._id });
    const res = await request(app)
      .post(APPLICATIONS)
      .send({ employeeId: employee1._id })
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Application created");
  });

  // 3
  it("rejects /applications with no token", async () => {
    const res = await request(app)
      .post(APPLICATIONS)
      .send({ employeeId: employee1._id });

    expect(res.status).toBe(401);
  });

  // 4
  it("rejects if caseworker tries to create application ", async () => {
    const { token } = await loginAs({
      role: "caseworker",
      organization: orgA._id,
    });
    const res = await request(app)
      .post(APPLICATIONS)
      .send({ employeeId: employee1._id })
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  // 5
  it("rejects if employeeId is absent", async () => {
    const { token } = await loginAs({ organization: orgA._id });
    const res = await request(app)
      .post(APPLICATIONS)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Missing required field");
  });

  // 6
  it("rejects if employeeId is malformed", async () => {
    const { token } = await loginAs({ organization: orgA._id });
    const res = await request(app)
      .post(APPLICATIONS)
      .send({ employeeId: "mdflmmems" })
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid ID");
  });

  // 7
  it("rejects GET /applications with no token", async () => {
    const res = await request(app).get(APPLICATIONS);
    expect(res.status).toBe(401);
  });

  // 8
  it("org staff does not see other organization's applications", async () => {
    const orgAApp = {
      employee: employee1._id,
      organization: orgA._id,
      createdBy: creator._id,
    };
    await Application.create([
      orgAApp,
      orgAApp,
      orgAApp,
      {
        employee: employee2._id,
        organization: orgB._id,
        createdBy: creator._id,
      },
    ]);
    const { token } = await loginAs({ organization: orgA._id });
    const res = await request(app)
      .get(APPLICATIONS)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.applications).toHaveLength(3);
    expect(res.body.pagination.total).toBe(3);

    const orgIds = res.body.applications.map(
      (a: { organization: { _id: string } }) => a.organization._id,
    );
    expect(orgIds.every((id: string) => id === orgA._id.toString())).toBe(true);
  });

  // 9
  it("caseworker with no filter sees applications across all organizations", async () => {
    await Application.create([
      {
        employee: employee1._id,
        organization: orgA._id,
        createdBy: creator._id,
      },
      {
        employee: employee2._id,
        organization: orgB._id,
        createdBy: creator._id,
      },
    ]);

    const { token } = await loginAs({ role: "caseworker" });
    const res = await request(app)
      .get(APPLICATIONS)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.applications).toHaveLength(2);
    expect(res.body.pagination.total).toBe(2);

    const orgIds = res.body.applications.map(
      (a: { organization: { _id: string } }) => a.organization._id,
    );
    expect(orgIds).toContain(orgA._id.toString());
    expect(orgIds).toContain(orgB._id.toString());
  });

  // 10
  it("caseworker with assigned=me sees only applications assigned to them", async () => {
    const caseworker1 = await loginAs({ role: "caseworker" });
    const caseworker2 = await loginAs({
      role: "caseworker",
      email: "other@test.com",
    });
    await Application.create([
      {
        employee: employee1._id,
        organization: orgA._id,
        caseworker: caseworker1.user._id,
        createdBy: creator._id,
      },
      {
        employee: employee2._id,
        organization: orgB._id,
        caseworker: caseworker2.user._id,
        createdBy: creator._id,
      },
      {
        employee: employee2._id,
        organization: orgB._id,
        createdBy: creator._id,
      },
    ]);
    const res = await request(app)
      .get(`${APPLICATIONS}?assigned=me`)
      .set("Authorization", `Bearer ${caseworker1.token}`);
    expect(res.status).toBe(200);
    expect(res.body.applications).toHaveLength(1);
    expect(res.body.pagination.total).toBe(1);

    const caseworkerIds = res.body.applications.map(
      (a: { caseworker: string }) => a.caseworker,
    );

    expect(caseworkerIds).toContain(caseworker1.user._id.toString());
  });

  // 11
  it("caseworker with assigned=none sees only unassigned applications", async () => {
    const caseworker1 = await loginAs({ role: "caseworker" });
    const caseworker2 = await loginAs({
      role: "caseworker",
      email: "other@test.com",
    });
    await Application.create([
      {
        employee: employee1._id,
        organization: orgA._id,
        caseworker: caseworker1.user._id,
        createdBy: creator._id,
      },
      {
        employee: employee2._id,
        organization: orgB._id,
        caseworker: caseworker2.user._id,
        createdBy: creator._id,
      },
      {
        employee: employee2._id,
        organization: orgB._id,
        createdBy: creator._id,
      },
    ]);
    const res = await request(app)
      .get(`${APPLICATIONS}?assigned=none`)
      .set("Authorization", `Bearer ${caseworker2.token}`);

    expect(res.status).toBe(200);
    expect(res.body.applications).toHaveLength(1);
    expect(res.body.pagination.total).toBe(1);

    expect(
      res.body.applications.every(
        (a: { caseworker?: string }) => !a.caseworker,
      ),
    ).toBe(true);
  });

  // 12
  it("rejects an invalid assigned filter value", async () => {
    const caseworker1 = await loginAs({ role: "caseworker" });

    const res = await request(app)
      .get(`${APPLICATIONS}?assigned=garbage`)
      .set("Authorization", `Bearer ${caseworker1.token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid input");
  });

  // 13
  it("cap page size at 100 if it is more than 100", async () => {
    const { token } = await loginAs();
    const res = await request(app)
      .get(`${APPLICATIONS}?limit=9999`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.pagination.limit).toBe(100);
  });
});
