import { requireSupabase, supabase } from "./supabase-client.js";

const canonicalProductionUrl = "https://carina.tonli.dev";

export function getAuthRedirectUrl({
  origin = globalThis.location?.origin,
  productionUrl = import.meta.env.VITE_PUBLIC_APP_URL,
  isProduction = import.meta.env.PROD
} = {}) {
  const baseUrl = isProduction
    ? productionUrl || canonicalProductionUrl
    : origin || productionUrl || canonicalProductionUrl;

  return new URL("/", baseUrl).toString();
}

export async function signUpWithEmail(email, password) {
  return requireSupabase().auth.signUp({ email, password, options: { emailRedirectTo: getAuthRedirectUrl() } });
}

export async function signInWithEmail(email, password) {
  return requireSupabase().auth.signInWithPassword({ email, password });
}

export async function signInWithGoogle() {
  return requireSupabase().auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: getAuthRedirectUrl() }
  });
}

export async function requestPasswordReset(email) {
  return requireSupabase().auth.resetPasswordForEmail(email, { redirectTo: getAuthRedirectUrl() });
}

export async function updatePassword(password) {
  return requireSupabase().auth.updateUser({ password });
}

export async function signOut() {
  return requireSupabase().auth.signOut();
}

export async function updateProfile(displayName) {
  const client = requireSupabase();
  const { data: sessionData } = await client.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) throw new Error("Prijavite se prije uređivanja profila.");
  return client.from("profiles").update({ display_name: displayName, updated_at: new Date().toISOString() }).eq("id", userId);
}

export async function getCurrentSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthStateChange(callback) {
  if (!supabase) return { unsubscribe() {} };
  const { data } = supabase.auth.onAuthStateChange((event, session) => callback(event, session));
  return data.subscription;
}
