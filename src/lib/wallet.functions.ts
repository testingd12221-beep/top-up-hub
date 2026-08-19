import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [profile, wallet, roles] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("wallets").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    return {
      profile: profile.data,
      wallet: wallet.data,
      isAdmin: (roles.data ?? []).some((r) => r.role === "admin"),
    };
  });

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [wallet, recharges, recent] = await Promise.all([
      supabase.from("wallets").select("balance, status").eq("user_id", userId).maybeSingle(),
      supabase.from("recharges").select("amount, status, created_at").eq("user_id", userId),
      supabase
        .from("recharges")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const rows = recharges.data ?? [];
    const sum = (list: typeof rows) => list.reduce((total, r) => total + Number(r.amount), 0);
    const success = rows.filter((r) => r.status === "SUCCESS");
    const pending = rows.filter((r) => ["INITIATED", "PROCESSING", "PENDING"].includes(r.status));
    const failed = rows.filter((r) => ["FAILED", "REFUNDED", "TIMEOUT"].includes(r.status));
    const today = rows.filter((r) => new Date(r.created_at) >= startOfToday);

    return {
      balance: Number(wallet.data?.balance ?? 0),
      walletStatus: wallet.data?.status ?? "ACTIVE",
      totalCount: rows.length,
      successCount: success.length,
      pendingCount: pending.length,
      failedCount: failed.length,
      successAmount: sum(success),
      todayCount: today.length,
      todayAmount: sum(today.filter((r) => r.status === "SUCCESS")),
      recent: recent.data ?? [],
    };
  });

export const listWalletTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(15),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const from = (data.page - 1) * data.limit;
    const {
      data: items,
      count,
      error,
    } = await context.supabase
      .from("wallet_transactions")
      .select("*", { count: "exact" })
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .range(from, from + data.limit - 1);
    if (error) throw new Error(error.message);
    return {
      items: items ?? [],
      pagination: {
        page: data.page,
        limit: data.limit,
        total: count ?? 0,
        totalPages: Math.max(1, Math.ceil((count ?? 0) / data.limit)),
      },
    };
  });
