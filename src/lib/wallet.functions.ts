import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getMyAccount = createServerFn({ method: "GET" })
  .handler(async () => {
    const { fetchWallet } = await import("./recharge.server");
    const wallet = await fetchWallet();
    return {
      profile: {
        id: "default",
        full_name: "Retailer",
        shop_name: "RechargeHub Store",
        email: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      wallet: {
        balance: wallet.balance,
        status: wallet.status,
      },
      isAdmin: true,
    };
  });

export const getDashboardStats = createServerFn({ method: "GET" })
  .handler(async () => {
    const { fetchWallet, fetchRechargeHistory } = await import("./recharge.server");

    const [wallet, rechargeData] = await Promise.all([
      fetchWallet(),
      fetchRechargeHistory({ limit: 100 }),
    ]);

    const rows = rechargeData.items ?? [];
    const sum = (list: typeof rows) => list.reduce((total, r) => total + Number(r.amount), 0);
    const success = rows.filter((r) => r.status === "SUCCESS");
    const pending = rows.filter((r) => ["INITIATED", "PROCESSING", "PENDING"].includes(r.status));
    const failed = rows.filter((r) => ["FAILED", "REFUNDED", "TIMEOUT"].includes(r.status));

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const today = rows.filter((r) => new Date(r.createdAt) >= startOfToday);

    // Get last 5 recharges for "recent" list
    const recent = rows.slice(0, 5).map((r) => ({
      id: r.txnId,
      txn_id: r.txnId,
      mobile_number: r.mobileNumber,
      amount: r.amount,
      status: r.status,
      operator_name: r.operator?.name ?? null,
      type: "MOBILE_PREPAID",
      created_at: r.createdAt,
    }));

    return {
      balance: wallet.balance,
      walletStatus: wallet.status,
      totalCount: rechargeData.pagination.total,
      successCount: success.length,
      pendingCount: pending.length,
      failedCount: failed.length,
      successAmount: sum(success),
      todayCount: today.length,
      todayAmount: sum(today.filter((r) => r.status === "SUCCESS")),
      recent,
    };
  });

export const listWalletTransactions = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z
      .object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(15),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    // Wallet transactions are tracked by ReachPays — use recharge history as the transaction source
    const { fetchRechargeHistory } = await import("./recharge.server");
    const result = await fetchRechargeHistory({ page: data.page, limit: data.limit });

    const items = (result.items ?? []).map((r) => ({
      id: r.txnId,
      user_id: "default",
      type: r.status === "REFUNDED" ? "REFUND" : "DEBIT",
      amount: r.amount,
      balance_after: 0,
      description: `Recharge ${r.mobileNumber} — ${r.status}`,
      reference: r.txnId,
      created_at: r.createdAt,
    }));

    return {
      items,
      pagination: result.pagination,
    };
  });
