import { useState } from 'react';
import CFEReader from './CFEReader.jsx';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function CFEReaderPage({ onNuevaCotizacion }) {
  const [recibos, setRecibos] = useState([]);
  const [datosActuales, setDatosActuales] = useState(null);

  const handleDatos = (datos) => {
    setDatosActuales(datos);

    // Si el usuario aceptó usar el historial, expandirlo como recibos individuales por mes
    if (datos.usar_historial && datos.kwh_mensual_historico) {
      const recibosHistorial = datos.kwh_mensual_historico
        .map((kwh, i) => kwh ? {
          ...datos,
          periodo: `${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][i]} ${new Date().getFullYear()}`,
          kwh_total: kwh,
          _ts: Date.now() + i,
          _historico: true,
        } : null)
        .filter(Boolean);
      if (recibosHistorial.length > 0) {
        setRecibos(recibosHistorial.slice(0, 12));
        return;
      }
    }

    setRecibos(prev => {
      const sinDuplicado = prev.filter(r => r.periodo !== datos.periodo);
      return [{ ...datos, _ts: Date.now() }, ...sinDuplicado].slice(0, 12);
    });
  };

  // Calcular resumen de consumo anual si hay múltiples recibos
  const kwh_anual = recibos.reduce((s, r) => s + (r.kwh_total || (r.kwh_base || 0) + (r.kwh_intermedia || 0) + (r.kwh_punta || 0)), 0);
  const importe_anual = recibos.reduce((s, r) => s + (r.importe_total || 0), 0);
  const precio_medio = kwh_anual > 0 ? importe_anual / kwh_anual : 0;

  return (
    <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>📄 Lector de Recibos CFE</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
          Sube uno o varios recibos en PDF o imagen — la IA extrae automáticamente todos los datos de consumo.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Uploader */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Subir recibo</div>
            <CFEReader onDatosExtraidos={handleDatos} />
          </div>

          {/* Tips */}
          <div style={{ padding: '14px 16px', background: '#EFF6FF', borderRadius: 10, border: '1px solid #BFDBFE', fontSize: 13 }}>
            <div style={{ fontWeight: 600, color: '#1E40AF', marginBottom: 8 }}>💡 Consejos para mejores resultados</div>
            <ul style={{ margin: 0, paddingLeft: 16, color: '#1D4ED8', lineHeight: 1.8, fontSize: 12 }}>
              <li>Sube el PDF original de CFE para máxima precisión</li>
              <li>Si es foto, asegúrate que el texto sea legible</li>
              <li>Puedes subir hasta 12 recibos (uno por mes) para análisis anual</li>
              <li>Los datos se usan para pre-llenar el wizard de cotización</li>
            </ul>
          </div>
        </div>

        {/* Resumen y acción */}
        <div>
          {recibos.length > 0 && (
            <>
              {/* Resumen acumulado */}
              <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
                  Resumen — {recibos.length} recibo{recibos.length > 1 ? 's' : ''} cargado{recibos.length > 1 ? 's' : ''}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <Metrica label="kWh total" value={kwh_anual.toLocaleString('es-MX')} unit="kWh" />
                  <Metrica label="Importe total" value={`$${importe_anual.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`} unit="MXN" />
                  <Metrica label="Precio medio CFE" value={`$${precio_medio.toFixed(4)}`} unit="MXN/kWh" color="#F59E0B" />
                  <Metrica label="Demanda pico" value={Math.max(...recibos.map(r => r.kw_max || r.kw_intermedia || 0)).toLocaleString('es-MX')} unit="kW" />
                </div>

                {onNuevaCotizacion && (
                  <button
                    onClick={() => onNuevaCotizacion(recibos, datosActuales)}
                    style={{ width: '100%', padding: '10px', background: 'var(--solar-gold)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
                  >
                    ☀ Crear cotización con estos datos →
                  </button>
                )}
              </div>

              {/* Lista de recibos */}
              <div className="card">
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Recibos cargados</div>
                {recibos.map((r, i) => {
                  const kwh = r.kwh_total || (r.kwh_base || 0) + (r.kwh_intermedia || 0) + (r.kwh_punta || 0);
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                      <div>
                        <span style={{ fontWeight: 600 }}>{r.periodo || `Recibo ${i + 1}`}</span>
                        {r.tarifa && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text-muted)' }}>{r.tarifa}</span>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 600 }}>{kwh.toLocaleString('es-MX')} kWh</span>
                        {r.importe_total && <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>${r.importe_total.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {recibos.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Sube al menos un recibo</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>El análisis aparecerá aquí</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Metrica({ label, value, unit, color }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 8, padding: '10px 12px' }}>
      <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: color || 'var(--text-primary)', marginTop: 2 }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{unit}</div>
    </div>
  );
}
