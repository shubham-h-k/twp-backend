import { Role } from "../constants/roles";

export interface AuthPayload {
  userId: string;
  role: Role;
  organization?: string;
}
