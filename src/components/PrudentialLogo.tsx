import Link from "next/link";

interface PrudentialLogoProps {
  className?: string;
  variant?: "default" | "white";
}

export function PrudentialLogo({ className = "", variant = "default" }: PrudentialLogoProps) {
  const textColor = variant === "white" ? "text-white" : "text-pru-red";

  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`}>
      <svg
        viewBox="0 0 36 36"
        className="w-9 h-9 flex-shrink-0"
        aria-hidden="true"
      >
        <circle cx="18" cy="18" r="18" fill={variant === "white" ? "#fff" : "#ED1B2E"} />
        <ellipse cx="18" cy="14" rx="8" ry="9" fill={variant === "white" ? "#ED1B2E" : "#fff"} />
        <circle cx="15" cy="13" r="1.2" fill={variant === "white" ? "#fff" : "#ED1B2E"} />
        <circle cx="21" cy="13" r="1.2" fill={variant === "white" ? "#fff" : "#ED1B2E"} />
        <path
          d="M13 17 Q18 21 23 17"
          stroke={variant === "white" ? "#fff" : "#ED1B2E"}
          strokeWidth="1.2"
          fill="none"
        />
      </svg>
      <span
        className={`font-serif font-bold text-xl tracking-wide uppercase ${textColor}`}
        style={{ letterSpacing: "0.06em" }}
      >
        Prudential
      </span>
    </Link>
  );
}
