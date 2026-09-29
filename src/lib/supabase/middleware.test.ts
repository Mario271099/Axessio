import { describe, it, expect } from "vitest";
import { isPrivateRoute } from "./middleware";

// ============================================================================
// isPrivateRoute - seuls les espaces privés redirigent un visiteur anonyme
// vers /login ; le reste (marketing, images OG, URL inconnues) doit passer.
// ============================================================================
describe("isPrivateRoute", () => {
  it.each([
    "/dashboard",
    "/audits/123e4567/matrix",
    "/clients",
    "/organizations/acme/billing",
    "/admin/users",
    "/onboarding/plan",
    "/api/audits/abc/report",
  ])("protège %s", (path) => {
    expect(isPrivateRoute(path)).toBe(true);
  });

  it.each([
    "/",
    "/pricing",
    "/login",
    "/accessibility",
    "/opengraph-image",
    "/twitter-image",
    "/apple-icon",
    "/page-inexistante",
    "/api/cron/audit-status-auto",
    "/api/webhooks/stripe",
    "/api/v1/audits",
  ])("laisse passer %s", (path) => {
    expect(isPrivateRoute(path)).toBe(false);
  });

  it("ne confond pas un préfixe avec un mot plus long", () => {
    expect(isPrivateRoute("/auditsxyz")).toBe(false);
    expect(isPrivateRoute("/dashboards")).toBe(false);
  });
});
