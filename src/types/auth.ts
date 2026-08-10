export interface AuthPayload {
  userId: string;
  role: "org_staff" | "caseworker";
  organization?: string;
}
