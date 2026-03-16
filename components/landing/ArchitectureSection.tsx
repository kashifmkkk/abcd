"use client";

import { motion } from "framer-motion";
import { Globe2, Brain, LayoutTemplate, Database } from "lucide-react";

const layers = [
  {
    icon: Globe2,
    label: "Application Layer",
    detail: "React / Next.js · REST APIs · WebSockets",
   key: "app",
  },
  {
    icon: Brain,
    label: "AI Engine",
    detail: "LLM Orchestration · Prompt Engineering · Spec Generation",
   key: "ai",
  },
  {
    icon: LayoutTemplate,
    label: "Dashboard Renderer",
    detail: "Config-driven Widgets · Recharts · Drag & Drop",
   key: "renderer",
  },
  {
    icon: Database,
    label: "Data Sources",
    detail: "CSV · PostgreSQL · REST APIs · Cloud Warehouses",
   key: "data",
  },
];

export function ArchitectureSection() {
  return (
    <section
    className="landing-bg-b relative py-30 overflow-hidden"
    >
    <div className="landing-divider-faint absolute top-0 inset-x-0 h-px" />

      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500 block mb-4">
            Architecture
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Platform Architecture
          </h2>
          <p className="text-gray-400 mt-4 max-w-xl mx-auto">
            A layered, composable system designed for reliability and extensibility.
          </p>
        </motion.div>

        {/* Stacked layer cards */}
        <div className="flex flex-col items-center gap-3">
            {layers.map(({ icon: Icon, label, detail, key }, idx) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.12 }}
                className={`arch-width-${idx}`}
                style={{ width: `${100 - idx * 5}%` }}
            >
              <div
                  className={`landing-bg-card arch-card-${key} rounded-2xl border p-5 flex items-center gap-5`}
              >
                <div
                    className={`arch-icon-${key} shrink-0 w-10 h-10 rounded-xl flex items-center justify-center`}
                >
                    <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{detail}</p>
                </div>
                <div
                    className={`arch-label-${key} text-xs font-mono px-2 py-0.5 rounded-full shrink-0`}
                >
                  L{idx + 1}
                </div>
              </div>
              {/* Connector */}
              {idx < layers.length - 1 && (
                <div className="flex justify-center">
                  <div
                      className={`arch-connector-${key} w-px h-3`}
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
