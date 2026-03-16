import Link from "next/link";

const links: Record<string, { label: string; href: string }[]> = {
  Product: [
    { label: "Dashboard Builder", href: "/dashboard" },
    { label: "AI Generator", href: "/create" },
    { label: "CSV Upload", href: "/upload" },
    { label: "Changelog", href: "#" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "API Reference", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Status", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Press Kit", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
    { label: "Security", href: "#" },
  ],
};

export function FooterSection() {
  return (
    <footer className="landing-bg-footer relative border-t border-white/6">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">
        {/* Top: Brand + columns */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-white font-bold text-base tracking-tight">
              AI Dashboard<span className="text-amber-400">.</span>
            </Link>
            <p className="text-gray-500 text-xs mt-3 leading-relaxed max-w-40">
              Intelligent analytics for modern data teams.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4">
                {category}
              </p>
              <ul className="space-y-3">
                {items.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-xs text-gray-500 hover:text-gray-300 transition-colors duration-150"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/6 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} AI Dashboard Platform. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            {["Twitter", "GitHub", "LinkedIn"].map((s) => (
              <a
                key={s}
                href="#"
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors duration-150"
              >
                {s}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
