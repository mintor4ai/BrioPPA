import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { useApp } from '../../context/AppContext.jsx';
import { calcularMetricasProyecto } from '../../utils/calculationEngine.js';
import { fmtMXN, fmtUSD, fmtPct, fmtKwp } from '../../utils/formatters.js';
import CFEReader from '../cfe/CFEReader.jsx';

const STEPS = ['Cliente', 'Sistema Solar', 'Parámetros PPA', 'Resumen'];
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const INIT = {
  cliente: '', ubicacion: '', canal: 'GPBI', uen: 'GPBI', tarifa_cfe: 'GDMTH', division_cfe: 'Jalisco', no_servicio_cfe: '', estado: 'Cotizacion',
  capacidad_kwp: '', num_paneles: '', potencia_panel_kw: 0.5, generacion_anual_mwh: '', cobertura_sfv: '',
  tarifa_brio_usd: '', tarifa_brio_mxn: '', fx: 17.4, inflacion_anual: 0.045, degradacion_anual: 0.004,
  capex_usd: '', precio_venta_usd_w: '', utilidad_bruta_pct: '',
  om_usd_anual: '', distribuidor: '', epc: '',
  generacion_mensual: Array(12).fill(''),
  consumo_kwh_mensual: Array(12).fill(''),
  consumo_kw_mensual: Array(12).fill(''),
  notas: '',
};

