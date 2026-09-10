import { Request, Response } from "express";
import { API_MESSAGES } from "../constants/api.messages";
import Employee from "../models/Employee";
import Application from "../models/Application";
import mongoose from "mongoose";
import { ROLE } from "../constants/roles";
import { assertNever } from "../utils/assert";

export async function createApplication(req: Request, res: Response) {
  const { employeeId } = req.body || {};

  if (!employeeId) {
    return res.status(400).json({ message: API_MESSAGES.MISSING_FIELDS });
  }

  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    return res.status(400).json({ message: API_MESSAGES.INVALID_ID });
  }

  try {
    const employee = await Employee.findById(employeeId);

    if (
      !employee ||
      !req.user?.organization ||
      !employee.organization.equals(req.user.organization)
    ) {
      return res.status(404).json({ message: API_MESSAGES.EMPLOYEE_NOT_FOUND });
    }

    const application = await Application.create({
      employee: employee._id,
      organization: req.user.organization,
      createdBy: req.user.userId,
    });

    return res.status(201).json({
      message: API_MESSAGES.APPLICATION_CREATED,
      applicationId: application._id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: API_MESSAGES.SERVER_ERROR });
  }
}

export async function getApplications(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: API_MESSAGES.UNAUTHORIZED });
  }

  // TODO: validate page/limit with Zod — currently negative or decimal
  // values cause a MongoDB error and surface as a 500
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  let filter: Record<string, unknown> = {};

  if (req.user.role === ROLE.ORG_STAFF) {
    filter = { organization: req.user.organization };
  } else if (req.user.role === ROLE.CASEWORKER) {
    const assigned = req.query.assigned;
    if (assigned !== undefined && assigned !== "me" && assigned !== "none") {
      return res.status(400).json({ message: API_MESSAGES.INVALID_INPUT });
    }
    if (assigned === "me") filter = { caseworker: req.user.userId };
    else if (assigned === "none") filter = { caseworker: null };
  } else {
    assertNever(req.user.role);
  }

  try {
    const [applications, total] = await Promise.all([
      Application.find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("employee", "firstName lastName")
        .populate("organization", "name"),
      Application.countDocuments(filter),
    ]);

    return res.status(200).json({
      applications,
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
