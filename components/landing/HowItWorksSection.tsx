"use client";

import { motion } from "framer-motion";
import { Upload, Cpu, LayoutDashboard } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Upload Data or Write Prompt",
    description:
      "Upload a CSV file or simply describe the dashboard you want in plain English. No setup required.",
  },
  {
    number: "02",
    icon: Cpu,
    title: "AI Understands Your Data",
    description:
      "Our LLM analyzes data structure, detects metrics, dimensions, and relationships — building a semantic model in seconds.",
  },
  {
    number: "03",
    icon: LayoutDashboard,
    title: "Dashboard Generated Instantly",
    description:
      "A fully configured dashboard with the right charts, KPI widgets, and tables is generated and ready to explore.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="landing-bg-b relative py-30">
      <div className="landing-divider-faint absolute top-0 inset-x-0 h-px" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500 block mb-4">
            How It Works
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Three steps to insights
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Connector line (desktop) */}
          <div className="howitworks-connector absolute top-14 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px hidden md:block pointer-events-none" />

          {steps.map(({ number, icon: Icon, title, description }, idx) => (
            <motion.div
              key={number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: idx * 0.15 }}
              className="relative flex flex-col items-center text-center"
            >
              {/* Step circle */}
              <div className="relative mb-6 flex items-center justify-center w-28 h-28 rounded-full border border-amber-500/20 bg-amber-500/5">
                <div className="flex items-center justify-center w-16 h-16 rounded-full border border-amber-500/30 bg-amber-500/10">
                  <Icon className="text-amber-400" size={24} />
                </div>
                <span
                  className="step-number-bg absolute -top-2 -right-2 text-[10px] font-bold text-amber-500 px-1.5 py-0.5 rounded-full border border-amber-500/30"
                >
                  {number}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed max-w-70">
                {description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
