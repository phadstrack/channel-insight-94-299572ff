import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  accent,
  loading,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 relative overflow-hidden">
      {accent && (
        <div
          className="absolute top-0 left-0 h-1 w-full"
          style={{ background: accent }}
        />
      )}
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={cn("mt-2 text-2xl font-semibold tracking-tight", loading && "opacity-40")}>
        {loading ? "—" : value}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
