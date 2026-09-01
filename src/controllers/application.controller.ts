import { Request, Response } from "express";
import { API_MESSAGES } from "../constants/api.messages";
import Employee from "../models/Employee";
import Application from "../models/Application";
import mongoose from "mongoose";

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
