import { reachpays, ProviderError } from "./reachpays.server";

export { ProviderError };

export type Operator = { _id: string; name: string; code: string; type: string };
export type Circle = { _id: string; name: string; code: string };
export type Plan = {
  amount: number;
  validity?: string;
  dataAmount?: string;
  description?: string;
  isPopular?: boolean;
};

export async function fetchOperators(type?: string) {
  const data = await reachpays<{ operators: Operator[] }>("/operators", {
    query: { type },
  });
  return data.operators ?? [];
}

export async function fetchCircles() {
  const data = await reachpays<{ circles: Circle[] }>("/circles");
  return data.circles ?? [];
}

export async function fetchPlans(operatorId: string, circleId: string) {
  const data = await reachpays<{ popularPlans?: Plan[]; allPlans?: Plan[]; total?: number }>(
    "/plans",
    { query: { operatorId, circleId } },
  );
  return {
    popularPlans: data.popularPlans ?? [],
    allPlans: data.allPlans ?? [],
    total: data.total ?? 0,
  };
}

export async function initiateRecharge(input: {
  mobileNumber: string;
  amount: number;
  operatorId: string;
  circleId: string;
  type: "MOBILE_PREPAID" | "MOBILE_POSTPAID";
}) {
  const result = await reachpays<{
    txnId: string;
    status: string;
    mobileNumber: string;
    amount: number;
    operator?: string;
    createdAt?: string;
  }>("/recharge", { method: "POST", body: input });

  return result;
}

export async function syncTransactionStatus(txnId: string) {
  const result = await reachpays<{
    txnId: string;
    status: string;
    providerTxnId?: string;
    operatorRef?: string;
  }>(`/recharge/${encodeURIComponent(txnId)}`);

  return result;
}
