import Link from "next/link";

interface CTAButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  external?: boolean;
  className?: string;
}

export default function CTAButton({
  href,
  children,
  variant = "primary",
  external = false,
  className = "",
}: CTAButtonProps) {
  const base =
    "inline-flex items-center justify-center font-semibold text-sm px-6 py-3 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variants = {
    primary:
      "bg-sew-gold hover:bg-sew-gold-light text-white focus:ring-sew-gold shadow-sm hover:shadow-md",
    secondary:
      "bg-transparent border-2 border-sew-cream text-sew-cream hover:bg-sew-cream hover:text-sew-green focus:ring-sew-cream",
    outline:
      "bg-transparent border-2 border-sew-green text-sew-green hover:bg-sew-green hover:text-sew-cream focus:ring-sew-green",
  };

  const classes = `${base} ${variants[variant]} ${className}`;

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
