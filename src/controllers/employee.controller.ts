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
