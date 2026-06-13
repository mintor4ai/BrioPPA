import { useState, useRef } from 'react';

const MESES_NOMBRES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MESES_FULL = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

const PROMPT_CFE = `Eres un experto en recibos de CFE de México. Analiza este recibo y extrae TODOS los datos disponibles en formato JSON.

Extrae los campos del período actual (si no aparecen usa null):
{
  "periodo": "MMM YYYY",
  "no_servicio": "número de servicio CFE",
  "tarifa": "GDMTH, PDBT, GDBT, 1C, etc.",
  "division": "división CFE (Jalisco, Noreste, etc.)",
  "dias_facturacion": número,
  "kwh_base": número,
  "kwh_intermedia": número,
  "kwh_punta": número,
  "kwh_total": número (total kWh del período),
  "kw_base": número,
  "kw_intermedia": número,
  "kw_punta": número,
  "kw_max": número (demanda máxima),
  "kvarh": número,
  "fp": número (factor de potencia en %, ej: 92.5),
  "importe_total": número (total con IVA en MXN),
  "importe_sin_iva": número,
  "cargo_fijo": número,
  "cargo_distribucion": número,
  "cargo_transmision": número,
  "cliente_nombre": "nombre o razón social",
  "cliente_direccion": "dirección del suministro",
  "medidor": "número de medidor",
  "fecha_lectura_actual": "YYYY-MM-DD",
  "fecha_lectura_anterior": "YYYY-MM-DD",
  "historial_consumo": [
    {
      "periodo_texto": "del DD MMM AA al DD MMM AA",
      "mes_inicio": número (1-12),
      "anio_inicio": número (ej: 2024),
      "mes_fin": número (1-12),
      "anio_fin": número (ej: 2024),
      "kwh": número,
      "importe": número,
      "dias": número
    }
  ]
}

IMPORTANTE: La sección "CONSUMO HISTÓRICO" generalmente aparece en la segunda página del recibo. Extrae TODOS los períodos de esa tabla, incluyendo fecha inicio, fecha fin, kWh e importe de cada fila.
Si no existe sección de historial, usa historial_consumo: [].

Responde ÚNICAMENTE con el JSON válido, sin texto adicional, sin markdown.`;

async function leerReciboCFE(fileBase64, mimeType, apiKey) {
  const contentParts = [{ type: 'text', text: PROMPT_CFE }];

  if (mimeType.startsWith('image/')) {
    contentParts.push({ type: 'image', source: { type: 'base64', media_type: mimeType, data: fileBase64 } });
  } else {
    contentParts.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 } });
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: contentParts }],
    }),
  });

  if (!response.ok) throw new Error(`Claude API ${response.status}: ${await response.text()}`);
  const data = await response.json();
  const texto = data.content?.[0]?.text || '{}';
  const clean = texto.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(clean);
}

