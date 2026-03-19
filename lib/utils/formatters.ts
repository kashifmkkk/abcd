/**
 * Number formatting helpers shared across KPI and insights rendering.
 */

function isFiniteNumber(n: number): boolean {
  return Number.isFinite(n);
}

export function formatNumber(n: number): string {
  if (!isFiniteNumber(n)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

export function formatCompact(n: number): string {
  if (!isFiniteNumber(n)) return "—";

  const abs = Math.abs(n);
  if (abs < 1_000) {
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
  }

  const units: Array<{ value: number; suffix: string }> = [
    { value: 1_000_000_000, suffix: "B" },
    { value: 1_000_000, suffix: "M" },
    { value: 1_000, suffix: "K" },
  ];

  const unit = units.find((item) => abs >= item.value);
  if (!unit) return String(n);

  const scaled = n / unit.value;
  const rounded = Math.abs(scaled) >= 100 ? scaled.toFixed(0) : scaled.toFixed(1);
  return `${rounded}${unit.suffix}`;
}

export function formatCurrency(n: number, currency = "USD"): string {
  if (!isFiniteNumber(n)) return "—";

  const abs = Math.abs(n);
  if (abs > 10_000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatPercent(n: number, decimals = 1): string {
  if (!isFiniteNumber(n)) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(n);
}

export function formatDate(
  isoString: string,
  format: "short" | "medium" | "long" = "medium"
): string {
  if (!isoString || Number.isNaN(Date.parse(isoString))) return "—";

  const date = new Date(isoString);
  if (format === "short") {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  if (format === "long") {
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }

  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds)) return "—";

  if (seconds < 60) {
    return `${seconds}s`;
  }

  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(seconds / 3600);
  const remainingMinutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${remainingMinutes}m`;
}
