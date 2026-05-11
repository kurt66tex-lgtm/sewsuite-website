"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-sew-green shadow-lg">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/Sew_Suite_2025-white-gold.png"
            alt="Sew Suite Embroidery Outfitters"
            width={280}
            height={80}
            className="h-11 w-auto"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))
                    ? "text-sew-gold"
                    : "text-sew-cream hover:text-sew-gold"
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/contact"
              className="bg-sew-gold hover:bg-sew-gold-light text-white text-sm font-semibold px-5 py-2 rounded-md transition-colors"
            >
              Get a Quote
            </Link>
          </li>
        </ul>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-sew-cream p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className="block w-6 h-0.5 bg-current mb-1.5 transition-all"></span>
          <span className="block w-6 h-0.5 bg-current mb-1.5 transition-all"></span>
          <span className="block w-6 h-0.5 bg-current transition-all"></span>
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-sew-green-dark border-t border-sew-green-light">
          <ul className="flex flex-col px-4 py-4 gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block py-2.5 text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? "text-sew-gold"
                      : "text-sew-cream hover:text-sew-gold"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <Link
                href="/contact"
                onClick={() => setMenuOpen(false)}
                className="block text-center bg-sew-gold hover:bg-sew-gold-light text-white text-sm font-semibold px-5 py-2.5 rounded-md transition-colors"
              >
                Get a Quote
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
