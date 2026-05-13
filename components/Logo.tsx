type LogoProps = {
  size?: number;
  variant?: 'mark' | 'full';
  theme?: 'light' | 'dark';
};

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="PivotaraHub logo"
    >
      {/* Rounded square background */}
      <rect width="32" height="32" rx="8" fill="#1d4ed8" />

      {/* Stylized P letterform */}
      {/* Stem */}
      <rect x="9" y="8" width="3" height="16" rx="1" fill="white" />
      {/* Bowl — D-shape semicircle */}
      <path d="M12 8h4a5 5 0 0 1 0 10h-4z" fill="white" />
      {/* Inner cutout to give depth to bowl */}
      <path d="M12 10.5h3.5a2.5 2.5 0 0 1 0 5H12z" fill="#1d4ed8" />

      {/* Small pivot dot — bottom right accent */}
      <circle cx="23" cy="23" r="2.5" fill="#60a5fa" />
    </svg>
  );
}

export function LogoFull({ theme = 'dark', size = 28 }: { theme?: 'light' | 'dark'; size?: number }) {
  const textColor = theme === 'dark' ? '#ffffff' : '#0f172a';
  const subColor = theme === 'dark' ? '#93c5fd' : '#3b82f6';

  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <div className="flex flex-col leading-none">
        <span
          style={{ color: textColor, fontSize: size * 0.5, fontWeight: 700, letterSpacing: '-0.02em' }}
        >
          Pivotara
          <span style={{ color: subColor }}>Hub</span>
        </span>
        <span
          style={{ color: subColor, fontSize: size * 0.3, fontWeight: 500, letterSpacing: '0.04em', marginTop: 1 }}
        >
          AI Platform
        </span>
      </div>
    </div>
  );
}

export default LogoMark;
