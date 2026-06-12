import { useApp } from '../../context/AppContext.jsx';
import { fmtKwp, fmtMXN, fmtPct, fmtDate, colorEstado } from '../../utils/formatters.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from 'recharts';
import { generarBriefingSemanal } from '../../utils/claudeAPI.js';
import { useState } from 'react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color || 'white' }}>{p.name}: {p.value?.toLocaleString('es-MX')}</div>)}
    </div>
  );
};

const ESTADOS = ['Prospecto', 'Cotizacion', 'Negociacion', 'Autorizado', 'Construccion', 'Operando', 'Perdido'];

export default function Dashboard({ setView, setSelectedId }) {
  const { proyectos, alertas } = useApp();
  const [briefing, setBriefing] = useState('');
  const [loadingBriefing, setLoadingBriefing] = useState(false);

  const activos = proyectos.filter(p => p.estado !== 'Perdido');
  const mwCartera = activos.reduce((s, p) => s + (p.capacidad_kwp || 0), 0) / 1000;
  const genTotal = activos.reduce((s, p) => s + (p.generacion_anual_mwh || 0), 0);
  const ingresoTotal = activos.reduce((s, p) => s + (p.ingreso_anual_mxn || 0), 0);

  // Pipeline chart data
  const pipelineData = ESTADOS.map(e => ({
    name: e,
    count: proyectos.filter(p => p.estado === e).length,
    kwp: proyectos.filter(p => p.estado === e).reduce((s, p) => s + (p.capacidad_kwp || 0), 0),
    color: colorEstado(e),
  })).filter(d => d.count > 0);

  // Tendencia ingresos años 1-10
  const tendenciaData = Array.from({ length: 10 }, (_, i) => {
    const anio = i + 1;
    const factor = Math.pow(1 + 0.045, i) * Math.pow(1 - 0.004, i);
    const ingreso = activos.reduce((s, p) => s + (p.ingreso_anual_mxn || 0) * factor, 0);
    return { anio: `Año ${anio}`, ingreso: Math.round(ingreso / 1_000_000 * 10) / 10 };
  });

  const handleBriefing = async () => {
    setLoadingBriefing(true);
    try {
      const { texto } = await generarBriefingSemanal(proyectos, alertas);
      setBriefing(texto);
    } catch (e) {
      setBriefing('Error al generar briefing: ' + e.message);
    }
    setLoadingBriefing(false);
  };

  const recientes = [...proyectos].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 5);

  return (
    <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Resumen de cartera · {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <KPICard label="Proyectos Activos" value={activos.length} sub={`${proyectos.filter(p => p.estado === 'Perdido').length} perdidos`} icon="📋" color="#6366F1" />
        <KPICard label="MW en Cartera" value={`${mwCartera.toFixed(2)} MW`} sub={`${activos.reduce((s, p) => s + (p.num_paneles || 0), 0).toLocaleString()} paneles`} icon="☀️" color="#F59E0B" />
        <KPICard label="Generación Anual" value={`${(genTotal / 1000).toFixed(1)} GWh`} sub="Año 1 estimado" icon="⚡" color="#3B82F6" />
        <KPICard label="Ingreso Estimado" value={fmtMXN(ingresoTotal)} sub="PPA · Año 1" icon="💰" color="#10B981" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Pipeline */}
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Pipeline por Etapa</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={pipelineData} layout="vertical" margin={{ left: 10, right: 10 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Proyectos" radius={4}>
                {pipelineData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut capacidad */}
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Capacidad por Estado (kWp)</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pipelineData} dataKey="kwp" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                {pipelineData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {pipelineData.map(d => (
              <span key={d.name} style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                {d.name}
              </span>
            ))}
          </div>
        </div>

        {/* Tendencia ingresos */}
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Tendencia Ingresos PPA (MXN M)</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={tendenciaData} margin={{ left: 0, right: 10 }}>
              <defs>
                <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="anio" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="ingreso" name="Ingreso (M MXN)" stroke="#F59E0B" fill="url(#gold)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        {/* Tabla recientes */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Proyectos Recientes</span>
            <button onClick={() => setView('proyectos')} style={{ fontSize: 12, color: 'var(--solar-gold)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Ver todos →</button>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Cliente</th><th>Capacidad</th><th>Tarifa</th><th>TIR GPBI</th><th>Estado</th><th>Actualizado</th></tr>
            </thead>
            <tbody>
              {recientes.map(p => (
                <tr key={p.id} onClick={() => { setSelectedId(p.id); setView('proyectos'); }} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 600 }}>{p.cliente}</td>
                  <td>{fmtKwp(p.capacidad_kwp)}</td>
                  <td>${(p.tarifa_brio_mxn || 0).toFixed(3)}/kWh</td>
                  <td style={{ color: (p.tir_gpbi_25 || 0) >= 0.20 ? '#10B981' : '#EF4444', fontWeight: 600 }}>{fmtPct(p.tir_gpbi_25)}</td>
                  <td><span className="status-badge" style={{ background: `${colorEstado(p.estado)}20`, color: colorEstado(p.estado), border: `1px solid ${colorEstado(p.estado)}40` }}>{p.estado}</span></td>
                  <td style={{ color: 'var(--text-muted)' }}>{fmtDate(p.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Alertas + Briefing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>
              🔔 Alertas Activas <span style={{ marginLeft: 6, background: alertas.filter(a => a.severidad === 'alta').length > 0 ? '#FEF2F2' : '#F0FDF4', color: alertas.filter(a => a.severidad === 'alta').length > 0 ? '#EF4444' : '#10B981', fontSize: 11, borderRadius: 10, padding: '1px 8px', fontWeight: 700 }}>{alertas.length}</span>
            </div>
            {alertas.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sin alertas activas ✓</p>}
            {alertas.slice(0, 4).map((a, i) => (
              <AlertaItem key={i} a={a} onClick={() => { setSelectedId(a.proyecto_id); setView('proyectos'); }} />
            ))}
          </div>

          <div className="card">
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>✨ Briefing Semanal IA</div>
            {briefing ? (
              <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto' }}>{briefing}</div>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>Genera un análisis ejecutivo de tu cartera con inteligencia artificial.</p>
            )}
            <button className="ia-button" onClick={handleBriefing} disabled={loadingBriefing} style={{ marginTop: 8, fontSize: 12 }}>
              {loadingBriefing ? <><span className="spinner">⟳</span> Generando...</> : '✨ Generar briefing'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, sub, icon, color }) {
  return (
    <div className="card" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{ width: 42, height: 42, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2, marginTop: 2 }}>{value}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
      </div>
    </div>
  );
}

function AlertaItem({ a, onClick }) {
  const colors = { alta: '#EF4444', media: '#F59E0B' };
  const c = colors[a.severidad] || '#9CA3AF';
  return (
    <div onClick={onClick} style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: c, marginTop: 5, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 12, fontWeight: 600 }}>{a.cliente}</div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{a.mensaje}</div>
      </div>
    </div>
  );
}
