import { calcularReciboCFE, aplicarNetmetering } from '../../../utils/calculationEngine.js';
import { TARIFAS_GDMTH } from '../../../utils/mockData.js';
import { fmtMXN } from '../../../utils/formatters.js';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function ReciboTab({ proyecto: p }) {
  const consumos = p.consumos || [];
  const genMensual = p.generacion_mensual || Array(12).fill(0);

  const rows = MESES.map((mes, i) => {
    const consumo = consumos[i] || {};
    const gen = genMensual[i] * 1000 || 0;
    const reciboSin = calcularReciboCFE(consumo, TARIFAS_GDMTH);
    const consumoCon = aplicarNetmetering(consumo, gen);
    const reciboCon = calcularReciboCFE(consumoCon, TARIFAS_GDMTH);
    const cobro_brio = gen * (p.tarifa_brio_mxn || 0);
    const total_cliente = reciboCon.total + cobro_brio;
    const ahorro = reciboSin.total - total_cliente;
    return { mes, sin: reciboSin.total, con: reciboCon.total, cobro_brio, total: total_cliente, ahorro, pct_ahorro: reciboSin.total > 0 ? ahorro / reciboSin.total : 0 };
  });

  const ahorroAcumulado = rows.reduce((acc, r, i) => {
    const prev = i === 0 ? 0 : acc[i - 1].acumulado;
    acc.push({ mes: r.mes, acumulado: prev + r.ahorro, ahorro: r.ahorro });
    return acc;
  }, []);

  const totalSin = rows.reduce((s, r) => s + r.sin, 0);
  const totalCon = rows.reduce((s, r) => s + r.con, 0);
  const totalBrio = rows.reduce((s, r) => s + r.cobro_brio, 0);
  const totalCliente = rows.reduce((s, r) => s + r.total, 0);
  const totalAhorro = rows.reduce((s, r) => s + r.ahorro, 0);

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Ahorro Acumulado Anual (MXN)</div>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={ahorroAcumulado}>
            <defs>
              <linearGradient id="green" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
            <Tooltip formatter={v => fmtMXN(v)} />
            <Area type="monotone" dataKey="acumulado" name="Ahorro acumulado" stroke="#10B981" fill="url(#green)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Comparativa Mensual CFE vs Brio</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ minWidth: 700 }}>
            <thead>
              <tr>
                <th>Mes</th>
                <th>CFE sin solar</th>
                <th>CFE con solar</th>
                <th>Cobro Brio</th>
                <th>Total cliente</th>
                <th>Ahorro</th>
                <th>% Ahorro</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.mes}>
                  <td style={{ fontWeight: 600 }}>{r.mes}</td>
                  <td>{fmtMXN(r.sin)}</td>
                  <td>{fmtMXN(r.con)}</td>
                  <td style={{ color: '#6366F1' }}>{fmtMXN(r.cobro_brio)}</td>
                  <td style={{ fontWeight: 600 }}>{fmtMXN(r.total)}</td>
                  <td style={{ color: r.ahorro >= 0 ? '#10B981' : '#EF4444', fontWeight: 600 }}>{fmtMXN(r.ahorro)}</td>
                  <td style={{ color: r.pct_ahorro >= 0.25 ? '#10B981' : '#F59E0B', fontWeight: 600 }}>{(r.pct_ahorro * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#F8FAFC', fontWeight: 700 }}>
                <td>TOTAL ANUAL</td>
                <td>{fmtMXN(totalSin)}</td>
                <td>{fmtMXN(totalCon)}</td>
                <td style={{ color: '#6366F1' }}>{fmtMXN(totalBrio)}</td>
                <td>{fmtMXN(totalCliente)}</td>
                <td style={{ color: '#10B981' }}>{fmtMXN(totalAhorro)}</td>
                <td style={{ color: '#10B981' }}>{totalSin > 0 ? ((totalAhorro / totalSin) * 100).toFixed(1) : 0}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
