/**
 * Pichichi Logo — green badge with gold "9" (striker number, top scorer).
 *
 * The badge + "9" is the single source of truth for all app icons;
 * see `scripts/generate-icons.mjs` which outputs this exact artwork
 * as favicon/PWA/iOS/Android assets.
 */

const NINE_PATH =
  "M117.051 204.000L117.051 204.000Q99.137 204.000 85.428 196.954Q71.719 189.909 63.636 178.221Q55.553 166.533 54.133 152.661L54.133 152.661L97.607 152.661Q99.137 159.651 104.598 163.038Q110.060 166.424 117.051 166.424L117.051 166.424Q126.336 166.424 132.289 160.853Q138.242 155.282 141.082 145.342Q143.922 135.402 143.922 122.294L143.922 122.294L143.048 122.294Q139.990 129.722 133.709 135.074Q127.428 140.427 119.126 143.267Q110.824 146.107 101.540 146.107L101.540 146.107Q86.793 146.107 75.651 139.443Q64.510 132.780 58.338 121.092Q52.166 109.404 52.166 94.549L52.166 94.549Q52.166 76.962 60.468 63.800Q68.770 50.637 83.462 43.319Q98.153 36 117.269 36L117.269 36Q131.579 36 144.304 40.533Q157.030 45.066 166.806 54.843Q176.583 64.619 182.208 80.294Q187.834 95.969 187.834 118.143L187.834 118.143Q187.834 137.914 182.809 153.753Q177.784 169.592 168.445 180.843Q159.105 192.094 146.052 198.047Q132.999 204.000 117.051 204.000ZM117.706 116.177L117.706 116.177Q122.622 116.177 126.718 114.429Q130.814 112.681 133.818 109.568Q136.822 106.455 138.515 102.250Q140.208 98.044 140.208 93.020L140.208 93.020Q140.208 86.356 137.313 81.113Q134.419 75.870 129.339 72.866Q124.260 69.862 117.706 69.862L117.706 69.862Q111.261 69.862 106.073 72.866Q100.884 75.870 97.935 81.113Q94.986 86.356 94.986 93.020L94.986 93.020Q94.986 99.683 97.935 104.926Q100.884 110.169 106.018 113.173Q111.152 116.177 117.706 116.177Z";

export function Logo({
  className = "",
  size = "default",
  variant = "full",
}: {
  className?: string;
  size?: "small" | "default" | "large";
  variant?: "full" | "icon" | "text";
}) {
  const sizes = {
    small: { height: 32, iconSize: 28 },
    default: { height: 44, iconSize: 40 },
    large: { height: 56, iconSize: 52 },
  }[size];

  const icon = (
    <svg
      viewBox="0 0 240 240"
      xmlns="http://www.w3.org/2000/svg"
      style={{ height: sizes.iconSize, width: sizes.iconSize }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="logo-green" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B6E4F" />
          <stop offset="100%" stopColor="#14A76C" />
        </linearGradient>
        <linearGradient id="logo-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD166" />
          <stop offset="100%" stopColor="#E6B84D" />
        </linearGradient>
      </defs>
      <circle cx="120" cy="120" r="120" fill="url(#logo-green)" />
      <circle
        cx="120"
        cy="120"
        r="111.6"
        fill="none"
        stroke="#FFD166"
        strokeWidth="4.08"
        strokeOpacity="0.85"
      />
      <path d={NINE_PATH} fill="url(#logo-gold)" />
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
