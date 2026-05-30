import { Link } from "@tanstack/react-router";

export function Logo({ withWordmark = true }: { withWordmark?: boolean }) {
  return (
    <Link to="/" className="group flex items-center gap-2.5">
      <span className="relative grid h-10 w-10 place-items-center">
        <svg
          viewBox="0 0 48 48"
          className="h-10 w-10 drop-shadow-[0_4px_14px_oklch(0.72_0.14_55/0.35)] transition-transform duration-300 group-hover:scale-105"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="mc-warm" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.84 0.13 70)" />
              <stop offset="55%" stopColor="oklch(0.72 0.15 45)" />
              <stop offset="100%" stopColor="oklch(0.58 0.16 25)" />
            </linearGradient>
            <linearGradient id="mc-soft" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.98 0.02 80)" />
              <stop offset="100%" stopColor="oklch(0.94 0.04 70)" />
            </linearGradient>
          </defs>

          {/* Soft rounded square — homely backdrop */}
          <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#mc-warm)" />

          {/* Open arched doorway — welcoming home */}
          <path
            d="M16 32V22a8 8 0 0 1 16 0v10"
            fill="none"
            stroke="url(#mc-soft)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          {/* Doorway opening (warm interior glow) */}
          <path
            d="M19 32V23a5 5 0 0 1 10 0v9"
            fill="oklch(0.96 0.05 75)"
            fillOpacity="0.35"
          />

          {/* Three figures gathered — inclusion */}
          <g fill="url(#mc-soft)">
            <circle cx="14" cy="16" r="2.2" />
            <circle cx="24" cy="13" r="2.4" />
            <circle cx="34" cy="16" r="2.2" />
          </g>
          {/* Connecting arc above figures */}
          <path
            d="M13 18c4-7 18-7 22 0"
            fill="none"
            stroke="url(#mc-soft)"
            strokeWidth="1.4"
            strokeLinecap="round"
            opacity="0.7"
          />

          {/* Ground line — common ground */}
          <rect x="12" y="32" width="24" height="2.2" rx="1.1" fill="url(#mc-soft)" />
        </svg>
      </span>
      {withWordmark && (
        <span className="hidden flex-col leading-none sm:flex">
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            Marburg
            <span className="ml-1 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              Connect
            </span>
          </span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            A home for everyone
          </span>
        </span>
      )}
    </Link>
  );
}
