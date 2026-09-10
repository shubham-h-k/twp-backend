export const ROLE = {
  ORG_STAFF: "org_staff",
  CASEWORKER: "caseworker",
} as const;

export const ROLES = Object.values(ROLE); // for the Mongoose enum
export type Role = (typeof ROLE)[keyof typeof ROLE]; // "org_staff" | "caseworker"
