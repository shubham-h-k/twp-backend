import mongoose from "mongoose";
import { MODELS } from "../constants/models";
import {
  APPLICATION_STATUSES,
  ApplicationStatus,
  DEFAULT_APPLICATION_STATUS,
} from "../constants/application.status";

interface IApplication {
  employee: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  status: ApplicationStatus;
  caseworker?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
}

const applicationSchema = new mongoose.Schema<IApplication>(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: MODELS.EMPLOYEE,
      required: true,
      index: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: MODELS.ORGANIZATION,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: DEFAULT_APPLICATION_STATUS,
      required: true,
    },
    caseworker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: MODELS.USER,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: MODELS.USER,
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model<IApplication>(
  MODELS.APPLICATION,
  applicationSchema,
);
