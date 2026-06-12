import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import AdjustTab from './AdjustTab.jsx';
import { fmtKwp, colorEstado } from '../../utils/formatters.js';

export default function SimulatorPage() {
  const { proyectos } = useApp();
  const [selectedId, setSelectedId] = useState(proyectos[0]?.id || null);
  const proyecto = proyectos.find(p => p.id === selectedId);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ background: 'var(--solar-dark)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>⚡</span>
          <span style={{ fontWeight: 800, fontSize: 16, color: 'white', letterSpacing: '0.02em' }}>Simulador PPA</span>
        </div>
        <span style={{ color: '#475569', fontSize: 13 }}>Fine-tuning en tiempo real</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#64748B' }}>Proyecto:</span>
          <select
            value={selectedId || ''}
            onChange={e => setSelectedId(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #334155', background: '#1E293B', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', outline: 'none', minWidth: 200 }}>
            {proyectos.map(p => (
              <option key={p.id} value={p.id}>{p.cliente} — {fmtKwp(p.capacidad_kwp)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Project summary bar */}
      {proyecto && (
        <div style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '8px 24px', display: 'flex', gap: 24, alignItems: 'center', flexShrink: 0 }}>
          {[
            { label: 'Cliente', value: proyecto.cliente },
            { label: 'Ubicación', value: proyecto.ubicacion },
            { label: 'Estado', value: proyecto.estado, color: colorEstado(proyecto.estado) },
            { label: 'Tarifa CFE', value: proyecto.tarifa_cfe },
            { label: 'Canal', value: `${proyecto.canal} · ${proyecto.uen}` },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: item.color || 'var(--text-primary)' }}>{item.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {proyecto ? (
          <AdjustTab proyecto={proyecto} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: 40 }}>⚡</span>
            <p style={{ fontSize: 15, fontWeight: 600 }}>Selecciona un proyecto para comenzar el simulador</p>
          </div>
        )}
      </div>
    </div>
  );
}
