import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getMyAccount = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [profile, wallet, roles] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").limit(1).maybeSingle(),
      supabaseAdmin.from("wallets").select("*").limit(1).maybeSingle(),
      supabaseAdmin.from("user_roles").select("role"),
    ]);
    return {
      profile: profile.data,
      wallet: wallet.data,
      isAdmin: (roles.data ?? []).some((r) => r.role === "admin"),
    };
  });

export const getDashboardStats = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [wallet, recharges, recent] = await Promise.all([
      supabaseAdmin.from("wallets").select("balance, status").limit(1).maybeSingle(),
      supabaseAdmin.from("recharges").select("amount, status, created_at"),
      supabaseAdmin
        .from("recharges")
        .select("*")
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
  .inputValidator((input: unknown) =>
    z
      .object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(15),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const from = (data.page - 1) * data.limit;
    const {
      data: items,
      count,
      error,
    } = await supabaseAdmin
      .from("wallet_transactions")
      .select("*", { count: "exact" })
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
