export const AUTH_ROUTES = {
  LOGIN: "/auth/login",
  SIGNUP: "/auth/signup",
  VERIFY: "/auth/verify",
} as const;

export const AUTH_STORAGE_KEYS = {
  PENDING_EMAIL: "zone-auth-pending-email",
  PENDING_NAME: "zone-auth-pending-name",
  // Stored to keep the resend cooldown honest across reloads — otherwise the
  // user could refresh and immediately re-trigger an email.
  RESEND_COOLDOWN_UNTIL: "zone-auth-resend-cooldown-until",
} as const;

// Cooldown between resend-code requests, in seconds.
export const RESEND_COOLDOWN_SECONDS = 60;

export const PASSWORD_MIN_LENGTH = 8;
