import { describe, it, expect } from "vitest";
import { loginAs } from "./helpers";
import { Employee, Organization } from "../models";
import request from "supertest";
import app from "../app";
import { EMPLOYEES } from "./constants";

describe("Employee routes", () => {
  // 1
  it("org staff creates an employee in their own organization", async () => {
    const org = await Organization.create({ name: "Ad tech" });
    const { token } = await loginAs({ organization: org._id });
    const res = await request(app)
      .post(EMPLOYEES)
      .send({
        firstName: "Raghu",
        birthDate: "1993-09-09",
        nationality: "India",
      })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Employee created");
    expect(res.body.employee.organization).toBe(org._id.toString());
  });

  // 2
  it("does not expose passportNumber in the response", async () => {
    const org = await Organization.create({ name: "Ad tech" });
    const { token } = await loginAs({ organization: org._id });
    const res = await request(app)
      .post(EMPLOYEES)
      .send({
        firstName: "Raghu",
        birthDate: "1993-09-09",
        nationality: "India",
        passportNumber: "EJKFNKWNO",
      })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Employee created");
    expect(res.body.employee).not.toHaveProperty("passportNumber");
  });

  // 3
  it("ignores organization in the body and uses the user's organization", async () => {
    const orgA = await Organization.create({ name: "Ad tech" });
    const orgB = await Organization.create({ name: "Br tech" });
    const { token } = await loginAs({ organization: orgA._id });
    const res = await request(app)
      .post(EMPLOYEES)
      .send({
        firstName: "Raghu",
        birthDate: "1993-09-09",
        nationality: "India",
        organization: orgB._id,
      })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Employee created");
    expect(res.body.employee.organization).toBe(orgA._id.toString());
  });

  // 4
  it("rejects employee creation by a caseworker", async () => {
    const { token } = await loginAs({
      role: "caseworker",
    });
    const res = await request(app)
      .post(EMPLOYEES)
      .send({
        firstName: "Raghu",
        birthDate: "1993-09-09",
        nationality: "India",
      })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Not permitted");
  });

  // 5
  it("rejects employee creation without a token", async () => {
    const res = await request(app).post(EMPLOYEES);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });

  // 6
  it("rejects employee creation with missing required fields", async () => {
    const org = await Organization.create({ name: "Ad tech" });
    const { token } = await loginAs({ organization: org._id });
    const res = await request(app)
      .post(EMPLOYEES)
      .send({
        birthDate: "1993-09-09",
        nationality: "India",
      })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Missing required field");
  });

  // 7
  it("rejects employee creation with duplicate email in the same org", async () => {
    const org = await Organization.create({ name: "AD tech" });
    const { token } = await loginAs({ organization: org._id });
    const employee = {
      firstName: "Raghu",
      birthDate: "1993-09-09",
      nationality: "India",
      email: "r@r.com",
    };
    await request(app)
      .post(EMPLOYEES)
      .send(employee)
      .set("Authorization", `Bearer ${token}`);
    const res = await request(app)
      .post(EMPLOYEES)
      .send({ ...employee, email: "R@R.com" })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("Email already registered");
  });

  // 8
  it("allows the same email in different organizations", async () => {
    const org1 = await Organization.create({ name: "AD Tech" });
    const org2 = await Organization.create({ name: "NY Tech" });

    const staff1 = await loginAs({ organization: org1._id });
    const staff2 = await loginAs({
      organization: org2._id,
      email: "test2@test.com",
    });

    const employee = {
      firstName: "Raghu",
      birthDate: "1993-09-09",
      nationality: "India",
      email: "r@r.com",
    };
    const emp1 = await request(app)
      .post(EMPLOYEES)
      .send(employee)
      .set("Authorization", `Bearer ${staff1.token}`);
    expect(emp1.status).toBe(201);
    expect(emp1.body.message).toBe("Employee created");

    const emp2 = await request(app)
      .post(EMPLOYEES)
      .send(employee)
      .set("Authorization", `Bearer ${staff2.token}`);

    expect(emp2.status).toBe(201);
    expect(emp2.body.message).toBe("Employee created");
    expect(emp2.body.employee.organization).toBe(org2._id.toString());
  });

  // 9
  it("allows multiple employees without an email in the same organization", async () => {
    const org = await Organization.create({ name: "AD Tech" });
    const emp = {
      firstName: "A",
      birthDate: "1998-07-03",
      nationality: "India",
    };

    const { token } = await loginAs({ organization: org._id });
    const res1 = await request(app)
      .post(EMPLOYEES)
      .send(emp)
      .set("Authorization", `Bearer ${token}`);

    expect(res1.status).toBe(201);
    expect(res1.body.message).toBe("Employee created");

    const res2 = await request(app)
      .post(EMPLOYEES)
      .send(emp)
      .set("Authorization", `Bearer ${token}`);

    expect(res2.status).toBe(201);
    expect(res2.body.message).toBe("Employee created");
  });

  // 10
  it("lists only the user's organization's employees", async () => {
    const [orgA, orgB] = await Organization.create([
      { name: "A" },
      { name: "B" },
    ]);
    const base = {
      firstName: "A",
      birthDate: "1995-09-12",
      nationality: "India",
    };
    await Employee.create([
      {
        ...base,
        organization: orgA._id,
      },
      {
        ...base,
        organization: orgA._id,
      },
      {
        ...base,
        organization: orgB._id,
      },
    ]);

    const { token } = await loginAs({ organization: orgA._id });

    const res = await request(app)
      .get(EMPLOYEES)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.employees).toHaveLength(2);
    expect(res.body.pagination.total).toBe(2);
    const orgIds = res.body.employees.map(
      (e: { organization: string }) => e.organization,
    );
    expect(orgIds.every((id: string) => id === orgA._id.toString())).toBe(true);
  });

  // 11
  it("does not expose passportNumber when listing employees", async () => {
    const org = await Organization.create({ name: "AD Tech" });
    await Employee.create({
      firstName: "A",
      organization: org._id,
      birthDate: "1993-08-03",
      nationality: "India",
      passportNumber: "ANFDFN",
    });
    const { token } = await loginAs({ organization: org._id });
    const res = await request(app)
      .get(EMPLOYEES)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.employees).toHaveLength(1);
    for (const e of res.body.employees) {
      expect(e).not.toHaveProperty("passportNumber");
    }
  });

  // 12
  it("rejects employee listing by a caseworker", async () => {
    const { token } = await loginAs({ role: "caseworker" });
    const res = await request(app)
      .get(EMPLOYEES)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Not permitted");
  });

  // 13
  it("rejects employee listing without a token", async () => {
    const res = await request(app).get(EMPLOYEES);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });

  // 14
  it("caps page size at 100 when listing employees", async () => {
    const org = await Organization.create({ name: "AD Tech" });

    const { token } = await loginAs({ organization: org._id });
    const res = await request(app)
      .get(`${EMPLOYEES}?limit=5000`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.pagination.limit).toBe(100);
  });
});
