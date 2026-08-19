import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

import { listRecharges, checkTransactionStatus } from "@/lib/recharge.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDateTime, statusTone } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions — RechargeHub" },
      {
        name: "description",
        content: "Recharge transaction history with live status tracking and filters.",
      },
      { property: "og:title", content: "Transactions — RechargeHub" },
      { property: "og:description", content: "Track every recharge and its current status." },
    ],
  }),
  component: TransactionsPage,
});

const STATUSES = ["SUCCESS", "FAILED", "PENDING", "PROCESSING", "INITIATED", "REFUNDED", "TIMEOUT"];

function TransactionsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("ALL");
  const [mobileNumber, setMobileNumber] = useState("");
  const [syncing, setSyncing] = useState<string | null>(null);

  const fetchList = useServerFn(listRecharges);
  const syncStatus = useServerFn(checkTransactionStatus);

  const query = useQuery({
    queryKey: ["recharges", page, status, mobileNumber],
    queryFn: () =>
      fetchList({
        data: {
          page,
          limit: 10,
          status: status === "ALL" ? undefined : status,
          mobileNumber: mobileNumber || undefined,
        },
      }),
  });

  const refreshStatus = async (txnId: string) => {
    setSyncing(txnId);
    try {
      const updated = await syncStatus({ data: { txnId } });
      toast.success(`Status: ${updated.status}`);
      queryClient.invalidateQueries();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not fetch status");
    } finally {
      setSyncing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Transactions</h1>
        <p className="text-sm text-muted-foreground">
          Every recharge you have processed, with live status tracking.
        </p>
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Recharge history</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Search mobile number"
              value={mobileNumber}
              className="w-44"
              onChange={(e) => {
                setPage(1);
                setMobileNumber(e.target.value.replace(/\D/g, ""));
              }}
            />
            <Select
              value={status}
              onValueChange={(value) => {
                setPage(1);
                setStatus(value);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                {STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {query.isLoading && <Skeleton className="h-40 w-full" />}
          {query.isError && (
            <p className="text-sm text-destructive">{(query.error as Error).message}</p>
          )}
          {query.data?.items.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No transactions found.
            </p>
          )}

          {query.data?.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0">
                <p className="font-medium">{item.mobile_number}</p>
                <p className="text-xs text-muted-foreground">
                  {item.txn_id} · {item.operator_name ?? item.type}
                </p>
                <p className="text-xs text-muted-foreground">{formatDateTime(item.created_at)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display font-semibold">
                  {formatCurrency(Number(item.amount))}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    statusTone[item.status] ?? "bg-muted text-muted-foreground",
                  )}
                >
                  {item.status}
                </span>
                <Button
                  size="icon"
                  variant="outline"
                  aria-label="Refresh status"
                  disabled={syncing === item.txn_id}
                  onClick={() => refreshStatus(item.txn_id)}
                >
                  <RefreshCw className={cn("h-4 w-4", syncing === item.txn_id && "animate-spin")} />
                </Button>
              </div>
            </div>
          ))}

          {query.data && query.data.pagination.totalPages > 1 && (
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
                Page {query.data.pagination.page} of {query.data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= query.data.pagination.totalPages}
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
