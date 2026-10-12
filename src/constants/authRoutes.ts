/** Path of the login screen (the index route of the logged-out tree). */
export const LOGIN_PATH = '/';

/** Path of the OTP-based forgot-password screen. */
export const FORGOT_PASSWORD_PATH = '/forgot-password';

/**
 * Routes that only exist while logged out. They must never be stored as a
 * post-login redirect target: after authenticating, the authenticated route
 * tree has no such path and the user would land on NotFound.
 */
export const PUBLIC_AUTH_PATHS: readonly string[] = [LOGIN_PATH, FORGOT_PASSWORD_PATH];
