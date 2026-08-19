import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpRight, CheckCircle2, Clock, Wallet, XCircle } from "lucide-react";

import { getDashboardStats } from "@/lib/wallet.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime, statusTone } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — RechargeHub" },
      { name: "description", content: "Wallet balance and recharge statistics for your retailer account." },
      { property: "og:title", content: "Dashboard — RechargeHub" },
      { property: "og:description", content: "Track wallet balance, recharge volume and recent transactions." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const fetchStats = useServerFn(getDashboardStats);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => fetchStats(),
  });

  if (isError) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6">
          <p className="text-sm text-destructive">{(error as Error).message}</p>
          <Button onClick={() => refetch()}>Try again</Button>
        </CardContent>
      </Card>
    );
  }

  const cards = [
    {
      label: "Wallet balance",
      value: formatCurrency(data?.balance ?? 0),
      sub: `Status: ${data?.walletStatus ?? "—"}`,
      icon: Wallet,
    },
    {
      label: "Successful recharges",
      value: String(data?.successCount ?? 0),
      sub: `${formatCurrency(data?.successAmount ?? 0)} delivered`,
      icon: CheckCircle2,
    },
    {
      label: "In progress",
      value: String(data?.pendingCount ?? 0),
      sub: "Awaiting operator confirmation",
      icon: Clock,
    },
    {
      label: "Failed / refunded",
      value: String(data?.failedCount ?? 0),
      sub: "Amount returned to wallet",
      icon: XCircle,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.todayCount} recharges today · ${formatCurrency(data.todayAmount)} successful` : "Loading your activity"}
          </p>
        </div>
        <Button asChild>
          <Link to="/recharge">
            New recharge <ArrowUpRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
              <card.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="font-display text-2xl font-bold">{card.value}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent recharges</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && <Skeleton className="h-24 w-full" />}
          {!isLoading && (data?.recent.length ?? 0) === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No recharges yet. Start with your first recharge.
            </p>
          )}
          {data?.recent.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div>
                <p className="font-medium">{item.mobile_number}</p>
                <p className="text-xs text-muted-foreground">
                  {item.operator_name ?? item.type} · {formatDateTime(item.created_at)}
                </p>
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
              </div>
            </div>
          ))}
          <Button variant="outline" asChild className="w-full">
            <Link to="/transactions">View all transactions</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
