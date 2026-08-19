export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const statusTone: Record<string, string> = {
  SUCCESS: "bg-success/12 text-success",
  FAILED: "bg-destructive/12 text-destructive",
  REFUNDED: "bg-destructive/12 text-destructive",
  TIMEOUT: "bg-destructive/12 text-destructive",
  PENDING: "bg-warning/18 text-warning-foreground",
  PROCESSING: "bg-warning/18 text-warning-foreground",
  INITIATED: "bg-muted text-muted-foreground",
};
