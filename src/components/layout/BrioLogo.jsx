export default function BrioLogo({ size = 'md', dark = true }) {
  const sizes = { sm: { icon: 20, text: 14, sub: 8 }, md: { icon: 28, text: 20, sub: 10 }, lg: { icon: 40, text: 28, sub: 12 } };
  const s = sizes[size] || sizes.md;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {/* Icon — stylized bolt/solar */}
      <svg width={s.icon} height={s.icon} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="15" fill={dark ? '#FFFFFF' : '#0F172A'} fillOpacity="0.1" />
        <path
          d="M18 4L8 18H16L14 28L24 14H16L18 4Z"
          fill={dark ? '#FFFFFF' : '#0F172A'}
          stroke={dark ? '#FFFFFF' : '#0F172A'}
          strokeWidth="0.5"
        />
      </svg>
      {/* Text */}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span style={{ fontSize: s.text, fontWeight: 800, letterSpacing: '0.08em', color: dark ? '#FFFFFF' : '#0F172A', fontFamily: 'Inter, sans-serif' }}>
          BRIO
        </span>
        <span style={{ fontSize: s.sub, fontWeight: 500, letterSpacing: '0.2em', color: dark ? '#94A3B8' : '#64748B', fontFamily: 'Inter, sans-serif', marginTop: 1 }}>
          ENERGÍA
        </span>
      </div>
    </div>
  );
}
