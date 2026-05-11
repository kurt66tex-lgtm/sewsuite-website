import Image from "next/image";

interface PhotoCardProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export default function PhotoCard({
  src,
  alt,
  className = "",
  priority = false,
}: PhotoCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-sew-cream border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        priority={priority}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
      />
    </div>
  );
}
