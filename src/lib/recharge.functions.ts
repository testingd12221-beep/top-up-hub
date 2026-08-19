import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const rechargeSchema = z.object({
  mobileNumber: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  amount: z.number().positive().max(100000),
  operatorId: z.string().min(1),
  circleId: z.string().min(1),
  type: z.enum(["MOBILE_PREPAID", "MOBILE_POSTPAID"]),
});

export const getOperators = createServerFn({ method: "GET" })
  .inputValidator((input: { type?: string }) => input ?? {})
  .handler(async ({ data }) => {
    const { fetchOperators } = await import("./recharge.server");
    return fetchOperators(data.type);
  });

export const getCircles = createServerFn({ method: "GET" })
  .handler(async () => {
    const { fetchCircles } = await import("./recharge.server");
    return fetchCircles();
  });

export const getPlans = createServerFn({ method: "GET" })
  .inputValidator((input: { operatorId: string; circleId: string }) =>
    z.object({ operatorId: z.string().min(1), circleId: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { fetchPlans } = await import("./recharge.server");
    return fetchPlans(data.operatorId, data.circleId);
  });

export const createRecharge = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => rechargeSchema.parse(input))
  .handler(async ({ data }) => {
    const { initiateRecharge } = await import("./recharge.server");
    return initiateRecharge(data);
  });

export const listRecharges = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(10),
        status: z.string().optional(),
        mobileNumber: z.string().optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const from = (data.page - 1) * data.limit;
    let query = supabaseAdmin
      .from("recharges")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, from + data.limit - 1);

    if (data.status) query = query.eq("status", data.status);
    if (data.mobileNumber) query = query.ilike("mobile_number", `%${data.mobileNumber}%`);

    const { data: items, count, error } = await query;
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

export const checkTransactionStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ txnId: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { syncTransactionStatus } = await import("./recharge.server");
    return syncTransactionStatus(data.txnId);
  });
