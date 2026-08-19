import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const listRetailers = createServerFn({ method: "GET" })
  .handler(async () => {
    // No database — return empty list
    return [];
  });

export const creditRetailerWallet = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
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
  .handler(async () => {
    // No database — wallet adjustment is not available
    throw new Error("Wallet operations require a database connection");
  });

export const setWalletStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid(), status: z.enum(["ACTIVE", "BLOCKED"]) }).parse(input),
  )
  .handler(async () => {
    throw new Error("Wallet operations require a database connection");
  });

export const setRetailerActive = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid(), isActive: z.boolean() }).parse(input),
  )
  .handler(async () => {
    throw new Error("Retailer operations require a database connection");
  });
