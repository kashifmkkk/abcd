"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Table2,
  Database,
  ChevronRight,
  Menu,
  X,
  TrendingUp,
} from "lucide-react";
import type { DashboardSpec } from "@/types/spec";
import { GeneratedDashboardHeader } from "@/components/generated-dashboard/GeneratedDashboardHeader";
import { AISuggestionsDrawer } from "@/components/dashboard/AISuggestionsDrawer";
import { scrollToSection } from "@/lib/utils/scrollToSection";

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  sectionId?: string;
}

function buildSidebarSections(spec: DashboardSpec): SidebarSection[] {
  const sections: SidebarSection[] = [];

  sections.push({
    title: "Overview",
    items: [
      {
        id: "overview",
        label: "Dashboard",
        icon: <LayoutDashboard size={15} />,
        sectionId: "dashboard-section",
      },
      {
        id: "metrics",
        label: "KPI Metrics",
        icon: <TrendingUp size={15} />,
        sectionId: "kpi-section",
      },
    ],
  });

  if (spec.entities.length > 0) {
    sections.push({
      title: "Data",
      items: spec.entities.map((entity) => ({
        id: `entity-${entity.name}`,
        label: entity.label ?? entity.name.charAt(0).toUpperCase() + entity.name.slice(1),
        icon: <Database size={15} />,
        sectionId: `section-${entity.name}`,
      })),
    });
  }

  const chartWidgets = spec.widgets.filter((w) => w.type === "chart");
  const tableWidgets = spec.widgets.filter((w) => w.type === "table");
  const analyticsItems: SidebarItem[] = [];

  if (chartWidgets.length > 0) {
    analyticsItems.push({
      id: "charts",
      label: "Charts",
      icon: <BarChart3 size={15} />,
      sectionId: "charts-section",
    });
  }

  if (tableWidgets.length > 0) {
    analyticsItems.push({
      id: "tables",
      label: "Tables",
      icon: <Table2 size={15} />,
      sectionId: "tables-section",
    });
  }

  if (analyticsItems.length > 0) {
    sections.push({ title: "Analytics", items: analyticsItems });
  }

  return sections;
}

interface DashboardShellProps {
  spec: DashboardSpec;
  projectId: string;
  projectName: string;
  children: React.ReactNode;
}

export function DashboardShell({ spec, projectId, projectName, children }: DashboardShellProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [activeItem, setActiveItem] = useState("overview");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const sidebarSections = useMemo(() => buildSidebarSections(spec), [spec]);

  const kpiCount = spec.widgets.filter((w) => w.type === "kpi").length;
  const chartCount = spec.widgets.filter((w) => w.type === "chart").length;

  function scrollTo(sectionId?: string) {
    if (!sectionId) return;
    scrollToSection(sectionId);
    setSidebarOpen(false);
  }

  function showSuccessToast(message: string) {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2600);
  }

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-slate-50 dark:bg-[#070a10]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900 lg:static lg:z-auto lg:translate-x-0 lg:shadow-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } dashboard-shell-aside`}
      >
        <div className="flex h-14 items-center gap-2.5 border-b border-slate-100 px-4 dark:border-slate-800">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-500 shadow-sm">
            <LayoutDashboard size={13} className="text-white" />
          </div>
          <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
            {projectName}
          </span>
        </div>

        <div className="flex gap-2 border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
          <span className="flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
            <TrendingUp size={10} />
            {kpiCount} KPIs
          </span>
          <span className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <BarChart3 size={10} />
            {chartCount} Charts
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {sidebarSections.map((section) => (
            <div key={section.title} className="mb-4">
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600">
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = activeItem === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveItem(item.id);
                          scrollTo(item.sectionId);
                        }}
                        className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-all duration-100 ${
                          active
                            ? "bg-amber-50 text-amber-700 font-medium dark:bg-amber-900/20 dark:text-amber-300"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                        }`}
                      >
                        <span
                          className={
                            active
                              ? "text-amber-500 dark:text-amber-400"
                              : "text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300"
                          }
                        >
                          {item.icon}
                        </span>
                        <span className="flex-1 truncate text-left">{item.label}</span>
                        {active && <ChevronRight size={12} className="text-amber-400 shrink-0" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
          <p className="text-[11px] text-slate-400 dark:text-slate-600">
            {spec.entities.length} {spec.entities.length === 1 ? "entity" : "entities"} &middot; {spec.widgets.length} widgets
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <GeneratedDashboardHeader
          title={projectName}
          subtitle="Operations dashboard"
          onAiToggle={() => setShowAiDrawer(true)}
          showAi={showAiDrawer}
          onRefresh={() => router.refresh()}
        />

        <div className="flex items-center gap-2 border-b border-slate-100 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen((p) => !p)}
            className="flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {sidebarOpen ? <X size={14} /> : <Menu size={14} />}
            Menu
          </button>
        </div>

        <AISuggestionsDrawer
          projectId={projectId}
          open={showAiDrawer}
          onOpenChange={setShowAiDrawer}
          onApplied={(message) => {
            showSuccessToast(message);
            router.refresh();
          }}
        />

        {toastMessage ? (
          <div className="pointer-events-none fixed right-6 top-20 z-60 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 shadow-lg dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            {toastMessage}
          </div>
        ) : null}

        <main id="dashboard-section" className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
