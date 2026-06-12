import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { generarBriefingSemanal } from '../../utils/claudeAPI.js';
import { fmtKwp, fmtPct, colorEstado } from '../../utils/formatters.js';

export default function IACenter({ setView, setSelectedId }) {
  const { proyectos, alertas } = useApp();
  const [briefing, setBriefing] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBriefing = async () => {
    setLoading(true);
    try {
      const { texto } = await generarBriefingSemanal(proyectos, alertas);
      setBriefing(texto);
    } catch (e) {
      setBriefing(`Error: ${e.message}\n\nAsegúrate de configurar VITE_ANTHROPIC_API_KEY en las variables de entorno.`);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>✨ IA Center</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Inteligencia artificial aplicada a tu cartera de proyectos PPA</p>
      </div>

      {/* Briefing semanal */}
      <div className="card" style={{ marginBottom: 24, border: '1px solid #C4B5FD' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>📊 Briefing Semanal de Cartera</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Análisis ejecutivo de tu cartera para tomar decisiones esta semana</div>
          </div>
          <button className="ia-button" onClick={handleBriefing} disabled={loading}>
            {loading ? <><span className="spinner">⟳</span> Analizando...</> : '✨ Generar briefing'}
          </button>
        </div>
        {briefing && (
          <div style={{ marginTop: 16, padding: '16px', background: '#FAFAF9', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {briefing}
          </div>
        )}
      </div>

      {/* Alertas */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
          🔔 Alertas de la Cartera
          <span style={{ marginLeft: 8, background: alertas.filter(a => a.severidad === 'alta').length > 0 ? '#FEF2F2' : '#F0FDF4', color: alertas.filter(a => a.severidad === 'alta').length > 0 ? '#EF4444' : '#10B981', fontSize: 12, borderRadius: 10, padding: '2px 10px', fontWeight: 700 }}>
            {alertas.length} alertas
          </span>
        </div>
        {alertas.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>✓ Sin alertas activas. Tu cartera está en orden.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alertas.map((a, i) => (
              <AlertaCard key={i} a={a} onClick={() => { setSelectedId(a.proyecto_id); setView('proyectos'); }} />
            ))}
          </div>
        )}
      </div>

      {/* Proyectos con acciones IA */}
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>🗂 Documentos IA por Proyecto</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Haz clic en un proyecto para abrir su drawer y acceder a la pestaña "✨ IA Docs".</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {proyectos.filter(p => p.estado !== 'Perdido').map(p => (
            <div key={p.id} onClick={() => { setSelectedId(p.id); setView('proyectos'); }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: colorEstado(p.estado), flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 700 }}>{p.cliente}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 12, marginLeft: 8 }}>{p.ubicacion}</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtKwp(p.capacidad_kwp)}</span>
              <span style={{ fontSize: 12, color: (p.tir_gpbi_25 || 0) >= 0.2 ? '#10B981' : '#EF4444', fontWeight: 600 }}>TIR {fmtPct(p.tir_gpbi_25)}</span>
              <span style={{ fontSize: 11, color: '#7C3AED', fontWeight: 600 }}>Ver IA docs →</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AlertaCard({ a, onClick }) {
  const colors = { alta: { bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444', border: '#FCA5A5' }, media: { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B', border: '#FCD34D' } };
  const c = colors[a.severidad] || colors.media;
  const tipoLabels = { estancado: '⏸ Estancado', tir_baja: '📉 TIR Baja', construccion_proxima: '🚧 Construcción', descuento_bajo: '💰 Descuento bajo' };

  return (
    <div onClick={onClick} style={{ display: 'flex', gap: 12, padding: '12px 14px', background: c.bg, borderRadius: 10, border: `1px solid ${c.border}`, cursor: 'pointer' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot, marginTop: 5, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          <span style={{ fontWeight: 700, color: c.text }}>{a.cliente}</span>
          <span style={{ fontSize: 11, background: `${c.dot}20`, color: c.dot, borderRadius: 10, padding: '1px 8px', fontWeight: 600 }}>
            {tipoLabels[a.tipo] || a.tipo}
          </span>
        </div>
        <div style={{ fontSize: 13, color: c.text }}>{a.mensaje}</div>
        <div style={{ fontSize: 11, color: c.dot, marginTop: 4 }}>💡 {a.accion_sugerida}</div>
      </div>
    </div>
  );
}
