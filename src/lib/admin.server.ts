import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Client = SupabaseClient<Database>;

export async function assertAdmin(supabase: Client, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden — admin access required");
}

export async function fetchRetailers() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [profiles, wallets, recharges] = await Promise.all([
    supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("wallets").select("*"),
    supabaseAdmin.from("recharges").select("user_id, amount, status"),
  ]);
  if (profiles.error) throw new Error(profiles.error.message);

  const walletMap = new Map((wallets.data ?? []).map((w) => [w.user_id, w]));
  const stats = new Map<string, { count: number; success: number }>();
  for (const row of recharges.data ?? []) {
    const current = stats.get(row.user_id) ?? { count: 0, success: 0 };
    current.count += 1;
    if (row.status === "SUCCESS") current.success += Number(row.amount);
    stats.set(row.user_id, current);
  }

  return (profiles.data ?? []).map((profile) => ({
    ...profile,
    balance: Number(walletMap.get(profile.id)?.balance ?? 0),
    walletStatus: walletMap.get(profile.id)?.status ?? "ACTIVE",
    rechargeCount: stats.get(profile.id)?.count ?? 0,
    successAmount: stats.get(profile.id)?.success ?? 0,
  }));
}

export async function adjustRetailerWallet(userId: string, amount: number, note?: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("adjust_wallet", {
    _user_id: userId,
    _amount: amount,
    _type: amount > 0 ? "CREDIT" : "DEBIT",
    _description: note || (amount > 0 ? "Wallet credited by admin" : "Wallet debited by admin"),
    _reference: `ADMIN-${Date.now()}`,
  });
  if (error) throw new Error(error.message);
  return { balance: Number(data) };
}

export async function updateWalletStatus(userId: string, status: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("wallets").update({ status }).eq("user_id", userId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function updateRetailerActive(userId: string, isActive: boolean) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", userId);
  if (error) throw new Error(error.message);
  return { ok: true };
}
