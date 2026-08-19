import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const listRetailers = createServerFn({ method: "GET" })
  .handler(async () => {
    const { fetchRetailers } = await import("./admin.server");
    return fetchRetailers();
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
  .handler(async ({ data }) => {
    const { adjustRetailerWallet } = await import("./admin.server");
    return adjustRetailerWallet(data.userId, data.amount, data.note);
  });

export const setWalletStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid(), status: z.enum(["ACTIVE", "BLOCKED"]) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { updateWalletStatus } = await import("./admin.server");
    return updateWalletStatus(data.userId, data.status);
  });

export const setRetailerActive = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid(), isActive: z.boolean() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { updateRetailerActive } = await import("./admin.server");
    return updateRetailerActive(data.userId, data.isActive);
  });
