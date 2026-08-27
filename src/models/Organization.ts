import mongoose from "mongoose";
import { MODELS } from "../constants/models";

interface IOrganization {
  name: string;
}

const organizationSchema = new mongoose.Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true, unique: true },
  },
  { timestamps: true },
);

export default mongoose.model<IOrganization>(
  MODELS.ORGANIZATION,
  organizationSchema,
);
