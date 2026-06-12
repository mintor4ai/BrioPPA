import { useState } from 'react';
import CFEReader from '../../cfe/CFEReader.jsx';

export default function SystemTab({ proyecto: p, onSave, addToast }) {
  const [form, setForm] = useState({
    distribuidor: p.distribuidor || '',
    costo_equipo_usd_w: p.costo_equipo_usd_w || '',
    epc: p.epc || '',
    costo_epc_usd_w: p.costo_epc_usd_w || '',
    fecha_inicio_construccion: p.fecha_inicio_construccion || '',
    fecha_fin_construccion: p.fecha_fin_construccion || '',
    fecha_inicio_operacion: p.fecha_inicio_operacion || '',
    notas: p.notas || '',
    fx: p.fx || 17.4,
    om_usd_anual: p.om_usd_anual || '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await onSave({ ...p, ...form });
    addToast('Sistema actualizado', 'success');
    setSaving(false);
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Sistema SFV */}
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Parámetros del Sistema SFV</div>
          <InfoRow label="Capacidad" value={`${p.capacidad_kwp} kWp`} />
          <InfoRow label="Paneles" value={`${(p.num_paneles || 0).toLocaleString()} × ${p.potencia_panel_kw} kW`} />
          <InfoRow label="Generación anual" value={`${p.generacion_anual_mwh} MWh/año`} />
          <InfoRow label="Cobertura SFV" value={`${((p.cobertura_sfv || 0) * 100).toFixed(1)}%`} />
          <InfoRow label="Tarifa CFE" value={p.tarifa_cfe} />
          <InfoRow label="División CFE" value={p.division_cfe} />
        </div>

        {/* Parámetros económicos */}
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Parámetros Económicos</div>
          <InfoRow label="CAPEX" value={`USD $${(p.capex_usd || 0).toLocaleString()}`} />
          <InfoRow label="Precio venta" value={`$${p.precio_venta_usd_w}/W`} />
          <InfoRow label="Utilidad bruta" value={`${((p.utilidad_bruta_pct || 0) * 100).toFixed(1)}%`} />
          <InfoRow label="Inflación anual" value={`${((p.inflacion_anual || 0.045) * 100).toFixed(1)}%`} />
          <InfoRow label="Degradación anual" value={`${((p.degradacion_anual || 0.004) * 100).toFixed(1)}%`} />
          <div style={{ marginTop: 8 }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>FX (MXN/USD)</label>
            <input className="input-base" style={{ marginTop: 4 }} type="number" value={form.fx} onChange={e => set('fx', e.target.value)} />
          </div>
          <div style={{ marginTop: 8 }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>O&M USD/año</label>
            <input className="input-base" style={{ marginTop: 4 }} type="number" value={form.om_usd_anual} onChange={e => set('om_usd_anual', e.target.value)} />
          </div>
        </div>

        {/* Proveedores */}
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Proveedores</div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Distribuidor de equipo</label>
            <input className="input-base" style={{ marginTop: 4 }} value={form.distribuidor} onChange={e => set('distribuidor', e.target.value)} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Costo equipo (USD/W)</label>
            <input className="input-base" style={{ marginTop: 4 }} type="number" value={form.costo_equipo_usd_w} onChange={e => set('costo_equipo_usd_w', e.target.value)} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>EPC / Instalador</label>
            <input className="input-base" style={{ marginTop: 4 }} value={form.epc} onChange={e => set('epc', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Costo EPC (USD/W)</label>
            <input className="input-base" style={{ marginTop: 4 }} type="number" value={form.costo_epc_usd_w} onChange={e => set('costo_epc_usd_w', e.target.value)} />
          </div>
        </div>

        {/* Fechas */}
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Fechas Clave</div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Inicio construcción</label>
            <input className="input-base" style={{ marginTop: 4 }} type="date" value={form.fecha_inicio_construccion} onChange={e => set('fecha_inicio_construccion', e.target.value)} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Fin construcción</label>
            <input className="input-base" style={{ marginTop: 4 }} type="date" value={form.fecha_fin_construccion} onChange={e => set('fecha_fin_construccion', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Inicio operación</label>
            <input className="input-base" style={{ marginTop: 4 }} type="date" value={form.fecha_inicio_operacion} onChange={e => set('fecha_inicio_operacion', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Notas */}
      <div className="card" style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 600, fontSize: 14 }}>Notas del equipo</label>
        <textarea className="input-base" style={{ marginTop: 8, minHeight: 80, resize: 'vertical' }} value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="Agrega notas de seguimiento, acuerdos, observaciones..." />
      </div>

      <button onClick={handleSave} disabled={saving} style={{ padding: '10px 24px', background: 'var(--solar-gold)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, opacity: saving ? 0.7 : 1 }}>
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </button>

      {/* Lector de recibo CFE */}
      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>📄 Actualizar consumo desde recibo CFE</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>Sube el recibo más reciente para actualizar los datos de consumo del cliente.</div>
        <CFEReader compact onDatosExtraidos={(datos) => {
          if (datos.no_servicio) setForm(f => ({ ...f, no_servicio_cfe: datos.no_servicio }));
          addToast('Datos del recibo CFE extraídos ✓', 'success');
        }} />
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value || '—'}</span>
    </div>
  );
}
