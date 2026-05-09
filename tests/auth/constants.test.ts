import { describe, it, expect } from "vitest";
import {
  AUTH_ROUTES,
  AUTH_STORAGE_KEYS,
  PASSWORD_MIN_LENGTH,
} from "@/modules/auth/constants";

describe("Auth Constants", () => {
  it("has correct auth routes", () => {
    expect(AUTH_ROUTES.LOGIN).toBe("/auth/login");
    expect(AUTH_ROUTES.SIGNUP).toBe("/auth/signup");
    expect(AUTH_ROUTES.VERIFY).toBe("/auth/verify");
  });

  it("has a reasonable minimum password length", () => {
    expect(PASSWORD_MIN_LENGTH).toBeGreaterThanOrEqual(8);
  });

  it("has correct storage keys", () => {
    expect(AUTH_STORAGE_KEYS.PENDING_EMAIL).toBe("zone-auth-pending-email");
  });
});
