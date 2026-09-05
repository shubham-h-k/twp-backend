import mongoose from "mongoose";
import { MODELS } from "../constants/models";

export interface IEmployee {
  firstName: string;
  lastName?: string;
  email?: string;
  organization: mongoose.Types.ObjectId;
  birthDate: Date;
  nationality: string;
  passportNumber?: string;
}

const employeeSchema = new mongoose.Schema<IEmployee>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: MODELS.ORGANIZATION,
      required: true,
    },
    birthDate: {
      type: Date,
      required: true,
    },
    nationality: {
      type: String,
      required: true,
      trim: true,
    },
    passportNumber: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

// unique per organization, not globally
employeeSchema.index(
  { organization: 1, email: 1 },
  { unique: true, sparse: true },
);

export default mongoose.model<IEmployee>(MODELS.EMPLOYEE, employeeSchema);
