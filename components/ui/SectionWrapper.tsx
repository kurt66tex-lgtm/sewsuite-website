interface SectionWrapperProps {
  children: React.ReactNode;
  className?: string;
  bg?: "cream" | "white" | "green" | "slate";
  id?: string;
}

export default function SectionWrapper({
  children,
  className = "",
  bg = "white",
  id,
}: SectionWrapperProps) {
  const bgMap = {
    cream: "bg-sew-cream",
    white: "bg-white",
    green: "bg-sew-green",
    slate: "bg-sew-slate",
  };

  return (
    <section id={id} className={`${bgMap[bg]} ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        {children}
      </div>
    </section>
  );
}
