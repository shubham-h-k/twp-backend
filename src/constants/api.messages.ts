export const API_MESSAGES = {
  // errors
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Not permitted",
  INVALID_CREDENTIALS: "Invalid email or password",
  MISSING_FIELDS: "Missing required field",
  DUPLICATE_EMAIL: "Email already registered",
  SERVER_ERROR: "Something went wrong",
  EMPLOYEE_NOT_FOUND: "Employee not found",
  APPLICATION_CREATED: "Application created",
  INVALID_ID: "Invalid ID",
  ROUTE_NOT_FOUND: "Route not found",
  INVALID_INPUT: "Invalid input",

  // success
  USER_CREATED: "User created",
  LOGIN_SUCCESS: "Login successful",
} as const;
