"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Server, Puzzle } from "lucide-react";

const items = [
  {
    icon: ShieldCheck,
    title: "Secure Infrastructure",
    description:
      "End-to-end encryption, SOC 2 compliant data handling, and role-based access controls built in from day one.",
  },
  {
    icon: Server,
    title: "Scalable Architecture",
    description:
      "Handles millions of data points with sub-second query performance. Scales horizontally to meet any workload.",
  },
  {
    icon: Puzzle,
    title: "Enterprise Integrations",
    description:
      "Connect to any database, warehouse, or API. Native connectors for PostgreSQL, BigQuery, Snowflake, and more.",
  },
];

export function EnterpriseSection() {
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
            Enterprise Ready
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight max-w-2xl mx-auto">
            Built for teams that demand reliability
          </h2>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map(({ icon: Icon, title, description }, idx) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: idx * 0.12 }}
                className="enterprise-card-bg rounded-2xl border border-white/7 p-8"
            >
              <div className="mb-5 inline-flex items-center justify-center w-10 h-10 rounded-xl border border-white/10">
                <Icon className="text-gray-400" size={18} strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-semibold text-white mb-3">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
