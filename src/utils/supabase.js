/**
 * supabase.js — Client Supabase pour auth + base de données
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ── Profil utilisateur ────────────────────────────────────────────────────────

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data;
}

export async function createProfile(userId, email) {
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      email,
      plan: "free",
      videos_used: 0,
      videos_limit: 5,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function incrementVideoCount(userId) {
  const { data, error } = await supabase.rpc("increment_videos_used", {
    user_id: userId,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function upgradePlan(userId, plan) {
  const limits = { free: 5, pro: 999, unlimited: 999999 };
  const { error } = await supabase
    .from("profiles")
    .update({
      plan,
      videos_limit: limits[plan],
      upgraded_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) throw new Error(error.message);
}

// ── Paiements ─────────────────────────────────────────────────────────────────

export async function savePendingPayment(userId, plan, txHash) {
  const { error } = await supabase.from("payments").insert({
    user_id: userId,
    plan,
    tx_hash: txHash,
    amount_usdc: plan === "pro" ? 19 : 49,
    status: "pending",
    created_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}
