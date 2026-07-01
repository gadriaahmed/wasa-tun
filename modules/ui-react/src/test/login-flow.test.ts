import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { login, getPermissions } from "@/api/auth";
import { clearAuthStorage, getStoredAuthorization } from "@/api/client";
import { AUTH_STORAGE_KEYS } from "@/lib/constants";

const server = setupServer(
  http.post("/api/v1/authentication/login", ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (auth !== `Basic ${btoa("admin:admin")}`) {
      return HttpResponse.json({ error: true }, { status: 401 });
    }
    return HttpResponse.json({
      access_token: btoa("admin:admin"),
      token_type: "Basic",
    });
  }),
  http.get("/api/v1/authorization/users/admin/permissions", ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (auth !== `Basic ${btoa("admin:admin")}`) {
      return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return HttpResponse.json({
      permissionsList: [
        { applicationName: "MyApp", permissions: ["ADMIN", "SUPERADMIN"] },
      ],
    });
  })
);

describe("login flow", () => {
  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
    clearAuthStorage();
  });
  afterAll(() => server.close());

  it("loads permissions with Basic token after login", async () => {
    const result = await login("admin", "admin");
    expect(result.access_token).toBe(btoa("admin:admin"));

    localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, result.access_token);
    localStorage.setItem(AUTH_STORAGE_KEYS.tokenType, result.token_type);

    const permissions = await getPermissions(
      "admin",
      result.token_type,
      result.access_token
    );
    expect(permissions.permissionsList).toHaveLength(1);
    expect(getStoredAuthorization()).toBe(`Basic ${result.access_token}`);
  });
});
