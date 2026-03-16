"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="landing-bg-a relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 landing-grid-bg pointer-events-none" />

      {/* Gold radial glow */}
      <div className="landing-hero-glow absolute inset-0 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-20 pb-28">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-7"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
            ✦ Now with AI Dashboard Assistant
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-[76px] font-bold text-white tracking-tight leading-[1.06] mb-6"
        >
          AI Dashboards for{" "}
          <span className="landing-gradient-text">Modern Data Teams</span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.2 }}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Generate analytics dashboards instantly using AI prompts or CSV data.
          No code required — just describe what you need.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.3 }}
          className="flex flex-wrap gap-4 justify-center"
        >
          <Link
            href="/register"
            className="hero-cta-primary inline-flex items-center gap-2 rounded-xl bg-amber-500 px-7 py-3 text-sm font-semibold text-black transition-all duration-200 hover:bg-amber-400"
          >
            Create Dashboard →
          </Link>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-7 py-3 text-sm font-medium text-white backdrop-blur transition-all duration-200 hover:bg-white/10"
          >
            Upload Data
          </Link>
        </motion.div>

        {/* Trust line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="mt-8 text-xs text-gray-600"
        >
          Trusted by 500+ data teams · No credit card required
        </motion.p>
      </div>

      {/* Scroll caret */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-10 bg-linear-to-b from-white/20 to-transparent"
        />
      </motion.div>
    </section>
  );
}
