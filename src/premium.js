const DAY_MS = 24 * 60 * 60 * 1000;

export const PREMIUM_PACKAGES = [
  {
    id: "premium_30_days",
    title: "30 dana",
    price: "20 KM",
    description: "Kompletan premium set pitanja i simulacija ispita tokom jednog mjeseca.",
    badge: "Najbrži start",
    durationDays: 30
  },
  {
    id: "premium_90_days",
    title: "90 dana",
    price: "35 KM",
    description: "Najbolji omjer cijene i trajanja za ozbiljnu pripremu.",
    badge: "Preporučeno",
    durationDays: 90
  },
  {
    id: "premium_lifetime",
    title: "Zauvijek",
    price: "60 KM",
    description: "Stalni pristup trenutnom premium sadržaju bez datuma isteka.",
    badge: "Jednom plati",
    durationDays: null
  }
];

export function getPremiumPackage(packageId) {
  return PREMIUM_PACKAGES.find((item) => item.id === packageId) || null;
}

export function computeEntitlementFromPurchases(purchases = [], now = new Date()) {
  const paidPurchases = purchases
    .filter((purchase) => purchase.status === "paid" && getPremiumPackage(purchase.packageId || purchase.package_id))
    .sort((first, second) => new Date(first.createdAt || first.created_at) - new Date(second.createdAt || second.created_at));

  if (paidPurchases.some((purchase) => (purchase.packageId || purchase.package_id) === "premium_lifetime")) {
    return { tier: "premium", active: true, expires_at: null };
  }

  let cursor = null;
  paidPurchases.forEach((purchase) => {
    const plan = getPremiumPackage(purchase.packageId || purchase.package_id);
    if (!plan?.durationDays) return;
    const createdAt = new Date(purchase.createdAt || purchase.created_at);
    const startsAt = cursor && cursor > createdAt ? cursor : createdAt;
    cursor = new Date(startsAt.getTime() + plan.durationDays * DAY_MS);
  });

  const active = Boolean(cursor && cursor > now);
  return {
    tier: active ? "premium" : "free",
    active,
    expires_at: active ? cursor.toISOString() : null
  };
}
