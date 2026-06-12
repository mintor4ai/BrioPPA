export const fmtMXN = (n, decimals = 2) => {
  if (n == null || isNaN(n)) return '—';
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
};

export const fmtUSD = (n, decimals = 2) => {
  if (n == null || isNaN(n)) return '—';
  if (Math.abs(n) >= 1_000_000) return `USD $${(n / 1_000_000).toFixed(2)}M`;
  return `USD $${Number(n).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
};

export const fmtPct = (n, decimals = 1) => {
  if (n == null || isNaN(n)) return '—';
  return `${(n * 100).toFixed(decimals)}%`;
};

export const fmtKwh = (n) => {
  if (n == null || isNaN(n)) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} GWh`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} MWh`;
  return `${Number(n).toFixed(0)} kWh`;
};

export const fmtKwp = (n) => {
  if (n == null || isNaN(n)) return '—';
  if (n >= 1000) return `${(n / 1000).toFixed(2)} MWp`;
  return `${Number(n).toFixed(0)} kWp`;
};

export const fmtNum = (n, decimals = 0) => {
  if (n == null || isNaN(n)) return '—';
  return Number(n).toLocaleString('es-MX', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

export const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const colorEstado = (estado) => {
  const map = {
    'Prospecto':    '#6366F1',
    'Cotizacion':   '#F59E0B',
    'Negociacion':  '#EF4444',
    'Autorizado':   '#10B981',
    'Construccion': '#3B82F6',
    'Operando':     '#059669',
    'Perdido':      '#9CA3AF',
  };
  return map[estado] || '#9CA3AF';
};
