import BrioLogo from './BrioLogo.jsx';
import { useApp } from '../../context/AppContext.jsx';

const NAV = [
  { key: 'dashboard',  label: 'Dashboard',       icon: '⊞' },
  { key: 'proyectos',  label: 'Proyectos',        icon: '📋' },
  { key: 'nueva',      label: 'Nueva Cotización', icon: '+', accent: true },
  { key: 'ia',         label: 'IA Center',        icon: '✨', ia: true },
];

const NAV_BOTTOM = [
  { key: 'config', label: 'Configuración', icon: '⚙' },
];

export default function Sidebar({ view, setView }) {
  const { alertas } = useApp();
  const alertasAltas = alertas.filter(a => a.severidad === 'alta').length;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <BrioLogo size="md" dark={true} />
        <div style={{ marginTop: 6, fontSize: 11, color: '#475569', fontWeight: 500 }}>PPA Manager</div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 0' }}>
        {NAV.map(item => (
          <button
            key={item.key}
            onClick={() => setView(item.key)}
            className={`sidebar-item${view === item.key ? ' active' : ''}`}
            style={{
              width: 'calc(100% - 16px)',
              background: 'none',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              borderLeft: view === item.key ? '3px solid var(--solar-gold)' : '3px solid transparent',
              color: item.ia ? (view === item.key ? '#C4B5FD' : '#7C3AED') : undefined,
            }}
          >
            <span style={{ fontSize: 15 }}>{item.icon}</span>
            <span>{item.label}</span>
            {item.key === 'dashboard' && alertasAltas > 0 && (
              <span style={{ marginLeft: 'auto', background: '#EF4444', color: 'white', fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '1px 6px' }}>
                {alertasAltas}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '8px 0 12px' }}>
        {NAV_BOTTOM.map(item => (
          <button
            key={item.key}
            onClick={() => setView(item.key)}
            className={`sidebar-item${view === item.key ? ' active' : ''}`}
            style={{ width: 'calc(100% - 16px)', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderLeft: view === item.key ? '3px solid var(--solar-gold)' : '3px solid transparent' }}
          >
            <span style={{ fontSize: 15 }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
        <div style={{ padding: '8px 20px 0', fontSize: 11, color: '#334155' }}>
          <div style={{ fontWeight: 600 }}>Carlos</div>
          <div style={{ color: '#1E3A5F', marginTop: 1 }}>Admin · GPBI</div>
        </div>
      </div>
    </aside>
  );
}
