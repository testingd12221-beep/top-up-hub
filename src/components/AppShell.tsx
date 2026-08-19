import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Smartphone,
  Receipt,
  Wallet,
  Users,
  Menu,
  Signal,
} from "lucide-react";

import { getMyAccount } from "@/lib/wallet.functions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/recharge", label: "New Recharge", icon: Smartphone },
  { to: "/transactions", label: "Transactions", icon: Receipt },
  { to: "/wallet", label: "Wallet", icon: Wallet },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const fetchAccount = useServerFn(getMyAccount);

  const account = useQuery({
    queryKey: ["my-account"],
    queryFn: () => fetchAccount(),
  });

  const links = [
    ...navItems,
    ...(account.data?.isAdmin ? [{ to: "/admin", label: "Admin", icon: Users } as const] : []),
  ];

  return (
    <div className="min-h-screen lg:flex">
      <aside
        className={cn(
          "bg-sidebar text-sidebar-foreground lg:flex lg:w-64 lg:shrink-0 lg:flex-col",
          open ? "block" : "hidden lg:block",
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6 font-display text-lg font-bold">
          <Signal className="h-5 w-5 text-sidebar-primary" />
          RechargeHub
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {links.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{
                className:
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium bg-sidebar-accent text-sidebar-accent-foreground",
              }}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-4 border-b bg-card px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              {account.isLoading ? (
                <Skeleton className="h-5 w-32" />
              ) : (
                <p className="truncate text-sm font-medium">
                  {account.data?.profile?.shop_name || account.data?.profile?.full_name || "Retailer"}
                </p>
              )}
              <p className="truncate text-xs text-muted-foreground">
                {account.data?.profile?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent px-3 py-1.5 text-right">
              <p className="text-[10px] uppercase tracking-wide text-accent-foreground/70">
                Wallet
              </p>
              {account.isLoading ? (
                <Skeleton className="h-4 w-16" />
              ) : (
                <p className="font-display text-sm font-bold text-accent-foreground">
                  {formatCurrency(Number(account.data?.wallet?.balance ?? 0))}
                </p>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 bg-background p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
