import Link from "next/link";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Footer() {
  return (
    <footer className="bg-sew-green text-sew-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <p className="text-2xl font-semibold tracking-tight text-sew-cream mb-2">
              Sew Suite
            </p>
            <p className="text-sew-cream/70 text-sm leading-relaxed">
              Custom embroidery and branded apparel — Allen/Lucas, TX
            </p>
          </div>

          {/* Nav */}
          <div>
            <p className="text-xs uppercase tracking-widest text-sew-gold mb-4 font-semibold">
              Navigation
            </p>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sew-cream/70 hover:text-sew-cream text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* External + contact */}
          <div>
            <p className="text-xs uppercase tracking-widest text-sew-gold mb-4 font-semibold">
              Shop & Order
            </p>
            <a
              href="https://stitchinkstudios.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sew-gold hover:text-sew-gold-light text-sm font-medium transition-colors"
            >
              Shop at Stitch Ink Studios
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
            <p className="text-sew-cream/70 text-sm mt-4 leading-relaxed">
              Based in Allen/Lucas, TX — serving the DFW metroplex and beyond.
            </p>
          </div>
        </div>

        <div className="border-t border-sew-green-light mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sew-cream/50 text-xs">
            © 2025 Sew Suite. All rights reserved.
          </p>
          <p className="text-sew-cream/40 text-xs">
            Marketing by{" "}
            <span className="text-sew-cream/60">Service Trade Agency</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
