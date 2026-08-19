import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  listRetailers,
  creditRetailerWallet,
  setWalletStatus,
  setRetailerActive,
} from "@/lib/admin.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — RechargeHub" },
      {
        name: "description",
        content: "Manage retailers, wallet top-ups and wallet status from the admin panel.",
      },
      { property: "og:title", content: "Admin — RechargeHub" },
      { property: "og:description", content: "Retailer and wallet management for administrators." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const queryClient = useQueryClient();
  const fetchRetailers = useServerFn(listRetailers);
  const adjustWallet = useServerFn(creditRetailerWallet);
  const updateWalletStatus = useServerFn(setWalletStatus);
  const updateActive = useServerFn(setRetailerActive);

  const retailers = useQuery({ queryKey: ["retailers"], queryFn: () => fetchRetailers() });
  const [dialogUser, setDialogUser] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submitAdjust = async () => {
    if (!dialogUser) return;
    setBusy(true);
    try {
      const result = await adjustWallet({
        data: { userId: dialogUser, amount: Number(amount), note: note || undefined },
      });
      toast.success(`New balance: ${formatCurrency(result.balance)}`);
      setDialogUser(null);
      setAmount("");
      setNote("");
      queryClient.invalidateQueries();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Wallet update failed");
    } finally {
      setBusy(false);
    }
  };

  const toggleWallet = async (userId: string, blocked: boolean) => {
    try {
      await updateWalletStatus({ data: { userId, status: blocked ? "BLOCKED" : "ACTIVE" } });
      toast.success(blocked ? "Wallet blocked" : "Wallet activated");
      queryClient.invalidateQueries();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  };

  const toggleActive = async (userId: string, isActive: boolean) => {
    try {
      await updateActive({ data: { userId, isActive } });
      toast.success(isActive ? "Retailer enabled" : "Retailer disabled");
      queryClient.invalidateQueries();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin panel</h1>
        <p className="text-sm text-muted-foreground">
          Manage retailer accounts and their wallets.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Retailers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {retailers.isLoading && <Skeleton className="h-40 w-full" />}
          {retailers.isError && (
            <p className="text-sm text-destructive">{(retailers.error as Error).message}</p>
          )}
          {retailers.data?.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No retailers yet.</p>
          )}

          {retailers.data?.map((retailer) => (
            <div key={retailer.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium">
                    {retailer.shop_name || retailer.full_name || "Retailer"}
                  </p>
                  <p className="text-xs text-muted-foreground">{retailer.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {retailer.rechargeCount} recharges ·{" "}
                    {formatCurrency(retailer.successAmount)} successful
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-bold">
                    {formatCurrency(retailer.balance)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Wallet {retailer.walletStatus}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <Dialog
                  open={dialogUser === retailer.id}
                  onOpenChange={(open) => setDialogUser(open ? retailer.id : null)}
                >
                  <DialogTrigger asChild>
                    <Button size="sm">Adjust wallet</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adjust wallet balance</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="adjustAmount">
                          Amount (use a negative value to debit)
                        </Label>
                        <Input
                          id="adjustAmount"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value.replace(/[^\d.-]/g, ""))}
                          placeholder="5000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adjustNote">Note</Label>
                        <Input
                          id="adjustNote"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Cash received"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={submitAdjust} disabled={busy || !Number(amount)}>
                        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Apply
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <div className="flex items-center gap-2">
                  <Switch
                    id={`wallet-${retailer.id}`}
                    checked={retailer.walletStatus === "ACTIVE"}
                    onCheckedChange={(checked) => toggleWallet(retailer.id, !checked)}
                  />
                  <Label htmlFor={`wallet-${retailer.id}`} className="text-xs">
                    Wallet active
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id={`active-${retailer.id}`}
                    checked={retailer.is_active}
                    onCheckedChange={(checked) => toggleActive(retailer.id, checked)}
                  />
                  <Label htmlFor={`active-${retailer.id}`} className="text-xs">
                    Account enabled
                  </Label>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
