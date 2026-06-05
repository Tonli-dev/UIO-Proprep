import { describe, expect, it } from "vitest";
import { PREMIUM_PACKAGES, computeEntitlementFromPurchases, getPremiumPackage } from "../src/premium.js";

describe("premium packages", () => {
  it("mapira tri javna premium paketa", () => {
    expect(PREMIUM_PACKAGES.map((plan) => plan.id)).toEqual([
      "premium_30_days",
      "premium_90_days",
      "premium_lifetime"
    ]);
    expect(getPremiumPackage("premium_30_days")).toMatchObject({ price: "20 KM", durationDays: 30 });
    expect(getPremiumPackage("premium_90_days")).toMatchObject({ price: "35 KM", durationDays: 90 });
    expect(getPremiumPackage("premium_lifetime")).toMatchObject({ price: "60 KM", durationDays: null });
    expect(getPremiumPackage("unknown")).toBeNull();
  });
});

describe("premium entitlement recompute", () => {
  it("produžava vremenske kupovine u redoslijedu kupovine", () => {
    const entitlement = computeEntitlementFromPurchases(
      [
        { packageId: "premium_30_days", status: "paid", createdAt: "2026-06-01T00:00:00Z" },
        { packageId: "premium_90_days", status: "paid", createdAt: "2026-06-10T00:00:00Z" }
      ],
      new Date("2026-06-15T00:00:00Z")
    );

    expect(entitlement).toEqual({
      tier: "premium",
      active: true,
      expires_at: "2026-09-29T00:00:00.000Z"
    });
  });

  it("ignoriše refundirane kupovine", () => {
    const entitlement = computeEntitlementFromPurchases(
      [
        { packageId: "premium_30_days", status: "refunded", createdAt: "2026-06-01T00:00:00Z" }
      ],
      new Date("2026-06-15T00:00:00Z")
    );

    expect(entitlement).toEqual({ tier: "free", active: false, expires_at: null });
  });

  it("lifetime paket nema datum isteka", () => {
    const entitlement = computeEntitlementFromPurchases(
      [
        { packageId: "premium_lifetime", status: "paid", createdAt: "2026-06-01T00:00:00Z" }
      ],
      new Date("2027-01-01T00:00:00Z")
    );

    expect(entitlement).toEqual({ tier: "premium", active: true, expires_at: null });
  });
});
