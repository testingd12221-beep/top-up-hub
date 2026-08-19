import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type AdminRetailer = {
  id: string;
  shop_name: string | null;
  full_name: string | null;
  email: string | null;
  rechargeCount: number;
  successAmount: number;
  balance: number;
  walletStatus: "ACTIVE" | "BLOCKED";
  is_active: boolean;
};

export const listRetailers = createServerFn({ method: "GET" })
  .handler(async (): Promise<AdminRetailer[]> => {
    // No database — return empty list
    return [];
  });

export const creditRetailerWallet = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        amount: z
          .number()
          .min(-1000000)
          .max(1000000)
          .refine((v) => v !== 0, "Amount cannot be zero"),
        note: z.string().max(200).optional(),
      })
      .parse(input),
  )
  .handler(async (): Promise<{ balance: number }> => {
    // No database — wallet adjustment is not available
    throw new Error("Wallet operations require a database connection");
  });

export const setWalletStatus = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ userId: z.string().uuid(), status: z.enum(["ACTIVE", "BLOCKED"]) }).parse(input),
  )
  .handler(async () => {
    throw new Error("Wallet operations require a database connection");
  });

export const setRetailerActive = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ userId: z.string().uuid(), isActive: z.boolean() }).parse(input),
  )
  .handler(async () => {
    throw new Error("Retailer operations require a database connection");
  });
