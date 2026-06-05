import { requireSupabase } from "./supabase-client.js";
import { getPremiumPackage } from "./premium.js";

export async function createPremiumCheckout(packageId, contentVersion = null) {
  if (!getPremiumPackage(packageId)) throw new Error("Odabrani premium paket nije dostupan.");

  const { data, error } = await requireSupabase().functions.invoke("create-premium-checkout", {
    body: { packageId, contentVersion }
  });

  if (error) throw error;
  if (!data?.checkoutUrl) throw new Error("Checkout link trenutno nije dostupan.");
  return data.checkoutUrl;
}
