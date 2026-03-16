"use client";

import { motion } from "framer-motion";
import { Sparkles, FileSpreadsheet, BarChart3, Bot } from "lucide-react";

const capabilities = [
  {
    icon: Sparkles,
    title: "AI Dashboard Generation",
    description:
      "Describe your dashboard in plain English. Our AI understands context, selects the right charts, and generates a complete analytics view instantly.",
  },
  {
    icon: FileSpreadsheet,
    title: "CSV Data Intelligence",
    description:
      "Upload any CSV file and let the AI analyze column relationships, data types, and suggest the most meaningful visualizations automatically.",
  },
  {
    icon: BarChart3,
    title: "Live Analytics Widgets",
    description:
      "Interactive charts, KPI cards, data tables, and custom widgets — all composable and embeddable anywhere in your workflow.",
  },
  {
    icon: Bot,
    title: "AI Dashboard Assistant",
    description:
      "An always-on AI assistant that reviews your dashboards, suggests layout improvements, and answers questions about your data.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55 } },
};

export function CapabilitiesSection() {
  return (
    <section
      className="landing-bg-a relative py-30"
    >
      <div className="landing-divider-faint absolute top-0 inset-x-0 h-px" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500 block mb-4">
            Capabilities
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight max-w-2xl mx-auto">
            Everything your data team needs
          </h2>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          {capabilities.map(({ icon: Icon, title, description }) => (
            <motion.div
              key={title}
              variants={cardVariant}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative rounded-2xl border border-white/7 bg-white/3 p-8 cursor-default overflow-hidden transition-colors duration-300 hover:border-amber-500/30 hover:bg-white/5"
            >
              {/* Hover glow */}
                <div className="capability-card-glow absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" />
              <div className="relative">
                <div className="mb-5 inline-flex items-center justify-center w-11 h-11 rounded-xl border border-amber-500/25 bg-amber-500/10">
                  <Icon className="text-amber-400" size={20} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
