import type { ReactNode } from "react";

type WidgetCardProps = {
  children: ReactNode;
  className?: string;
};

export function WidgetCard({ children, className = "" }: WidgetCardProps) {
  return (
    <div className={`flex h-full flex-col overflow-hidden bg-white dark:bg-slate-900 ${className}`}>
      {children}
    </div>
  );
}
