import type { ReactNode } from "react";

interface AnalyticsCardProps {
  title: string;
  description?: string;
  headerAction?: ReactNode;
  /** Section anchor id — enables sidebar scroll-to */
  id?: string;
  children: ReactNode;
}

/**
 * Wrapper card used for charts, tables, and analytics sections inside
 * generated dashboards. Provides a consistent header + body layout.
 */
export function AnalyticsCard({ title, description, headerAction, id, children }: AnalyticsCardProps) {
  return (
    <div
      id={id}
      className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Card header */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800/60">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
          ) : null}
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </div>

      {/* Card body */}
      <div className="flex-1 min-h-0 p-5">{children}</div>
    </div>
  );
}