// Convierte historial bimestral/mensual a array de 12 meses (kWh por mes)
function historialAMensual(historial) {
  const kwh_mensual = Array(12).fill(0);
  const conteo = Array(12).fill(0);

  historial.forEach(p => {
    const mesI = (p.mes_inicio || 1) - 1; // 0-indexed
    const mesF = (p.mes_fin || p.mes_inicio || 1) - 1;
    const anioI = p.anio_inicio || new Date().getFullYear();
    const anioF = p.anio_fin || anioI;

    // Calcular cuántos meses abarca el período
    const mesesAbarca = (anioF - anioI) * 12 + (mesF - mesI) + 1;
    const kwhPorMes = (p.kwh || 0) / Math.max(mesesAbarca, 1);

    // Distribuir kWh por mes
    for (let m = 0; m < mesesAbarca; m++) {
      const mesIdx = (mesI + m) % 12;
      kwh_mensual[mesIdx] += kwhPorMes;
      conteo[mesIdx]++;
    }
  });

  return kwh_mensual.map((v, i) => conteo[i] > 0 ? Math.round(v) : '');
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function CFEReader({ onDatosExtraidos, compact = false }) {
  const [estado, setEstado] = useState('idle');
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  // null = sin decidir, 'si' = aceptó usar historial, 'no' = rechazó
  const [usarHistorial, setUsarHistorial] = useState(null);
  const inputRef = useRef();

  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  const procesar = async (file) => {
    if (!apiKey) { setError('VITE_ANTHROPIC_API_KEY no configurada'); setEstado('error'); return; }
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) { setError('Formato no soportado. Usa PDF, JPG, PNG o WebP.'); setEstado('error'); return; }

    setFileName(file.name);
    setEstado('loading');
    setError('');
    setUsarHistorial(null);

    try {
      const base64 = await fileToBase64(file);
      const resultado = await leerReciboCFE(base64, file.type, apiKey);
      setDatos(resultado);
      setEstado('success');

      // Si tiene historial, esperar decisión del usuario — NO llamar callback todavía
      // Si no tiene historial, llamar inmediatamente con los datos del período actual
      const tieneHistorial = (resultado.historial_consumo || []).length > 0;
      if (!tieneHistorial && onDatosExtraidos) {
        onDatosExtraidos(resultado);
      }
    } catch (e) {
      setError(e.message);
      setEstado('error');
    }
  };

  const handleConfirmarHistorial = (usar) => {
    setUsarHistorial(usar);
    if (!onDatosExtraidos || !datos) return;

    if (usar) {
      const kwh_mensual = historialAMensual(datos.historial_consumo || []);
      onDatosExtraidos({ ...datos, kwh_mensual_historico: kwh_mensual, usar_historial: true });
    } else {
      onDatosExtraidos({ ...datos, usar_historial: false });
    }
  };

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) procesar(f); };
  const reset = () => { setEstado('idle'); setDatos(null); setError(''); setFileName(''); setUsarHistorial(null); };

  const tieneHistorial = (datos?.historial_consumo || []).length > 0;
  const historialDecidido = usarHistorial !== null;

  return (
    <div>
      {/* Drop zone */}
      {estado === 'idle' && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{ border: `2px dashed ${dragOver ? '#F59E0B' : '#CBD5E1'}`, borderRadius: 12, padding: compact ? '20px' : '36px', textAlign: 'center', cursor: 'pointer', background: dragOver ? '#FFFBEB' : '#F8FAFC', transition: 'all 0.15s' }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>Sube tu recibo de CFE</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Arrastra aquí o haz clic para seleccionar</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>PDF · JPG · PNG · WebP</div>
          <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display: 'none' }}
            onChange={e => e.target.files[0] && procesar(e.target.files[0])} />
        </div>
      )}

      {/* Loading */}
      {estado === 'loading' && (
        <div style={{ padding: '32px', textAlign: 'center', background: '#F8FAFC', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>⟳</div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Leyendo recibo con IA...</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{fileName}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Extrayendo datos del período y verificando historial de consumo...</div>
        </div>
      )}

      {/* Error */}
      {estado === 'error' && (
        <div style={{ padding: '20px', background: '#FEF2F2', borderRadius: 12, border: '1px solid #FCA5A5' }}>
          <div style={{ fontWeight: 600, color: '#991B1B', marginBottom: 4 }}>✗ Error al procesar el recibo</div>
          <div style={{ fontSize: 13, color: '#991B1B', marginBottom: 12 }}>{error}</div>
          <button onClick={reset} style={{ padding: '6px 16px', background: '#EF4444', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Intentar de nuevo</button>
        </div>
      )}

      {/* Success */}
      {estado === 'success' && datos && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#065F46' }}>✓ Datos extraídos de: </span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{fileName}</span>
            </div>
            <button onClick={reset} style={{ padding: '4px 12px', border: '1px solid var(--border)', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)' }}>
              Cargar otro
            </button>
          </div>

          <DatosExtraidos datos={datos}
            onUsar={!tieneHistorial ? () => onDatosExtraidos && onDatosExtraidos(datos) : null}
          />

          {/* Banner de historial — aparece cuando hay datos históricos */}
          {tieneHistorial && !historialDecidido && (
            <BannerHistorial
              historial={datos.historial_consumo}
              onConfirmar={handleConfirmarHistorial}
            />
          )}

          {/* Confirmación después de decisión */}
          {tieneHistorial && historialDecidido && (
            <div style={{ marginTop: 12, padding: '12px 16px', background: usarHistorial ? '#ECFDF5' : '#F8FAFC', border: `1px solid ${usarHistorial ? '#6EE7B7' : '#E2E8F0'}`, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: usarHistorial ? '#065F46' : 'var(--text-secondary)' }}>
                {usarHistorial
                  ? `✓ Historial de ${datos.historial_consumo.length} períodos aplicado al consumo mensual`
                  : 'Historial no aplicado — usando solo datos del período actual'}
              </span>
              <button onClick={() => setUsarHistorial(null)} style={{ fontSize: 11, color: 'var(--text-secondary)', background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}>
                Cambiar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BannerHistorial({ historial, onConfirmar }) {
  const [expandido, setExpandido] = useState(false);
  const kwh_mensual = historialAMensual(historial);
  const totalKwh = historial.reduce((s, h) => s + (h.kwh || 0), 0);
  const promedioMensual = Math.round(totalKwh / historial.length);

  return (
    <div style={{ marginTop: 12, borderRadius: 12, border: '2px solid #F59E0B', overflow: 'hidden' }}>
      {/* Header del banner */}
      <div style={{ background: '#FFFBEB', padding: '14px 16px', borderBottom: '1px solid #FDE68A' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>📊</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#92400E', marginBottom: 3 }}>
              Se encontró historial de consumo — ¿Deseas usarlo?
            </div>
            <div style={{ fontSize: 13, color: '#78350F', lineHeight: 1.5 }}>
              Este recibo incluye <strong>{historial.length} períodos históricos</strong> de consumo
              ({totalKwh.toLocaleString()} kWh en total, promedio ~{promedioMensual.toLocaleString()} kWh/período).
              Puedes usar estos datos para estimar el consumo mensual anual del cliente.
            </div>
          </div>
        </div>

        {/* Botones de decisión */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            onClick={() => onConfirmar(true)}
            style={{ flex: 1, padding: '10px 16px', background: '#F59E0B', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
            ✓ Sí, usar historial para consumo mensual
          </button>
          <button
            onClick={() => onConfirmar(false)}
            style={{ padding: '10px 16px', background: 'white', color: '#92400E', border: '1px solid #FCD34D', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
            No por ahora
          </button>
          <button
            onClick={() => setExpandido(!expandido)}
            style={{ padding: '10px 12px', background: 'white', color: '#92400E', border: '1px solid #FCD34D', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
            {expandido ? '▲' : '▼'} Ver datos
          </button>
        </div>
      </div>

      {/* Tabla de historial expandible */}
      {expandido && (
        <div style={{ background: 'white', padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
            Historial de consumo detectado
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                <th style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Período</th>
                <th style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 600 }}>kWh</th>
                <th style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 600 }}>Importe</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((h, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? '#FAFAFA' : 'white' }}>
                  <td style={{ padding: '6px 10px', color: 'var(--text-secondary)' }}>{h.periodo_texto}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700 }}>{(h.kwh || 0).toLocaleString()}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', color: '#10B981' }}>${(h.importe || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#F1F5F9', fontWeight: 700 }}>
                <td style={{ padding: '8px 10px' }}>TOTAL</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{totalKwh.toLocaleString()} kWh</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', color: '#10B981' }}>${historial.reduce((s, h) => s + (h.importe || 0), 0).toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>

          {/* Preview de cómo quedaría el consumo mensual */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Estimación mensual resultante
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
              {MESES_NOMBRES.map((mes, i) => (
                <div key={mes} style={{ textAlign: 'center', padding: '6px 4px', background: kwh_mensual[i] ? '#ECFDF5' : '#F8FAFC', border: `1px solid ${kwh_mensual[i] ? '#6EE7B7' : '#E2E8F0'}`, borderRadius: 6 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600 }}>{mes}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: kwh_mensual[i] ? '#065F46' : '#94A3B8', marginTop: 2 }}>
                    {kwh_mensual[i] ? kwh_mensual[i].toLocaleString() : '—'}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>kWh</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DatosExtraidos({ datos: d, onUsar }) {
  const kwh_total = (d.kwh_base || 0) + (d.kwh_intermedia || 0) + (d.kwh_punta || 0) || d.kwh_total;

  return (
    <div style={{ background: '#F0FDF4', borderRadius: 12, border: '1px solid #6EE7B7', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', background: '#ECFDF5', borderBottom: '1px solid #6EE7B7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#065F46' }}>{d.cliente_nombre || 'Cliente CFE'}</span>
          {d.periodo && <span style={{ marginLeft: 8, fontSize: 12, color: '#059669' }}>· {d.periodo}</span>}
          {d.tarifa && <span style={{ marginLeft: 6, fontSize: 11, background: '#D1FAE5', color: '#065F46', borderRadius: 10, padding: '1px 8px', fontWeight: 600 }}>{d.tarifa}</span>}
        </div>
        {onUsar && (
          <button onClick={onUsar} style={{ padding: '6px 14px', background: '#10B981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
            Usar estos datos →
          </button>
        )}
      </div>

      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="card" style={{ background: 'white' }}>
          <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Energía (kWh)</div>
          <FilaDato label="Base" value={d.kwh_base} unit="kWh" />
          <FilaDato label="Intermedia" value={d.kwh_intermedia} unit="kWh" />
          <FilaDato label="Punta" value={d.kwh_punta} unit="kWh" />
          <FilaDato label="TOTAL" value={kwh_total} unit="kWh" bold />
        </div>
        <div className="card" style={{ background: 'white' }}>
          <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Demanda (kW)</div>
          <FilaDato label="Base" value={d.kw_base} unit="kW" />
          <FilaDato label="Intermedia" value={d.kw_intermedia} unit="kW" />
          <FilaDato label="Punta" value={d.kw_punta} unit="kW" />
          <FilaDato label="Máxima" value={d.kw_max} unit="kW" bold />
        </div>
        <div className="card" style={{ background: 'white' }}>
          <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Calidad</div>
          <FilaDato label="Factor de Potencia" value={d.fp} unit="%" color={d.fp >= 90 ? '#10B981' : '#EF4444'} />
          <FilaDato label="Energía Reactiva" value={d.kvarh} unit="kVArh" />
          <FilaDato label="Días facturación" value={d.dias_facturacion} unit="días" />
        </div>
        <div className="card" style={{ background: 'white' }}>
          <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Importe</div>
          <FilaDato label="Sin IVA" value={d.importe_sin_iva} unit="MXN" prefix="$" />
          <FilaDato label="Total con IVA" value={d.importe_total} unit="MXN" prefix="$" bold />
          {kwh_total > 0 && d.importe_total && (
            <FilaDato label="Precio medio" value={(d.importe_total / kwh_total).toFixed(4)} unit="MXN/kWh" color="#F59E0B" />
          )}
        </div>
      </div>

      {(d.no_servicio || d.medidor || d.cliente_direccion) && (
        <div style={{ padding: '8px 16px 14px', borderTop: '1px solid #D1FAE5', display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 12, color: '#059669' }}>
          {d.no_servicio && <span>📋 Servicio: <b>{d.no_servicio}</b></span>}
          {d.medidor && <span>⚡ Medidor: <b>{d.medidor}</b></span>}
          {d.division && <span>🏢 División: <b>{d.division}</b></span>}
          {d.cliente_direccion && <span>📍 {d.cliente_direccion}</span>}
        </div>
      )}
    </div>
  );
}

function FilaDato({ label, value, unit, prefix = '', bold, color }) {
  if (value == null || value === '') return null;
  const formatted = typeof value === 'number' ? (value >= 1000 ? value.toLocaleString('es-MX') : value.toString()) : value;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #F1F5F9', fontSize: 13 }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 600, color: color || 'var(--text-primary)' }}>
        {prefix}{formatted} <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>{unit}</span>
      </span>
    </div>
  );
}
