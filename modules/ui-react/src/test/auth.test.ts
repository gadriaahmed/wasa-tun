import { describe, expect, it, beforeEach } from "vitest";
import { AUTH_STORAGE_KEYS } from "@/lib/constants";
import { clearAuthStorage } from "@/api/client";

describe("auth storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("clears all auth keys", () => {
    localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, "token");
    localStorage.setItem(AUTH_STORAGE_KEYS.email, "user@example.com");
    clearAuthStorage();
    expect(localStorage.getItem(AUTH_STORAGE_KEYS.accessToken)).toBeNull();
    expect(localStorage.getItem(AUTH_STORAGE_KEYS.email)).toBeNull();
  });
});
