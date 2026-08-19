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

export type WalletInfo = {
  balance: number;
  status: string;
  walletLimit?: number;
  currency?: string;
};

export type RechargeItem = {
  txnId: string;
  mobileNumber: string;
  amount: number;
  status: string;
  operator?: { name: string };
  createdAt: string;
};

export type RechargeListResponse = {
  items: RechargeItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

/* ── Operators, Circles, Plans ── */

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

/* ── Wallet ── */

export async function fetchWallet() {
  const data = await reachpays<{ wallet: WalletInfo }>("/wallet");
  return data.wallet ?? { balance: 0, status: "ACTIVE" };
}

/* ── Recharge ── */

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

export async function fetchRechargeHistory(params: {
  page?: number | undefined;
  limit?: number | undefined;
  status?: string | undefined;
  mobileNumber?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
}) {
  const data = await reachpays<RechargeListResponse>("/recharge", {
    query: {
      page: params.page,
      limit: params.limit,
      status: params.status,
      mobileNumber: params.mobileNumber,
      startDate: params.startDate,
      endDate: params.endDate,
    },
  });
  return {
    items: data.items ?? [],
    pagination: data.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 1 },
  };
}

export async function syncTransactionStatus(txnId: string) {
  const result = await reachpays<{
    txnId: string;
    status: string;
    mobileNumber: string;
    amount: number;
    providerTxnId?: string;
    operatorRef?: string;
    createdAt?: string;
  }>(`/recharge/${encodeURIComponent(txnId)}`);

  return result;
}
