"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function FinalCtaSection() {
  return (
    <section className="landing-bg-a relative py-30 overflow-hidden">
      <div className="landing-divider-faint absolute top-0 inset-x-0 h-px" />

      {/* Gold glow */}
      <div className="landing-cta-glow absolute inset-0 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 mb-8">
            ✦ Get Started Today
          </span>

          <h2 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Start building{" "}
            <span className="landing-gradient-text-sm">AI-powered</span>{" "}
            dashboards
          </h2>

          <p className="text-gray-400 text-lg mb-12 max-w-xl mx-auto">
            Join hundreds of data teams using AI to turn raw data into actionable
            insights — in minutes, not weeks.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/register"
              className="final-cta-primary inline-flex items-center gap-2 rounded-xl bg-amber-500 px-8 py-3.5 text-sm font-semibold text-black transition-all duration-200 hover:bg-amber-400"
            >
              Create Dashboard →
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-8 py-3.5 text-sm font-medium text-white backdrop-blur transition-all duration-200 hover:bg-white/10"
            >
              Try AI Demo
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
