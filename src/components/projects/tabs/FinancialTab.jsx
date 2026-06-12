import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';
import { calcularFlujoPPA } from '../../../utils/calculationEngine.js';
import { fmtUSD, fmtMXN } from '../../../utils/formatters.js';

export default function FinancialTab({ proyecto: p }) {
  const { flujos, payback_mes } = useMemo(() => calcularFlujoPPA({
    generacion_anual_mwh: p.generacion_anual_mwh || 0,
    tarifa_brio_usd: p.tarifa_brio_usd || 0,
    inflacion_anual: p.inflacion_anual || 0.045,
    degradacion_anual: p.degradacion_anual || 0.004,
    capex_usd: p.capex_usd || 0,
    om_usd_anual: p.om_usd_anual || 0,
    precio_venta_usd: p.capex_usd || 0,
  }), [p]);

  // Flujo anual para gráfica (25 años)
  const flujosAnuales = flujos.filter(f => f.tipo === 'operacion' && f.mes === 12).map(f => ({
    anio: `Año ${f.anio}`,
    acumulado: Math.round(f.acumulado_proyecto),
    flujo: Math.round(f.flujo_proyecto * 12),
  }));

  // Tabla años 1-5
  const tabla = Array.from({ length: 5 }, (_, i) => {
    const anio = i + 1;
    const meses = flujos.filter(f => f.tipo === 'operacion' && f.anio === anio);
    const gen = meses.reduce((s, m) => s + m.generacion, 0);
    const ing = meses.reduce((s, m) => s + m.ingreso, 0);
    const egr = meses.reduce((s, m) => s + m.om + m.ga, 0);
    const flujo = meses.reduce((s, m) => s + m.flujo_proyecto, 0);
    const acum = meses.at(-1)?.acumulado_proyecto || 0;
    const tarifa = meses[0]?.tarifa || 0;
    return { anio, gen: Math.round(gen), tarifa, ing, egr, flujo, acum };
  });

  const ingresoTotal25 = flujos.filter(f => f.tipo === 'operacion').reduce((s, f) => s + f.ingreso, 0);

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Payback</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{payback_mes ? `${payback_mes} meses` : '—'}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{payback_mes ? `${(payback_mes / 12).toFixed(1)} años` : ''}</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Ingreso Total 25 años</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{fmtUSD(ingresoTotal25)}</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>CAPEX</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{fmtUSD(p.capex_usd)}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Inversión inicial</div>
        </div>
      </div>

      {/* Flujo acumulado chart */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Flujo Acumulado del Proyecto (25 años, USD)</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={flujosAnuales} margin={{ right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="anio" tick={{ fontSize: 10 }} interval={4} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
            <Tooltip formatter={v => fmtUSD(v)} />
            {payback_mes && <ReferenceLine x={`Año ${Math.ceil(payback_mes / 12)}`} stroke="#10B981" strokeDasharray="4 4" label={{ value: 'Payback', fill: '#10B981', fontSize: 11 }} />}
            <ReferenceLine y={0} stroke="#EF4444" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="acumulado" name="Flujo acumulado" stroke="#F59E0B" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla años 1-5 */}
      <div className="card">
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Flujo Anual — Años 1 a 5 (USD)</div>
        <table className="data-table">
          <thead>
            <tr><th>Año</th><th>Generación (kWh)</th><th>Tarifa</th><th>Ingresos</th><th>Egresos</th><th>Flujo neto</th><th>Acumulado</th></tr>
          </thead>
          <tbody>
            {tabla.map(r => (
              <tr key={r.anio}>
                <td style={{ fontWeight: 600 }}>{r.anio}</td>
                <td>{r.gen.toLocaleString('es-MX')}</td>
                <td>${r.tarifa.toFixed(4)}/kWh</td>
                <td style={{ color: '#10B981', fontWeight: 600 }}>{fmtUSD(r.ing)}</td>
                <td style={{ color: '#EF4444' }}>{fmtUSD(r.egr)}</td>
                <td style={{ fontWeight: 700, color: r.flujo >= 0 ? '#10B981' : '#EF4444' }}>{fmtUSD(r.flujo)}</td>
                <td style={{ color: r.acum >= 0 ? '#10B981' : '#EF4444' }}>{fmtUSD(r.acum)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
