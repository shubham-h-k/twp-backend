export const API_MESSAGES = {
  // errors
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Not permitted",
  INVALID_CREDENTIALS: "Invalid email or password",
  MISSING_FIELDS: "Missing required field",
  DUPLICATE_EMAIL: "Email already registered",
  SERVER_ERROR: "Something went wrong",

  // success
  USER_CREATED: "User created",
  LOGIN_SUCCESS: "Login successful",
} as const;
