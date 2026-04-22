/** Cookie name for the HTTP-only session JWT. */
export const SESSION_COOKIE_NAME = "session";

export const JWT_ISSUER = "user-tracker";

export const JWT_AUDIENCE = "user-tracker-app";

/** JWT and cookie max age (7 days). */
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

export const AUTH_SIGN_IN_PATH = "/sign-in";
