import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { fmtMXN, fmtUSD, fmtKwp, fmtPct, fmtKwh } from '../../../utils/formatters.js';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return <div className="custom-tooltip"><b>{label}</b><br />{payload.map((p, i) => <div key={i}>{p.name}: {p.value?.toLocaleString('es-MX')}</div>)}</div>;
};

export default function SummaryTab({ proyecto: p }) {
  const genData = (p.generacion_mensual || []).map((v, i) => ({ mes: MESES[i], mwh: v, fill: i === 5 || i === 6 ? '#F59E0B' : '#3B82F6' }));

  const tirData = [
    { horizonte: '10 años', proyecto: ((p.tir_proyecto_10 || 0) * 100).toFixed(1), gpbi: ((p.tir_gpbi_10 || 0) * 100).toFixed(1) },
    { horizonte: '15 años', proyecto: ((p.tir_proyecto_15 || 0) * 100).toFixed(1), gpbi: ((p.tir_gpbi_15 || 0) * 100).toFixed(1) },
    { horizonte: '25 años', proyecto: ((p.tir_proyecto_25 || 0) * 100).toFixed(1), gpbi: ((p.tir_gpbi_25 || 0) * 100).toFixed(1) },
  ];

  return (
    <div>
      {/* Metrics grid */}
      <div className="metric-grid" style={{ marginBottom: 20 }}>
        <MetricItem label="Capacidad" value={fmtKwp(p.capacidad_kwp)} />
        <MetricItem label="Paneles" value={`${(p.num_paneles || 0).toLocaleString()}`} sub={`${p.potencia_panel_kw} kW c/u`} />
        <MetricItem label="Generación Anual" value={fmtKwh((p.generacion_anual_mwh || 0) * 1000)} />
        <MetricItem label="Cobertura SFV" value={fmtPct(p.cobertura_sfv)} />
        <MetricItem label="Tarifa PPA" value={`$${(p.tarifa_brio_mxn || 0).toFixed(4)}`} sub="MXN/kWh" />
        <MetricItem label="Descuento vs CFE" value={fmtPct(p.descuento_vs_cfe)} color={p.descuento_vs_cfe >= 0.30 ? '#10B981' : '#F59E0B'} />
        <MetricItem label="CAPEX" value={fmtUSD(p.capex_usd)} />
        <MetricItem label="Precio Venta" value={`$${p.precio_venta_usd_w}/W`} />
        <MetricItem label="Utilidad Bruta" value={fmtPct(p.utilidad_bruta_pct)} />
        <MetricItem label="Payback" value={p.payback_meses ? `${p.payback_meses} meses` : '—'} />
        <MetricItem label="Ingreso Año 1" value={fmtMXN(p.ingreso_anual_mxn)} />
        <MetricItem label="O&M Anual" value={fmtUSD(p.om_usd_anual)} />
      </div>

      {/* Generación mensual */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Generación Mensual Estimada (MWh)</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={genData} margin={{ bottom: 0 }}>
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="mwh" name="MWh" radius={4}>
              {genData.map((d, i) => <Cell key={i} fill={d.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* TIR table */}
      <div className="card">
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Rentabilidad por Horizonte</div>
        <table className="data-table">
          <thead><tr><th>Horizonte</th><th>TIR Proyecto</th><th>TIR GPBI</th><th>vs Mínimo (20%)</th></tr></thead>
          <tbody>
            {tirData.map(row => (
              <tr key={row.horizonte}>
                <td style={{ fontWeight: 600 }}>{row.horizonte}</td>
                <td>{row.proyecto}%</td>
                <td style={{ fontWeight: 700, color: parseFloat(row.gpbi) >= 20 ? '#10B981' : '#EF4444' }}>{row.gpbi}%</td>
                <td>
                  <span style={{ color: parseFloat(row.gpbi) >= 20 ? '#10B981' : '#EF4444', fontWeight: 600, fontSize: 12 }}>
                    {parseFloat(row.gpbi) >= 20 ? '✓ Cumple' : '✗ No cumple'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricItem({ label, value, sub, color }) {
  return (
    <div className="metric-item">
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={color ? { color } : {}}>{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}
