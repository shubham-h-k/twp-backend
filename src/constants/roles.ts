export const ROLES = ["org_staff", "caseworker"] as const;
export type Role = (typeof ROLES)[number];
