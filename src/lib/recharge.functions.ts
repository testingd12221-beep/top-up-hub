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
  .validator((input: { type?: string }) => input ?? {})
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
  .validator((input: { operatorId: string; circleId: string }) =>
    z.object({ operatorId: z.string().min(1), circleId: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { fetchPlans } = await import("./recharge.server");
    return fetchPlans(data.operatorId, data.circleId);
  });

export const createRecharge = createServerFn({ method: "POST" })
  .validator((input: unknown) => rechargeSchema.parse(input))
  .handler(async ({ data }) => {
    const { initiateRecharge } = await import("./recharge.server");
    return initiateRecharge(data);
  });

export const listRecharges = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
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
    const { fetchRechargeHistory } = await import("./recharge.server");
    const result = await fetchRechargeHistory({
      page: data.page,
      limit: data.limit,
      status: data.status,
      mobileNumber: data.mobileNumber,
    });

    // Map API response to match the format expected by the frontend
    const items = (result.items ?? []).map((r) => ({
      id: r.txnId,
      txn_id: r.txnId,
      user_id: "default",
      mobile_number: r.mobileNumber,
      amount: r.amount,
      operator_id: "",
      operator_name: r.operator?.name ?? null,
      circle_id: "",
      type: "MOBILE_PREPAID",
      status: r.status,
      provider_txn_id: null,
      operator_ref: null,
      created_at: r.createdAt,
      updated_at: r.createdAt,
    }));

    return {
      items,
      pagination: result.pagination,
    };
  });

export const checkTransactionStatus = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ txnId: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { syncTransactionStatus } = await import("./recharge.server");
    return syncTransactionStatus(data.txnId);
  });
