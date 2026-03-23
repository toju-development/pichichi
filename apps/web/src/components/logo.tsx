/**
 * Pichichi Logo — Bold, impactful sports-inspired SVG wordmark
 *
 * Features an integrated goal-net accent element and strong italic feel.
 * Uses the Selva Mundialista color palette.
 */
export function Logo({
  className = "",
  size = "default",
  variant = "full",
}: {
  className?: string;
  /** Predefined sizes */
  size?: "small" | "default" | "large";
  /** full = icon + text, icon = just the icon, text = just the text */
  variant?: "full" | "icon" | "text";
}) {
  const sizes = {
    small: { height: 28, iconSize: 24 },
    default: { height: 36, iconSize: 32 },
    large: { height: 48, iconSize: 44 },
  }[size];

  const icon = (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ height: sizes.iconSize, width: sizes.iconSize }}
      aria-hidden="true"
    >
      {/* Shield / badge shape with integrated goal net */}
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0B6E4F" />
          <stop offset="100%" stopColor="#14A76C" />
        </linearGradient>
        <linearGradient id="logo-gold" x1="10" y1="0" x2="30" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFD166" />
          <stop offset="100%" stopColor="#E6B84D" />
        </linearGradient>
      </defs>
      {/* Shield body */}
      <path
        d="M20 2L4 10V22C4 30.5 11 37 20 39C29 37 36 30.5 36 22V10L20 2Z"
        fill="url(#logo-grad)"
      />
      {/* Inner shield highlight */}
      <path
        d="M20 5L7 12V22C7 28.9 12.8 34.5 20 36.5C27.2 34.5 33 28.9 33 22V12L20 5Z"
        fill="none"
        stroke="white"
        strokeWidth="0.8"
        strokeOpacity="0.3"
      />
      {/* Net/mesh lines inside shield */}
      <path
        d="M12 16L20 12L28 16M12 22L20 18L28 22M12 28L20 24L28 28"
        stroke="white"
        strokeWidth="1.2"
        strokeOpacity="0.4"
        strokeLinecap="round"
      />
      <path
        d="M12 16V28M20 12V30M28 16V28"
        stroke="white"
        strokeWidth="1.2"
        strokeOpacity="0.3"
        strokeLinecap="round"
      />
      {/* Gold accent — small football/star at center */}
      <circle cx="20" cy="20" r="4" fill="url(#logo-gold)" />
      <circle cx="20" cy="20" r="4" fill="none" stroke="white" strokeWidth="0.6" strokeOpacity="0.5" />
    </svg>
  );

  const textStyle: React.CSSProperties = {
    fontSize: sizes.height * 0.65,
    lineHeight: 1,
  };

  const text = (
    <span
      className="font-display font-bold tracking-tight text-primary"
      style={textStyle}
    >
      PICHICHI
    </span>
  );

  if (variant === "icon") return <span className={className}>{icon}</span>;
  if (variant === "text") return <span className={className}>{text}</span>;

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {icon}
      {text}
    </span>
  );
}
