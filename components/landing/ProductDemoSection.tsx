"use client";

import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { MockDashboard } from "./MockDashboard";

const features = [
  "Generate dashboards from natural language prompts",
  "Automatic chart & KPI detection from CSV data",
  "Fully customizable drag-and-drop layouts",
  "AI Assistant suggests improvements in real-time",
];

export function ProductDemoSection() {
  return (
    <section
    className="landing-bg-b relative py-30 overflow-hidden"
    >
    <div className="landing-divider absolute top-0 inset-x-0 h-px" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
            Platform Demo
          </span>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-5">
              From prompt to{" "}
                <span className="landing-gradient-text-sm">dashboard</span>{" "}
              in seconds
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-10">
              Our AI engine understands your data context and automatically generates
              the right visualizations, KPIs, and tables — fully configured and ready
              to use.
            </p>
            <ul className="space-y-4">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <CheckCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                  <span className="text-gray-300 text-sm leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Right: Floating dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="relative"
          >
            {/* Glow behind card */}
              <div className="landing-demo-glow absolute inset-0 rounded-3xl blur-3xl opacity-20 pointer-events-none" />
            <motion.div
              animate={{ y: [-6, 6, -6] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <MockDashboard />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
