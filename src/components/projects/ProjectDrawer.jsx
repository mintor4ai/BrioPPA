import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { fmtMXN, fmtUSD, fmtKwp, fmtPct, fmtDate, colorEstado } from '../../utils/formatters.js';
import SummaryTab from './tabs/SummaryTab.jsx';
import ReciboTab from './tabs/ReciboTab.jsx';
import FinancialTab from './tabs/FinancialTab.jsx';
import SystemTab from './tabs/SystemTab.jsx';
import IATab from './tabs/IATab.jsx';
import AdjustTab from '../simulator/AdjustTab.jsx';

const TABS = ['Resumen', 'Recibo CFE', 'Flujo Financiero', 'Sistema', '✨ IA Docs', '⚡ Ajustar'];
const ESTADOS = ['Prospecto', 'Cotizacion', 'Negociacion', 'Autorizado', 'Construccion', 'Operando', 'Perdido'];

export default function ProjectDrawer({ proyectoId, onClose }) {
  const { proyectos, saveProyecto, addToast } = useApp();
  const [activeTab, setActiveTab] = useState(0);
  const p = proyectos.find(x => x.id === proyectoId);

  if (!p) return null;

  const c = colorEstado(p.estado);

  const changeEstado = async (nuevoEstado) => {
    await saveProyecto({ ...p, estado: nuevoEstado });
    addToast(`Estado cambiado a ${nuevoEstado}`, 'success');
  };

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'white', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-secondary)', padding: '4px 8px' }}>←</button>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{p.cliente}</h2>
                <span className="status-badge" style={{ background: `${c}15`, color: c, border: `1px solid ${c}40` }}>{p.estado}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
                {fmtKwp(p.capacidad_kwp)} · {p.tarifa_cfe} · {p.uen} · {p.ubicacion}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={p.estado} onChange={e => changeEstado(e.target.value)}
                style={{ padding: '6px 10px', border: `1px solid ${c}`, borderRadius: 8, fontSize: 12, fontWeight: 600, color: c, background: `${c}10`, cursor: 'pointer', outline: 'none' }}>
                {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', marginTop: 12, borderBottom: '1px solid var(--border)', gap: 0 }}>
            {TABS.map((t, i) => (
              <button key={i} onClick={() => setActiveTab(i)} className={`tab-button${activeTab === i ? ' active' : ''}`}>{t}</button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {activeTab === 0 && <SummaryTab proyecto={p} />}
          {activeTab === 1 && <ReciboTab proyecto={p} />}
          {activeTab === 2 && <FinancialTab proyecto={p} />}
          {activeTab === 3 && <SystemTab proyecto={p} onSave={saveProyecto} addToast={addToast} />}
          {activeTab === 4 && <IATab proyecto={p} />}
          {activeTab === 5 && <AdjustTab proyecto={p} />}
        </div>
      </div>
    </>
  );
}
