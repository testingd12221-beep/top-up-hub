import { reachpays, ProviderError } from "./reachpays.server";

export type Operator = { _id: string; name: string; code: string; type: string };
export type Circle = { _id: string; name: string; code: string };
export type Plan = {
  amount: number;
  validity?: string;
  dataAmount?: string;
  description?: string;
  isPopular?: boolean;
};

export const REFUND_STATUSES = ["FAILED", "REFUNDED", "TIMEOUT"];
export const FINAL_STATUSES = ["SUCCESS", "FAILED", "REFUNDED", "TIMEOUT"];

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

async function adjustWallet(
  userId: string,
  amount: number,
  type: string,
  description: string,
  reference: string,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("adjust_wallet", {
    _user_id: userId,
    _amount: amount,
    _type: type,
    _description: description,
    _reference: reference,
  });
  if (error) throw new ProviderError(error.message, 402);
  return Number(data);
}

export async function initiateRecharge(
  input: {
    mobileNumber: string;
    amount: number;
    operatorId: string;
    circleId: string;
    type: "MOBILE_PREPAID" | "MOBILE_POSTPAID";
  },
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Use a default user ID since there is no user authentication
  const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000";

  const { data: wallet, error: walletError } = await supabaseAdmin
    .from("wallets")
    .select("balance, status, user_id")
    .limit(1)
    .maybeSingle();
  if (walletError) throw new ProviderError(walletError.message, 500);
  if (!wallet) throw new ProviderError("Wallet not found", 404);
  if (wallet.status !== "ACTIVE") throw new ProviderError("Your wallet is not active", 403);
  if (Number(wallet.balance) < input.amount)
    throw new ProviderError("Insufficient wallet balance", 402);

  const userId = wallet.user_id ?? DEFAULT_USER_ID;
  const reference = `RCH-${Date.now()}`;
  await adjustWallet(
    userId,
    -input.amount,
    "DEBIT",
    `Recharge ${input.mobileNumber}`,
    reference,
  );

  let result: {
    txnId: string;
    status: string;
    mobileNumber: string;
    amount: number;
    operator?: string;
    createdAt?: string;
  };
  try {
    result = await reachpays("/recharge", { method: "POST", body: input });
  } catch (error) {
    await adjustWallet(
      userId,
      input.amount,
      "REFUND",
      `Refund — recharge not initiated for ${input.mobileNumber}`,
      reference,
    );
    throw error;
  }

  await supabaseAdmin.from("recharges").insert({
    user_id: userId,
    txn_id: result.txnId,
    mobile_number: input.mobileNumber,
    amount: input.amount,
    operator_id: input.operatorId,
    operator_name: result.operator ?? null,
    circle_id: input.circleId,
    type: input.type,
    status: result.status ?? "INITIATED",
  });

  if (REFUND_STATUSES.includes(result.status)) {
    await refundIfNeeded(userId, result.txnId, input.amount, input.mobileNumber);
  }

  return result;
}

export async function refundIfNeeded(
  userId: string,
  txnId: string,
  amount: number,
  mobileNumber: string,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: existing } = await supabaseAdmin
    .from("wallet_transactions")
    .select("id")
    .eq("user_id", userId)
    .eq("reference", txnId)
    .eq("type", "REFUND")
    .maybeSingle();
  if (existing) return;
  await adjustWallet(userId, amount, "REFUND", `Refund — recharge failed ${mobileNumber}`, txnId);
}

export async function syncTransactionStatus(txnId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: row, error } = await supabaseAdmin
    .from("recharges")
    .select("*")
    .eq("txn_id", txnId)
    .maybeSingle();
  if (error) throw new ProviderError(error.message, 500);
  if (!row) throw new ProviderError("Transaction not found", 404);

  if (FINAL_STATUSES.includes(row.status)) return row;

  const remote = await reachpays<{
    txnId: string;
    status: string;
    providerTxnId?: string;
    operatorRef?: string;
  }>(`/recharge/${encodeURIComponent(txnId)}`);

  const { data: updated } = await supabaseAdmin
    .from("recharges")
    .update({
      status: remote.status,
      provider_txn_id: remote.providerTxnId ?? null,
      operator_ref: remote.operatorRef ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("txn_id", txnId)
    .select("*")
    .maybeSingle();

  if (REFUND_STATUSES.includes(remote.status)) {
    await refundIfNeeded(row.user_id, txnId, Number(row.amount), row.mobile_number);
  }

  return updated ?? row;
}
