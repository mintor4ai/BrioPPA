import { useState, useMemo, useCallback } from 'react';
import { calcularMetricasProyecto, calcularFlujoPPA } from '../../utils/calculationEngine.js';
import { fmtMXN, fmtUSD, fmtPct } from '../../utils/formatters.js';
import { exportarProyectoExcel } from '../../utils/excelExport.js';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';
import { useApp } from '../../context/AppContext.jsx';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return <div className="custom-tooltip"><b>{label}</b>{payload.map((p, i) => <div key={i}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</div>)}</div>;
};

function Slider({ label, value, min, max, step, format, onChange, color = 'var(--solar-gold)', hint }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color }}>{format(value)}</span>
      </div>
      <div style={{ position: 'relative', height: 6, background: 'var(--border)', borderRadius: 3 }}>
        <div style={{ position: 'absolute', left: 0, width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', marginTop: -8, opacity: 0, cursor: 'pointer', height: 20, position: 'relative', zIndex: 1 }}
      />
      {hint && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: -4 }}>{hint}</div>}
    </div>
  );
}

export default function AdjustTab({ proyecto: p }) {
  const { saveProyecto, addToast } = useApp();
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [params, setParams] = useState({
    tarifa_brio_usd:   p.tarifa_brio_usd    || 0.097,
    capacidad_kwp:     p.capacidad_kwp       || 500,
    generacion_factor: 1.0,
    capex_usd:         p.capex_usd           || 500000,
    precio_venta_usd_w: p.precio_venta_usd_w || 0.92,
    inflacion_anual:   p.inflacion_anual     || 0.045,
    degradacion_anual: p.degradacion_anual   || 0.004,
    cobertura_sfv:     p.cobertura_sfv       || 0.70,
    om_usd_anual:      p.om_usd_anual        || (p.capex_usd * 0.012),
    fx:                p.fx                  || 17.4,
  });

  const set = useCallback((k, v) => setParams(prev => ({ ...prev, [k]: v })), []);

  const proyectoAjustado = useMemo(() => ({
    ...p,
    ...params,
    tarifa_brio_mxn: params.tarifa_brio_usd * params.fx,
    generacion_anual_mwh: (p.generacion_anual_mwh || 0) * params.generacion_factor,
    ingreso_anual_mxn: (p.generacion_anual_mwh || 0) * params.generacion_factor * 1000 * params.tarifa_brio_usd * params.fx,
    utilidad_bruta_pct: params.precio_venta_usd_w > 0
      ? (params.precio_venta_usd_w - (params.capex_usd / ((params.capacidad_kwp || 1) * 1000))) / params.precio_venta_usd_w
      : 0,
  }), [p, params]);

  const metricas = useMemo(() => calcularMetricasProyecto(proyectoAjustado), [proyectoAjustado]);

  // Base metrics for comparison
  const metricasBase = useMemo(() => calcularMetricasProyecto(p), [p]);

  // Gráfica flujo acumulado
  const flujosChart = useMemo(() => {
    const { flujos } = metricas;
    return (flujos || [])
      .filter(f => f.tipo === 'operacion' && f.mes === 6)
      .map(f => ({
        anio: `A${f.anio}`,
        ajustado: Math.round(f.acumulado_proyecto),
        original: 0,
      }));
  }, [metricas]);

  // Agregar flujo original
  const flujosChartCompleto = useMemo(() => {
    const { flujos: flujosOrig } = calcularFlujoPPA({
      generacion_anual_mwh: p.generacion_anual_mwh || 0,
      tarifa_brio_usd: p.tarifa_brio_usd || 0,
      inflacion_anual: p.inflacion_anual || 0.045,
      degradacion_anual: p.degradacion_anual || 0.004,
      capex_usd: p.capex_usd || 0,
      om_usd_anual: p.om_usd_anual || 0,
      precio_venta_usd: p.capex_usd || 0,
    });
    return flujosChart.map((row, i) => {
      const orig = flujosOrig.filter(f => f.tipo === 'operacion' && f.mes === 6)[i];
      return { ...row, original: orig?.acumulado_proyecto || 0 };
    });
  }, [flujosChart, p, calcularFlujoPPA]);

  const delta = (nuevo, base, isPercent = false) => {
    if (!base || base === 0) return null;
    const d = nuevo - base;
    const sign = d >= 0 ? '+' : '';
    return isPercent
      ? `${sign}${(d * 100).toFixed(1)}pp`
      : `${sign}${(d * 100).toFixed(1)}%`;
  };

  const handleSave = async () => {
    setSaving(true);
    await saveProyecto(proyectoAjustado);
    addToast('Ajustes guardados en el proyecto', 'success');
    setSaving(false);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportarProyectoExcel({ ...proyectoAjustado, ...metricas });
      addToast('Excel exportado exitosamente', 'success');
    } catch (e) {
      addToast('Error al exportar: ' + e.message, 'error');
    }
    setExporting(false);
  };

  const tirCumple = (metricas.tir_gpbi_25 || 0) >= 0.20;

  return (
    <div>
      {/* KPI comparativa */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        <KPIComp label="TIR GPBI 25a" nuevo={metricas.tir_gpbi_25} base={metricasBase.tir_gpbi_25} fmt={fmtPct} cumple={tirCumple} />
        <KPIComp label="Payback" nuevo={metricas.payback_meses} base={metricasBase.payback_meses} fmt={v => `${v} m`} invertido />
        <KPIComp label="Ingreso Año 1" nuevo={proyectoAjustado.ingreso_anual_mxn} base={p.ingreso_anual_mxn} fmt={fmtMXN} />
        <KPIComp label="Tarifa MXN/kWh" nuevo={params.tarifa_brio_usd * params.fx} base={p.tarifa_brio_mxn} fmt={v => `$${v.toFixed(4)}`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Sliders */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            ⚙ Parámetros
            <button onClick={() => setParams({ tarifa_brio_usd: p.tarifa_brio_usd || 0.097, capacidad_kwp: p.capacidad_kwp || 500, generacion_factor: 1.0, capex_usd: p.capex_usd || 500000, precio_venta_usd_w: p.precio_venta_usd_w || 0.92, inflacion_anual: p.inflacion_anual || 0.045, degradacion_anual: p.degradacion_anual || 0.004, cobertura_sfv: p.cobertura_sfv || 0.70, om_usd_anual: p.om_usd_anual || p.capex_usd * 0.012, fx: p.fx || 17.4 })}
              style={{ fontSize: 11, color: 'var(--text-secondary)', background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}>
              Resetear
            </button>
          </div>

          <Slider label="Tarifa PPA" value={params.tarifa_brio_usd} min={0.05} max={0.15} step={0.001}
            format={v => `USD $${v.toFixed(4)}/kWh`} onChange={v => set('tarifa_brio_usd', v)}
            color="#F59E0B" hint={`= $${(params.tarifa_brio_usd * params.fx).toFixed(4)} MXN/kWh`} />

          <Slider label="Tipo de cambio FX" value={params.fx} min={15} max={22} step={0.1}
            format={v => `$${v.toFixed(1)} MXN/USD`} onChange={v => set('fx', v)} color="#6366F1" />

          <Slider label="Capacidad del sistema" value={params.capacidad_kwp} min={50} max={5000} step={10}
            format={v => `${v.toFixed(0)} kWp`} onChange={v => set('capacidad_kwp', v)} color="#3B82F6" />

          <Slider label="Factor de generación" value={params.generacion_factor} min={0.7} max={1.3} step={0.01}
            format={v => `${(v * 100).toFixed(0)}% del estimado`} onChange={v => set('generacion_factor', v)}
            color="#10B981" hint={`= ${((p.generacion_anual_mwh || 0) * params.generacion_factor).toFixed(0)} MWh/año`} />

          <Slider label="CAPEX total" value={params.capex_usd} min={100000} max={5000000} step={10000}
            format={v => `USD $${(v / 1000).toFixed(0)}K`} onChange={v => { set('capex_usd', v); set('om_usd_anual', v * 0.012); set('precio_venta_usd_w', v / ((params.capacidad_kwp || 500) * 1000)); }}
            color="#EF4444" hint={`= $${params.precio_venta_usd_w.toFixed(4)}/W`} />

          <Slider label="Precio de venta" value={params.precio_venta_usd_w} min={0.5} max={1.5} step={0.01}
            format={v => `USD $${v.toFixed(3)}/W`} onChange={v => set('precio_venta_usd_w', v)} color="#7C3AED" />

          <Slider label="Cobertura SFV" value={params.cobertura_sfv} min={0.3} max={0.95} step={0.01}
            format={v => `${(v * 100).toFixed(0)}%`} onChange={v => set('cobertura_sfv', v)} color="#06B6D4" />

          <Slider label="Inflación anual" value={params.inflacion_anual} min={0.01} max={0.10} step={0.005}
            format={v => `${(v * 100).toFixed(1)}%/año`} onChange={v => set('inflacion_anual', v)} color="#F97316" />

          <Slider label="Degradación paneles" value={params.degradacion_anual} min={0.002} max={0.01} step={0.001}
            format={v => `${(v * 100).toFixed(2)}%/año`} onChange={v => set('degradacion_anual', v)} color="#94A3B8" />

          <Slider label="O&M anual" value={params.om_usd_anual} min={0} max={params.capex_usd * 0.03} step={500}
            format={v => `USD $${v.toFixed(0)}`} onChange={v => set('om_usd_anual', v)} color="#64748B"
            hint={`= ${((params.om_usd_anual / params.capex_usd) * 100).toFixed(2)}% del CAPEX`} />
        </div>

        {/* Gráfica + TIR table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card">
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Flujo Acumulado 25 años (USD)</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={flujosChartCompleto} margin={{ right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="anio" tick={{ fontSize: 9 }} interval={4} />
                <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#EF4444" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="ajustado" name="Ajustado" stroke="#F59E0B" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="original" name="Original" stroke="#94A3B8" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 6, fontSize: 11 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 20, height: 2, background: '#F59E0B', display: 'inline-block' }} /> Ajustado</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 20, height: 2, background: '#94A3B8', display: 'inline-block', borderTop: '2px dashed #94A3B8' }} /> Original</span>
            </div>
          </div>

          {/* TIR Comparativa */}
          <div className="card">
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Comparativa vs Original</div>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface)' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600 }}>Métrica</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600 }}>Original</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600 }}>Ajustado</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600 }}>Δ</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'TIR GPBI 25a', orig: metricasBase.tir_gpbi_25, nuevo: metricas.tir_gpbi_25, fmt: fmtPct, meta: 0.20 },
                  { label: 'TIR GPBI 15a', orig: metricasBase.tir_gpbi_15, nuevo: metricas.tir_gpbi_15, fmt: fmtPct, meta: 0.20 },
                  { label: 'TIR GPBI 10a', orig: metricasBase.tir_gpbi_10, nuevo: metricas.tir_gpbi_10, fmt: fmtPct, meta: 0.20 },
                  { label: 'Payback',      orig: metricasBase.payback_meses, nuevo: metricas.payback_meses, fmt: v => `${v}m`, invertido: true },
                  { label: 'Ingreso año 1', orig: p.ingreso_anual_mxn, nuevo: proyectoAjustado.ingreso_anual_mxn, fmt: fmtMXN },
                ].map((row, i) => {
                  const diff = (row.nuevo || 0) - (row.orig || 0);
                  const diffPct = row.orig ? diff / Math.abs(row.orig) : 0;
                  const mejorado = row.invertido ? diff < 0 : diff > 0;
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '6px 8px', fontWeight: 500 }}>{row.label}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', color: 'var(--text-secondary)' }}>{row.fmt(row.orig || 0)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700, color: row.meta ? ((row.nuevo || 0) >= row.meta ? '#10B981' : '#EF4444') : (mejorado ? '#10B981' : '#EF4444') }}>{row.fmt(row.nuevo || 0)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: mejorado ? '#10B981' : '#EF4444' }}>
                        {diff === 0 ? '—' : `${diff >= 0 ? '+' : ''}${row.label === 'Payback' ? `${diff}m` : (diffPct * 100).toFixed(1) + '%'}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Acciones */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSave} disabled={saving}
              style={{ flex: 1, padding: '10px', background: 'var(--solar-gold)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
              {saving ? 'Guardando...' : '💾 Guardar ajustes'}
            </button>
            <button onClick={handleExport} disabled={exporting}
              style={{ flex: 1, padding: '10px', background: '#10B981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
              {exporting ? '⟳ Generando...' : '📥 Exportar Excel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPIComp({ label, nuevo, base, fmt, cumple, invertido }) {
  const diff = (nuevo || 0) - (base || 0);
  const mejorado = invertido ? diff < 0 : diff > 0;
  return (
    <div className="card" style={{ padding: '10px 12px', border: cumple !== undefined ? `2px solid ${cumple ? '#10B981' : '#EF4444'}` : '1px solid var(--border)' }}>
      <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: cumple !== undefined ? (cumple ? '#10B981' : '#EF4444') : 'var(--text-primary)', marginTop: 2 }}>{fmt(nuevo || 0)}</div>
      {diff !== 0 && <div style={{ fontSize: 10, color: mejorado ? '#10B981' : '#EF4444', marginTop: 1, fontWeight: 600 }}>
        {diff >= 0 ? '▲' : '▼'} vs original
      </div>}
    </div>
  );
}
