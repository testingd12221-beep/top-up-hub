import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

import { getOperators, getCircles, getPlans, createRecharge } from "@/lib/recharge.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/recharge")({
  head: () => ({
    meta: [
      { title: "New Recharge — RechargeHub" },
      {
        name: "description",
        content: "Run a mobile prepaid or postpaid recharge by picking operator, circle and plan.",
      },
      { property: "og:title", content: "New Recharge — RechargeHub" },
      { property: "og:description", content: "Prepaid and postpaid mobile recharge for retailers." },
    ],
  }),
  component: RechargePage,
});

type RechargeType = "MOBILE_PREPAID" | "MOBILE_POSTPAID";

function RechargePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [type, setType] = useState<RechargeType>("MOBILE_PREPAID");
  const [mobileNumber, setMobileNumber] = useState("");
  const [operatorId, setOperatorId] = useState("");
  const [circleId, setCircleId] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchOperators = useServerFn(getOperators);
  const fetchCircles = useServerFn(getCircles);
  const fetchPlans = useServerFn(getPlans);
  const submitRecharge = useServerFn(createRecharge);

  const operators = useQuery({
    queryKey: ["operators", type],
    queryFn: () => fetchOperators({ data: { type } }),
    retry: 0,
  });

  const circles = useQuery({
    queryKey: ["circles"],
    queryFn: () => fetchCircles(),
    retry: 0,
  });

  const plans = useQuery({
    queryKey: ["plans", operatorId, circleId],
    queryFn: () => fetchPlans({ data: { operatorId, circleId } }),
    retry: 0,
    enabled: Boolean(operatorId && circleId && type === "MOBILE_PREPAID"),
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const result = await submitRecharge({
        data: {
          mobileNumber,
          amount: Number(amount),
          operatorId,
          circleId,
          type,
        },
      });
      toast.success(`Recharge ${result.status} · ${result.txnId}`);
      queryClient.invalidateQueries();
      setMobileNumber("");
      setAmount("");
      navigate({ to: "/transactions" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Recharge failed");
    } finally {
      setSubmitting(false);
    }
  };

  const disabled =
    submitting || !mobileNumber || !operatorId || !circleId || !amount || Number(amount) <= 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New recharge</h1>
        <p className="text-sm text-muted-foreground">
          Amount is debited from your wallet and refunded automatically if the recharge fails.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recharge details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Tabs
                value={type}
                onValueChange={(value) => {
                  setType(value as RechargeType);
                  setOperatorId("");
                }}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="MOBILE_PREPAID">Prepaid</TabsTrigger>
                  <TabsTrigger value="MOBILE_POSTPAID">Postpaid</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile number</Label>
                <Input
                  id="mobile"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="9876543210"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                />
              </div>

              <div className="space-y-2">
                <Label>Operator</Label>
                {operators.isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select value={operatorId} onValueChange={setOperatorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {(operators.data ?? []).map((operator) => (
                        <SelectItem key={operator._id} value={operator._id}>
                          {operator.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {operators.isError && (
                  <p className="text-xs text-destructive">
                    {(operators.error as Error).message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Circle</Label>
                {circles.isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select value={circleId} onValueChange={setCircleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select circle" />
                    </SelectTrigger>
                    <SelectContent>
                      {(circles.data ?? []).map((circle) => (
                        <SelectItem key={circle._id} value={circle._id}>
                          {circle.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {circles.isError && (
                  <p className="text-xs text-destructive">{(circles.error as Error).message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (INR)</Label>
                <Input
                  id="amount"
                  inputMode="decimal"
                  placeholder="199"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                />
              </div>

              <Button type="submit" className="w-full" disabled={disabled}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Recharge now
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" /> Plans
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {type === "MOBILE_POSTPAID" && (
              <p className="text-sm text-muted-foreground">
                Plans are available for prepaid only. Enter the bill amount for postpaid.
              </p>
            )}
            {type === "MOBILE_PREPAID" && (!operatorId || !circleId) && (
              <p className="text-sm text-muted-foreground">
                Select an operator and circle to load plans.
              </p>
            )}
            {plans.isLoading && <Skeleton className="h-40 w-full" />}
            {plans.isError && (
              <p className="text-sm text-destructive">{(plans.error as Error).message}</p>
            )}
            {plans.data && (
              <div className="max-h-[26rem] space-y-2 overflow-y-auto pr-1">
                {[...plans.data.popularPlans, ...plans.data.allPlans].length === 0 && (
                  <p className="text-sm text-muted-foreground">No plans found.</p>
                )}
                {[...plans.data.popularPlans, ...plans.data.allPlans].map((plan, index) => (
                  <button
                    key={`${plan.amount}-${index}`}
                    type="button"
                    onClick={() => setAmount(String(plan.amount))}
                    className="flex w-full items-start justify-between gap-3 rounded-lg border p-3 text-left transition-colors hover:border-primary hover:bg-accent"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {plan.description || plan.dataAmount || "Recharge plan"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[plan.validity, plan.dataAmount].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <span className="font-display font-semibold">
                      {formatCurrency(plan.amount)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
