import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getMyAccount = createServerFn({ method: "GET" })
  .handler(async () => {
    // No database — return placeholder account data
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
      wallet: { balance: 0, status: "ACTIVE" },
      isAdmin: true,
    };
  });

export const getDashboardStats = createServerFn({ method: "GET" })
  .handler(async () => {
    // No database — return empty stats
    return {
      balance: 0,
      walletStatus: "ACTIVE",
      totalCount: 0,
      successCount: 0,
      pendingCount: 0,
      failedCount: 0,
      successAmount: 0,
      todayCount: 0,
      todayAmount: 0,
      recent: [],
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
    // No database — return empty transaction list
    return {
      items: [],
      pagination: {
        page: data.page,
        limit: data.limit,
        total: 0,
        totalPages: 1,
      },
    };
  });
