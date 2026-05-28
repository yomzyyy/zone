export const AUTH_ROUTES = {
  LOGIN: "/auth/login",
  SIGNUP: "/auth/signup",
  VERIFY: "/auth/verify",
} as const;

export const AUTH_STORAGE_KEYS = {
  PENDING_EMAIL: "zone-auth-pending-email",
  PENDING_NAME: "zone-auth-pending-name",
  RESEND_COOLDOWN_UNTIL: "zone-auth-resend-cooldown-until",
} as const;

export const RESEND_COOLDOWN_SECONDS = 60;

export const PASSWORD_MIN_LENGTH = 8;