export default function NewProjectWizard({ onClose, onSaved }) {
  const { saveProyecto, addToast } = useApp();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INIT);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setArr = (k, i, v) => setForm(f => { const arr = [...f[k]]; arr[i] = v; return { ...f, [k]: arr }; });

  const autoCalc = () => {
    const kwp = parseFloat(form.capacidad_kwp) || 0;
    const paneles = parseFloat(form.num_paneles) || 0;
    const capex = parseFloat(form.capex_usd) || 0;
    const pvW = parseFloat(form.precio_venta_usd_w) || 0;
    const tarifa_usd = parseFloat(form.tarifa_brio_usd) || 0;
    const fx = parseFloat(form.fx) || 17.4;
    const gen = parseFloat(form.generacion_anual_mwh) || 0;

    const updates = {};
    if (kwp && paneles && !form.potencia_panel_kw) updates.potencia_panel_kw = (kwp / paneles).toFixed(3);
    if (capex && kwp && !pvW) updates.precio_venta_usd_w = (capex / (kwp * 1000)).toFixed(4);
    if (tarifa_usd && fx) updates.tarifa_brio_mxn = (tarifa_usd * fx).toFixed(4);
    if (gen && tarifa_usd) updates.ingreso_anual_mxn = gen * 1000 * tarifa_usd * fx;
    if (capex && pvW && kwp) updates.utilidad_bruta_pct = ((pvW - capex / (kwp * 1000)) / pvW).toFixed(4);
    if (capex && kwp) updates.om_usd_anual = updates.om_usd_anual || (capex * 0.012).toFixed(0);

    if (Object.keys(updates).length) setForm(f => ({ ...f, ...updates }));
  };

  const buildProyecto = () => {
    const kwp = parseFloat(form.capacidad_kwp) || 0;
    const gen = parseFloat(form.generacion_anual_mwh) || 0;
    const tarifa_mxn = parseFloat(form.tarifa_brio_mxn) || 0;
    const tarifa_usd = parseFloat(form.tarifa_brio_usd) || 0;
    const fx = parseFloat(form.fx) || 17.4;
    const capex = parseFloat(form.capex_usd) || 0;

    const genMensual = form.generacion_mensual.map(v => parseFloat(v) || (gen / 12));
    const consumos = form.consumo_kwh_mensual.map((kwhStr, i) => ({
      kwh_base: (parseFloat(kwhStr) || 0) * 0.27,
      kwh_intermedia: (parseFloat(kwhStr) || 0) * 0.66,
      kwh_punta: (parseFloat(kwhStr) || 0) * 0.07,
      kw_base: (parseFloat(form.consumo_kw_mensual[i]) || 0) * 0.40,
      kw_intermedia: (parseFloat(form.consumo_kw_mensual[i]) || 0) * 0.90,
      kw_punta: (parseFloat(form.consumo_kw_mensual[i]) || 0) * 0.30,
      fp: 90,
      dias_mes: 30,
    }));

    const ingreso_anual = gen * 1000 * tarifa_usd * fx;
    const pvW = parseFloat(form.precio_venta_usd_w) || (capex > 0 && kwp > 0 ? capex / (kwp * 1000) : 0);
    const costo_w = (parseFloat(form.distribuidor) || pvW * 0.42);

    return {
      id: uuid(),
      ...form,
      capacidad_kwp: kwp,
      num_paneles: parseInt(form.num_paneles) || Math.round(kwp / (form.potencia_panel_kw || 0.5)),
      potencia_panel_kw: parseFloat(form.potencia_panel_kw) || 0.5,
      generacion_anual_mwh: gen,
      cobertura_sfv: parseFloat(form.cobertura_sfv) / 100 || 0.7,
      tarifa_brio_usd: tarifa_usd,
      tarifa_brio_mxn: tarifa_mxn,
      fx,
      capex_usd: capex,
      precio_venta_usd_w: pvW,
      utilidad_bruta_pct: pvW > 0 ? (pvW - (costo_w / 1000)) / pvW : 0,
      om_usd_anual: parseFloat(form.om_usd_anual) || capex * 0.012,
      inflacion_anual: parseFloat(form.inflacion_anual) || 0.045,
      degradacion_anual: parseFloat(form.degradacion_anual) || 0.004,
      descuento_vs_cfe: 0.35,
      ingreso_anual_mxn: ingreso_anual,
      generacion_mensual: genMensual,
      consumos,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  };

  const preview = step === 3 ? buildProyecto() : null;
  const previewMetricas = preview ? calcularMetricasProyecto(preview) : null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const proyecto = buildProyecto();
      await saveProyecto(proyecto);
      addToast(`Proyecto ${proyecto.cliente} creado exitosamente`, 'success');
      onSaved(proyecto.id);
    } catch (e) {
      addToast('Error al guardar: ' + e.message, 'error');
    }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', background: 'var(--solar-dark)', borderRadius: '16px 16px 0 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>☀</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>Nueva Cotización PPA</span>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 20 }}>×</button>
          </div>
          {/* Stepper */}
          <div style={{ display: 'flex', gap: 0, marginTop: 16 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: i < step ? 'pointer' : 'default' }} onClick={() => i < step && setStep(i)}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === step ? '#F59E0B' : i < step ? '#10B981' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white' }}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <div style={{ fontSize: 11, color: i === step ? '#F59E0B' : i < step ? '#10B981' : '#64748B', marginTop: 4, fontWeight: 500 }}>{s}</div>
                </div>
                {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: i < step ? '#10B981' : '#334155', margin: '0 8px', marginBottom: 18 }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 24, maxHeight: 'calc(90vh - 180px)', overflowY: 'auto' }}>
          {step === 0 && <Step1 form={form} set={set} />}
          {step === 1 && <Step2 form={form} set={set} setArr={setArr} autoCalc={autoCalc} />}
          {step === 2 && <Step3 form={form} set={set} setArr={setArr} autoCalc={autoCalc} />}
          {step === 3 && preview && previewMetricas && <Step4 proyecto={{ ...preview, ...previewMetricas }} />}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
            style={{ padding: '10px 20px', border: '1px solid var(--border)', borderRadius: 8, background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
            {step === 0 ? 'Cancelar' : '← Anterior'}
          </button>
          {step < 3
            ? <button onClick={() => { autoCalc(); setStep(s => s + 1); }} style={{ padding: '10px 24px', background: 'var(--solar-gold)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                Siguiente →
              </button>
            : <button onClick={handleSave} disabled={saving} style={{ padding: '10px 24px', background: '#10B981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Guardando...' : '✓ Crear Proyecto'}
              </button>
          }
        </div>
      </div>
    </div>
  );
}

function Label({ children, required }) {
  return <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>{children}{required && <span style={{ color: '#EF4444' }}> *</span>}</label>;
}

function Field({ label, children, required }) {
  return <div style={{ marginBottom: 14 }}><Label required={required}>{label}</Label>{children}</div>;
}

function Step1({ form, set }) {
  const handleDatosCFE = (datos) => {
    if (datos.no_servicio) set('no_servicio_cfe', datos.no_servicio);
    if (datos.tarifa) set('tarifa_cfe', datos.tarifa.includes('GDMTH') ? 'GDMTH' : datos.tarifa.includes('PDBT') ? 'PDBT' : 'GDBT');
    if (datos.division) set('division_cfe', datos.division);
    if (datos.cliente_nombre && !form.cliente) set('cliente', datos.cliente_nombre);
    if (datos.cliente_direccion && !form.ubicacion) set('ubicacion', datos.cliente_direccion);

    // Opción 1: usar historial mensual si el usuario lo aceptó
    if (datos.usar_historial && datos.kwh_mensual_historico) {
      set('consumo_kwh_mensual', datos.kwh_mensual_historico.map(v => v || ''));
      return; // ya tenemos consumo mensual completo
    }

    // Opción 2: usar datos del período actual (como antes)
    if (datos.kwh_total) {
      const mesIdx = datos.periodo
        ? ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
            .findIndex(m => datos.periodo.toLowerCase().includes(m))
        : new Date().getMonth();
      const idx = mesIdx >= 0 ? mesIdx : new Date().getMonth();
      const newKwh = [...form.consumo_kwh_mensual];
      const newKw  = [...form.consumo_kw_mensual];
      newKwh[idx] = datos.kwh_total || (datos.kwh_base + datos.kwh_intermedia + datos.kwh_punta);
      newKw[idx]  = datos.kw_max || datos.kw_intermedia || '';
      set('consumo_kwh_mensual', newKwh);
      set('consumo_kw_mensual', newKw);
    }
  };

  return (
    <div>
      {/* Lector CFE */}
      <div style={{ marginBottom: 20, padding: '16px', background: '#F0FDF4', borderRadius: 12, border: '1px solid #6EE7B7' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#065F46', marginBottom: 4 }}>
          📄 Lector de Recibo CFE <span style={{ fontSize: 11, fontWeight: 400, color: '#059669' }}>— opcional, pero acelera el llenado</span>
        </div>
        <div style={{ fontSize: 12, color: '#059669', marginBottom: 12 }}>
          Sube el recibo en PDF o imagen y la IA extrae automáticamente los datos de consumo.
        </div>
        <CFEReader compact onDatosExtraidos={handleDatosCFE} />
      </div>

      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>Información del Cliente</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Nombre del cliente" required><input className="input-base" value={form.cliente} onChange={e => set('cliente', e.target.value)} placeholder="Ej: TEKLAS, VITRO, LALA..." /></Field>
        <Field label="Ubicación"><input className="input-base" value={form.ubicacion} onChange={e => set('ubicacion', e.target.value)} placeholder="Ciudad, Estado" /></Field>
        <Field label="Canal">
          <select className="input-base" value={form.canal} onChange={e => set('canal', e.target.value)}>
            <option value="GPBI">GPBI</option>
            <option value="GPC">GPC</option>
            <option value="Externo">Externo</option>
          </select>
        </Field>
        <Field label="UEN"><input className="input-base" value={form.uen} onChange={e => set('uen', e.target.value)} placeholder="GPBI, GPC, GP Desarrollos" /></Field>
        <Field label="Tarifa CFE">
          <select className="input-base" value={form.tarifa_cfe} onChange={e => set('tarifa_cfe', e.target.value)}>
            <option value="GDMTH">GDMTH</option>
            <option value="PDBT">PDBT</option>
            <option value="GDBT">GDBT</option>
          </select>
        </Field>
        <Field label="División CFE"><input className="input-base" value={form.division_cfe} onChange={e => set('division_cfe', e.target.value)} placeholder="Jalisco, Noreste..." /></Field>
        <Field label="No. de servicio CFE"><input className="input-base" value={form.no_servicio_cfe} onChange={e => set('no_servicio_cfe', e.target.value)} /></Field>
        <Field label="Estado inicial">
          <select className="input-base" value={form.estado} onChange={e => set('estado', e.target.value)}>
            {['Prospecto', 'Cotizacion', 'Negociacion'].map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </Field>
      </div>

      {/* Consumo mensual */}
      <div style={{ marginTop: 8, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Consumo Mensual del Cliente</div>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>Ingresa los datos del recibo CFE para calcular el ahorro real.</p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, color: 'var(--text-secondary)' }}>Mes</th>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, color: 'var(--text-secondary)' }}>kWh total</th>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, color: 'var(--text-secondary)' }}>kW demanda máx.</th>
            </tr>
          </thead>
          <tbody>
            {MESES.map((mes, i) => (
              <tr key={mes} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '6px 10px', fontWeight: 600 }}>{mes}</td>
                <td style={{ padding: '4px 8px' }}><input className="input-base" type="number" style={{ padding: '5px 8px' }} value={form.consumo_kwh_mensual[i]} onChange={e => { const arr = [...form.consumo_kwh_mensual]; arr[i] = e.target.value; form.consumo_kwh_mensual = arr; }} placeholder="ej: 75000" /></td>
                <td style={{ padding: '4px 8px' }}><input className="input-base" type="number" style={{ padding: '5px 8px' }} value={form.consumo_kw_mensual[i]} onChange={e => { const arr = [...form.consumo_kw_mensual]; arr[i] = e.target.value; form.consumo_kw_mensual = arr; }} placeholder="ej: 320" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Step2({ form, set, setArr, autoCalc }) {
  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Sistema Fotovoltaico</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Capacidad del sistema (kWp)" required>
          <input className="input-base" type="number" value={form.capacidad_kwp} onChange={e => set('capacidad_kwp', e.target.value)} placeholder="Ej: 837" onBlur={autoCalc} />
        </Field>
        <Field label="Número de paneles">
          <input className="input-base" type="number" value={form.num_paneles} onChange={e => set('num_paneles', e.target.value)} placeholder="Ej: 1674" onBlur={autoCalc} />
        </Field>
        <Field label="Potencia por panel (kW)">
          <select className="input-base" value={form.potencia_panel_kw} onChange={e => set('potencia_panel_kw', e.target.value)}>
            <option value="0.4">400 W</option>
            <option value="0.45">450 W</option>
            <option value="0.5">500 W</option>
            <option value="0.55">550 W</option>
            <option value="0.6">600 W</option>
          </select>
        </Field>
        <Field label="Generación anual estimada (MWh/año)" required>
          <input className="input-base" type="number" value={form.generacion_anual_mwh} onChange={e => set('generacion_anual_mwh', e.target.value)} placeholder="Ej: 1424" onBlur={autoCalc} />
        </Field>
        <Field label="Cobertura del consumo (%)">
          <input className="input-base" type="number" value={form.cobertura_sfv} onChange={e => set('cobertura_sfv', e.target.value)} placeholder="Ej: 72 (para 72%)" />
        </Field>
        <Field label="Distribuidor de equipos">
          <input className="input-base" value={form.distribuidor} onChange={e => set('distribuidor', e.target.value)} placeholder="Solarever, Longi, Trina..." />
        </Field>
        <Field label="EPC / Instalador">
          <input className="input-base" value={form.epc} onChange={e => set('epc', e.target.value)} placeholder="Brio Construcción, Externo..." />
        </Field>
      </div>

      <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Generación mensual estimada (MWh)</div>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>Si dejas en blanco se distribuirá uniformemente la generación anual.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
        {MESES.map((mes, i) => (
          <div key={mes}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 3 }}>{mes}</div>
            <input className="input-base" type="number" style={{ padding: '6px 8px' }} value={form.generacion_mensual[i]} onChange={e => setArr('generacion_mensual', i, e.target.value)} placeholder={(parseFloat(form.generacion_anual_mwh) / 12 || 0).toFixed(0)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Step3({ form, set, autoCalc }) {
  const tarifa_mxn = (parseFloat(form.tarifa_brio_usd) || 0) * (parseFloat(form.fx) || 17.4);
  const ingreso_anual = (parseFloat(form.generacion_anual_mwh) || 0) * 1000 * (parseFloat(form.tarifa_brio_usd) || 0) * (parseFloat(form.fx) || 17.4);

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Parámetros Financieros del PPA</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Tarifa PPA (USD/kWh)" required>
          <input className="input-base" type="number" step="0.001" value={form.tarifa_brio_usd} onChange={e => { set('tarifa_brio_usd', e.target.value); set('tarifa_brio_mxn', ((parseFloat(e.target.value) || 0) * (parseFloat(form.fx) || 17.4)).toFixed(4)); }} placeholder="Ej: 0.0977" onBlur={autoCalc} />
        </Field>
        <Field label="Tipo de cambio FX (MXN/USD)">
          <input className="input-base" type="number" value={form.fx} onChange={e => set('fx', e.target.value)} onBlur={autoCalc} />
        </Field>
        <Field label="Tarifa PPA (MXN/kWh) — calculada automáticamente">
          <input className="input-base" type="number" value={form.tarifa_brio_mxn || tarifa_mxn.toFixed(4)} onChange={e => set('tarifa_brio_mxn', e.target.value)} placeholder="Calculada automáticamente" />
        </Field>
        <div className="card" style={{ background: '#F0FDF4', border: '1px solid #6EE7B7' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#065F46' }}>INGRESO ANUAL ESTIMADO AÑO 1</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#065F46', marginTop: 4 }}>{fmtMXN(ingreso_anual || (parseFloat(form.ingreso_anual_mxn) || 0))}</div>
        </div>
        <Field label="CAPEX total del sistema (USD)" required>
          <input className="input-base" type="number" value={form.capex_usd} onChange={e => set('capex_usd', e.target.value)} placeholder="Ej: 771288" onBlur={autoCalc} />
          {form.capex_usd && parseFloat(form.capex_usd) > 0 && (
            <div style={{ fontSize: 11, marginTop: 4, color: parseFloat(form.capex_usd) < 10000 ? '#EF4444' : '#64748B', fontWeight: parseFloat(form.capex_usd) < 10000 ? 700 : 400 }}>
              {parseFloat(form.capex_usd) < 10000
                ? `⚠ Valor muy bajo — ¿quisiste decir USD $${(parseFloat(form.capex_usd) * 1000).toLocaleString()}K?`
                : `= USD $${parseFloat(form.capex_usd).toLocaleString('en-US', { minimumFractionDigits: 0 })} dólares`}
            </div>
          )}
        </Field>
        <Field label="Precio de venta (USD/W)">
          <input className="input-base" type="number" step="0.001" value={form.precio_venta_usd_w} onChange={e => set('precio_venta_usd_w', e.target.value)} placeholder="Calculado automáticamente" onBlur={autoCalc} />
          {form.precio_venta_usd_w && parseFloat(form.precio_venta_usd_w) > 0 && (
            <div style={{ fontSize: 11, marginTop: 4, color: parseFloat(form.precio_venta_usd_w) < 0.3 || parseFloat(form.precio_venta_usd_w) > 2 ? '#EF4444' : '#64748B', fontWeight: parseFloat(form.precio_venta_usd_w) < 0.3 || parseFloat(form.precio_venta_usd_w) > 2 ? 700 : 400 }}>
              {parseFloat(form.precio_venta_usd_w) < 0.3 || parseFloat(form.precio_venta_usd_w) > 2
                ? `⚠ Rango inusual — valor típico entre $0.60 y $1.20/W`
                : `Rango típico: $0.60 – $1.20/W`}
            </div>
          )}
        </Field>
        <Field label="O&M anual (USD)">
          <input className="input-base" type="number" value={form.om_usd_anual} onChange={e => set('om_usd_anual', e.target.value)} placeholder="Aprox. 1.2% del CAPEX" />
        </Field>
        <Field label="Inflación anual (decimal)">
          <input className="input-base" type="number" step="0.001" value={form.inflacion_anual} onChange={e => set('inflacion_anual', e.target.value)} placeholder="0.045 = 4.5%" />
        </Field>
        <Field label="Degradación anual paneles (decimal)">
          <input className="input-base" type="number" step="0.001" value={form.degradacion_anual} onChange={e => set('degradacion_anual', e.target.value)} placeholder="0.004 = 0.4%/año" />
        </Field>
      </div>

      <div style={{ marginTop: 16, padding: '14px 16px', background: '#FFFBEB', borderRadius: 10, border: '1px solid #FCD34D', fontSize: 13 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>ℹ Los siguientes indicadores se calcularán automáticamente:</div>
        <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          TIR del proyecto (10 / 15 / 25 años) · TIR GPBI · Payback en meses · Flujo financiero 25 años · Comparativa CFE mensual
        </div>
      </div>
    </div>
  );
}

function Step4({ proyecto: p }) {
  const tirRaw = (p.tir_gpbi_25 || 0) * 100;
  const tirIrreal = tirRaw > 500 || p.capex_usd < 10000;
  const tir_gpbi_pct = tirIrreal ? '—' : tirRaw.toFixed(1);
  const cumple = !tirIrreal && parseFloat(tir_gpbi_pct) >= 20;

  return (
    <div>
      <div style={{ padding: '16px 20px', background: cumple ? '#ECFDF5' : '#FEF2F2', borderRadius: 12, border: `1px solid ${cumple ? '#6EE7B7' : '#FCA5A5'}`, marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: tirIrreal ? '#7C3AED' : cumple ? '#065F46' : '#991B1B', marginBottom: 8 }}>
          {tirIrreal ? '⚠ Revisar datos — CAPEX parece muy bajo para el sistema ingresado' : cumple ? '✓ Proyecto viable — TIR cumple el mínimo' : '⚠ Revisar — TIR por debajo del mínimo (20%)'}
        </div>
        {tirIrreal && (
          <div style={{ fontSize: 12, color: '#7C3AED', marginBottom: 8 }}>
            Regresa al paso 3 y verifica que el CAPEX sea el valor completo en USD (ejemplo: <strong>771,288</strong> y no <strong>771</strong>).
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <KPIPreview label="Capacidad" value={fmtKwp(p.capacidad_kwp)} />
          <KPIPreview label="CAPEX" value={fmtUSD(p.capex_usd)} />
          <KPIPreview label="Tarifa PPA" value={`$${(p.tarifa_brio_mxn || 0).toFixed(3)}/kWh`} />
          <KPIPreview label="Ingreso Año 1" value={fmtMXN(p.ingreso_anual_mxn)} />
          <KPIPreview label="TIR GPBI 25a" value={`${tir_gpbi_pct}%`} color={cumple ? '#065F46' : '#991B1B'} />
          <KPIPreview label="TIR Proyecto 25a" value={fmtPct(p.tir_proyecto_25)} />
          <KPIPreview label="Payback" value={p.payback_meses ? `${p.payback_meses} meses` : '—'} />
          <KPIPreview label="Generación/año" value={`${(p.generacion_anual_mwh || 0).toFixed(0)} MWh`} />
        </div>
      </div>

      <div className="card">
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Resumen del Proyecto</div>
        <table style={{ width: '100%', fontSize: 13 }}>
          <tbody>
            {[
              ['Cliente', p.cliente],
              ['Ubicación', p.ubicacion],
              ['Canal / UEN', `${p.canal} · ${p.uen}`],
              ['Tarifa CFE', p.tarifa_cfe],
              ['Sistema', `${p.capacidad_kwp} kWp · ${p.num_paneles} paneles de ${p.potencia_panel_kw} kW`],
              ['Generación anual', `${(p.generacion_anual_mwh || 0).toFixed(0)} MWh/año`],
              ['Tarifa PPA', `$${(p.tarifa_brio_usd || 0).toFixed(4)} USD/kWh = $${(p.tarifa_brio_mxn || 0).toFixed(4)} MXN/kWh`],
              ['CAPEX', fmtUSD(p.capex_usd)],
              ['Precio venta', `$${(p.precio_venta_usd_w || 0).toFixed(4)}/W`],
              ['O&M anual', fmtUSD(p.om_usd_anual)],
              ['Inflación PPA', `${((p.inflacion_anual || 0.045) * 100).toFixed(1)}%/año`],
            ].map(([l, v]) => (
              <tr key={l} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '7px 0', color: 'var(--text-secondary)', width: 180 }}>{l}</td>
                <td style={{ padding: '7px 0', fontWeight: 600 }}>{v || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KPIPreview({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2, color: color || 'inherit' }}>{value}</div>
    </div>
  );
}
