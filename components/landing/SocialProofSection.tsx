const logos = [
  "Acme Corp",
  "Dataflow",
  "NovaTech",
  "Prism Analytics",
  "Vertex Systems",
  "CloudBase",
  "Axon Labs",
  "Meridian IO",
];

export function SocialProofSection() {
  return (
    <section
      className="landing-bg-a relative py-30"
    >
      <div className="landing-divider-faint absolute top-0 inset-x-0 h-px" />

      <div className="max-w-6xl mx-auto px-6">
        <p className="text-center text-xs text-gray-600 uppercase tracking-[0.2em] font-medium mb-12">
          Trusted by innovative teams worldwide
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
          {logos.map((logo) => (
            <span
              key={logo}
              className="text-base font-semibold text-gray-700 hover:text-gray-500 transition-colors duration-200 cursor-default select-none"
            >
              {logo}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
