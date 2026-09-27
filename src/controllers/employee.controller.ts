import { Request, Response } from "express";
import { Employee } from "../models";
import { API_MESSAGES } from "../constants/api.messages";

export async function createEmployee(req: Request, res: Response) {
  if (!req.user?.organization) {
    return res.status(401).json({ message: API_MESSAGES.UNAUTHORIZED });
  }

  const { firstName, lastName, email, birthDate, nationality, passportNumber } =
    req.body || {};

  if (!firstName || !birthDate || !nationality) {
    return res.status(400).json({ message: API_MESSAGES.MISSING_FIELDS });
  }

  try {
    const employee = await Employee.create({
      firstName,
      lastName,
      email,
      organization: req.user.organization,
      birthDate,
      nationality,
      passportNumber,
    });
    const { passportNumber: _omit, ...safeEmployee } = employee.toObject();
    return res.status(201).json({
      message: API_MESSAGES.EMPLOYEE_CREATED,
      employee: safeEmployee,
    });
  } catch (err) {
    if (
      err !== null &&
      typeof err === "object" &&
      "code" in err &&
      err.code === 11000
    ) {
      return res.status(409).json({ message: API_MESSAGES.DUPLICATE_EMAIL });
    }
    console.error(err);
    return res.status(500).json({ message: API_MESSAGES.SERVER_ERROR });
  }
}

export async function getEmployees(req: Request, res: Response) {
  if (!req.user?.organization) {
    return res.status(401).json({ message: API_MESSAGES.UNAUTHORIZED });
  }

  // TODO: validate page/limit with Zod — currently negative or decimal
  // values cause a MongoDB error and surface as a 500
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  const filter = { organization: req.user.organization };

  try {
    const [employees, total] = await Promise.all([
      Employee.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Employee.countDocuments(filter),
    ]);

    return res.status(200).json({
      employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: API_MESSAGES.SERVER_ERROR });
  }
}
