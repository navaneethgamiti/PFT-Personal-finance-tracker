export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(value);

export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  });

export const percentOf = (part: number, total: number): number => {
  if (total <= 0) {
    return 0;
  }
  return Math.round((part / total) * 100);
};