import type { ReactNode } from "react";

interface AnalyticsCardProps {
  title?: string;
  description?: string;
  headerAction?: ReactNode;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function AnalyticsCard({
  title,
  description,
  headerAction,
  children,
  className = "",
  noPadding = false,
}: AnalyticsCardProps) {
  const hasHeader = title || description || headerAction;

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      {hasHeader ? (
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            {title ? (
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
            ) : null}
            {description ? (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
            ) : null}
          </div>
          {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
        </div>
      ) : null}
      <div className={noPadding ? "" : "p-5"}>{children}</div>
    </div>
  );
}
