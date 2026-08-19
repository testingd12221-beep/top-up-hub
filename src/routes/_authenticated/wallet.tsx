import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { getMyAccount, listWalletTransactions } from "@/lib/wallet.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet — RechargeHub" },
      {
        name: "description",
        content: "Wallet balance with a full credit, debit and refund history.",
      },
      { property: "og:title", content: "Wallet — RechargeHub" },
      { property: "og:description", content: "Track wallet credits, debits and refunds." },
    ],
  }),
  component: WalletPage,
});

function WalletPage() {
  const [page, setPage] = useState(1);
  const fetchAccount = useServerFn(getMyAccount);
  const fetchTransactions = useServerFn(listWalletTransactions);

  const account = useQuery({ queryKey: ["my-account"], queryFn: () => fetchAccount() });
  const transactions = useQuery({
    queryKey: ["wallet-transactions", page],
    queryFn: () => fetchTransactions({ data: { page, limit: 15 } }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Wallet</h1>
        <p className="text-sm text-muted-foreground">
          Your wallet is topped up by the admin. Recharges are debited instantly.
        </p>
      </div>

      <Card className="bg-brand-gradient text-primary-foreground">
        <CardContent className="p-6">
          <p className="text-xs uppercase tracking-wide opacity-80">Available balance</p>
          {account.isLoading ? (
            <Skeleton className="mt-2 h-9 w-40" />
          ) : (
            <p className="mt-1 font-display text-4xl font-bold">
              {formatCurrency(Number(account.data?.wallet?.balance ?? 0))}
            </p>
          )}
          <p className="mt-2 text-sm opacity-80">
            Wallet status: {account.data?.wallet?.status ?? "—"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Wallet history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {transactions.isLoading && <Skeleton className="h-40 w-full" />}
          {transactions.isError && (
            <p className="text-sm text-destructive">{(transactions.error as Error).message}</p>
          )}
          {transactions.data?.items.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No wallet activity yet.
            </p>
          )}
          {transactions.data?.items.map((item) => {
            const credit = Number(item.amount) > 0;
            return (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full",
                      credit ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive",
                    )}
                  >
                    {credit ? (
                      <ArrowDownLeft className="h-4 w-4" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{item.description ?? item.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(item.created_at)} · {item.type}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      "font-display font-semibold",
                      credit ? "text-success" : "text-destructive",
                    )}
                  >
                    {credit ? "+" : "-"}
                    {formatCurrency(Math.abs(Number(item.amount)))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Balance {formatCurrency(Number(item.balance_after))}
                  </p>
                </div>
              </div>
            );
          })}

          {transactions.data && transactions.data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {transactions.data.pagination.page} of {transactions.data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= transactions.data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
