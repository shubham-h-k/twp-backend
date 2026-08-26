import mongoose from "mongoose";
import { MODELS } from "../constants/models";
import {
  APPLICATION_STATUSES,
  DEFAULT_APPLICATION_STATUS,
} from "../constants/application.status";

const applicationSchema = new mongoose.Schema(
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

export default mongoose.model(MODELS.APPLICATION, applicationSchema);
