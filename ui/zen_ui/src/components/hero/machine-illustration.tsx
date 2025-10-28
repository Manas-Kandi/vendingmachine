type MachineIllustrationProps = {
  reducedMotion?: boolean;
};

export const MachineIllustration = ({
  reducedMotion = false,
}: MachineIllustrationProps) => {
  const animationClass = reducedMotion ? "" : "calming-breathe";

  return (
    <div
      aria-hidden="true"
      className={`relative isolate mx-auto w-[min(460px,78vw)] overflow-visible sm:w-[min(500px,70vw)] xl:w-[min(520px,36vw)] ${animationClass}`}
    >
      <svg
        viewBox="0 0 360 720"
        role="img"
        aria-label="Stylised vending machine illustration"
        className="w-full drop-shadow-[0_60px_120px_rgba(92,127,100,0.25)]"
      >
        <defs>
          <linearGradient
            id="machine-body"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#F3EEE8" />
            <stop offset="100%" stopColor="#E0D6CE" />
          </linearGradient>
          <linearGradient
            id="machine-glass"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
          </linearGradient>
          <linearGradient id="machine-foot" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C6B8AF" />
            <stop offset="100%" stopColor="#B1A49B" />
          </linearGradient>
        </defs>
        <rect
          x="24"
          y="24"
          width="312"
          height="672"
          rx="36"
          fill="url(#machine-body)"
        />
        <rect x="42" y="52" width="276" height="460" rx="24" fill="#CEC6BE" />
        <rect
          x="60"
          y="72"
          width="240"
          height="420"
          rx="20"
          fill="url(#machine-glass)"
        />
        <rect
          x="60"
          y="540"
          width="240"
          height="60"
          rx="12"
          fill="#D6CFC9"
        />
        <rect
          x="110"
          y="548"
          width="140"
          height="24"
          rx="12"
          fill="#F1ECE7"
        />
        <rect
          x="110"
          y="580"
          width="140"
          height="16"
          rx="8"
          fill="#E4DED7"
        />
        <rect
          x="60"
          y="620"
          width="240"
          height="20"
          rx="10"
          fill="#BFB3AA"
        />
        <rect
          x="90"
          y="640"
          width="180"
          height="16"
          rx="8"
          fill="url(#machine-foot)"
        />
        {/* Shelves */}
        {[0, 1, 2, 3, 4].map((index) => (
          <rect
            key={index}
            x="74"
            y={90 + index * 78}
            width="212"
            height="60"
            rx="12"
            fill={`rgba(255,255,255,${0.12 + index * 0.08})`}
          />
        ))}
        {/* Inventory nodes */}
        {[...Array(20)].map((_, index) => {
          const row = Math.floor(index / 4);
          const col = index % 4;
          const cx = 96 + col * 48;
          const cy = 110 + row * 78;
          const fill = index % 3 === 0 ? "#8BBF8E" : "#EAE6E1";

          return (
            <circle
              key={index}
              cx={cx}
              cy={cy}
              r="14"
              fill={fill}
              opacity="0.9"
            />
          );
        })}
        {/* Glass glare */}
        <path
          d="M80 84 L120 84 L288 384 L240 492 L80 492 Z"
          fill="rgba(255,255,255,0.08)"
        />
        {/* Ambient aura */}
        <ellipse
          cx="180"
          cy="700"
          rx="200"
          ry="60"
          fill="rgba(92,127,100,0.20)"
        />
      </svg>

      <div className="pointer-events-none absolute -right-[38%] top-[18%] h-[320px] w-[140%] -translate-y-8 rotate-[8deg] rounded-[56px] bg-[radial-gradient(circle_at_center,rgba(139,191,142,0.26),transparent_68%)] blur-[100px]" />
      <div className="pointer-events-none absolute -left-[25%] bottom-[-12%] h-[180px] w-[120%] rounded-[48px] bg-[radial-gradient(circle_at_center,rgba(140,90,0,0.16),transparent_70%)] blur-[90px]" />
    </div>
  );
};
