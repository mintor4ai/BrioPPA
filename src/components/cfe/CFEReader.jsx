import { useState, useRef } from 'react';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const PROMPT_CFE = `Eres un experto en recibos de CFE de México, tarifa GDMTH (Gran Demanda Media Tensión Horaria).
Analiza este recibo de CFE y extrae TODOS los datos de consumo en formato JSON exacto.

Extrae los siguientes campos (si no aparecen en el recibo, usa null):
{
  "periodo": "MMM YYYY",
  "no_servicio": "número de servicio CFE",
  "tarifa": "GDMTH o la que aparezca",
  "division": "división CFE (Jalisco, Noreste, etc.)",
  "dias_facturacion": número,
  "kwh_base": número (kWh en horario base),
  "kwh_intermedia": número (kWh en horario intermedio),
  "kwh_punta": número (kWh en horario punta),
  "kwh_total": número (total kWh),
  "kw_base": número (kW demanda en base),
  "kw_intermedia": número (kW demanda en intermedio),
  "kw_punta": número (kW demanda en punta),
  "kw_max": número (demanda máxima facturable),
  "kvarh": número (energía reactiva si aparece),
  "fp": número (factor de potencia en %, ej: 92.5),
  "importe_total": número (total a pagar con IVA en MXN),
  "importe_sin_iva": número,
  "cargo_fijo": número,
  "energia_base": número (cargo por energía base),
  "energia_intermedia": número,
  "energia_punta": número,
  "cargo_distribucion": número,
  "cargo_transmision": número,
  "cliente_nombre": "nombre del usuario",
  "cliente_direccion": "dirección del suministro",
  "medidor": "número de medidor",
  "fecha_lectura_actual": "YYYY-MM-DD",
  "fecha_lectura_anterior": "YYYY-MM-DD"
}

Responde ÚNICAMENTE con el JSON válido, sin texto adicional, sin markdown, sin explicaciones.
Si el recibo no es de CFE GDMTH sino PDBT u otra tarifa, extrae los campos disponibles igualmente.`;

async function leerReciboCFE(fileBase64, mimeType, apiKey) {
  const isImage = mimeType.startsWith('image/');
  const isPDF = mimeType === 'application/pdf';

  const contentParts = [
    { type: 'text', text: PROMPT_CFE },
  ];

  if (isImage) {
    contentParts.push({
      type: 'image',
      source: { type: 'base64', media_type: mimeType, data: fileBase64 },
    });
  } else if (isPDF) {
    contentParts.push({
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 },
    });
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
      max_tokens: 1500,
      messages: [{ role: 'user', content: contentParts }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API ${response.status}: ${err}`);
  }

  const data = await response.json();
  const texto = data.content?.[0]?.text || '{}';
  // Limpiar posibles bloques markdown
  const clean = texto.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(clean);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function CFEReader({ onDatosExtraidos, compact = false }) {
  const [estado, setEstado] = useState('idle'); // idle | loading | success | error
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  const procesar = async (file) => {
    if (!apiKey) {
      setError('VITE_ANTHROPIC_API_KEY no configurada');
      setEstado('error');
      return;
    }
    if (!file) return;

    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Formato no soportado. Usa PDF, JPG, PNG o WebP.');
      setEstado('error');
      return;
    }

    setFileName(file.name);
    setEstado('loading');
    setError('');

    try {
      const base64 = await fileToBase64(file);
      const resultado = await leerReciboCFE(base64, file.type, apiKey);
      setDatos(resultado);
      setEstado('success');
      if (onDatosExtraidos) onDatosExtraidos(resultado);
    } catch (e) {
      setError(e.message);
      setEstado('error');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) procesar(file);
  };

  const reset = () => { setEstado('idle'); setDatos(null); setError(''); setFileName(''); };

  return (
    <div>
      {/* Drop zone */}
      {estado === 'idle' && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? '#F59E0B' : '#CBD5E1'}`,
            borderRadius: 12,
            padding: compact ? '20px' : '36px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? '#FFFBEB' : '#F8FAFC',
            transition: 'all 0.15s',
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>
            Sube tu recibo de CFE
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
            Arrastra aquí o haz clic para seleccionar
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>PDF · JPG · PNG · WebP</div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            style={{ display: 'none' }}
            onChange={e => e.target.files[0] && procesar(e.target.files[0])}
          />
        </div>
      )}

      {/* Loading */}
      {estado === 'loading' && (
        <div style={{ padding: '32px', textAlign: 'center', background: '#F8FAFC', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>
            <span className="spinner" style={{ display: 'inline-block', fontSize: 28 }}>⟳</span>
          </div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Leyendo recibo con IA...</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{fileName}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Claude está extrayendo los datos de consumo</div>
        </div>
      )}

      {/* Error */}
      {estado === 'error' && (
        <div style={{ padding: '20px', background: '#FEF2F2', borderRadius: 12, border: '1px solid #FCA5A5' }}>
          <div style={{ fontWeight: 600, color: '#991B1B', marginBottom: 4 }}>✗ Error al procesar el recibo</div>
          <div style={{ fontSize: 13, color: '#991B1B', marginBottom: 12 }}>{error}</div>
          <button onClick={reset} style={{ padding: '6px 16px', background: '#EF4444', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
            Intentar de nuevo
          </button>
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

          <DatosExtraidos datos={datos} onUsar={() => onDatosExtraidos && onDatosExtraidos(datos)} />
        </div>
      )}
    </div>
  );
}

function DatosExtraidos({ datos: d, onUsar }) {
  const kwh_total = (d.kwh_base || 0) + (d.kwh_intermedia || 0) + (d.kwh_punta || 0) || d.kwh_total;

  return (
    <div style={{ background: '#F0FDF4', borderRadius: 12, border: '1px solid #6EE7B7', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', background: '#ECFDF5', borderBottom: '1px solid #6EE7B7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#065F46' }}>
            {d.cliente_nombre || 'Cliente CFE'}
          </span>
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
        {/* Consumo energía */}
        <div className="card" style={{ background: 'white' }}>
          <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Energía (kWh)</div>
          <FilaDato label="Base" value={d.kwh_base} unit="kWh" />
          <FilaDato label="Intermedia" value={d.kwh_intermedia} unit="kWh" />
          <FilaDato label="Punta" value={d.kwh_punta} unit="kWh" />
          <FilaDato label="TOTAL" value={kwh_total} unit="kWh" bold />
        </div>

        {/* Demanda */}
        <div className="card" style={{ background: 'white' }}>
          <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Demanda (kW)</div>
          <FilaDato label="Base" value={d.kw_base} unit="kW" />
          <FilaDato label="Intermedia" value={d.kw_intermedia} unit="kW" />
          <FilaDato label="Punta" value={d.kw_punta} unit="kW" />
          <FilaDato label="Máxima" value={d.kw_max} unit="kW" bold />
        </div>

        {/* Calidad eléctrica */}
        <div className="card" style={{ background: 'white' }}>
          <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Calidad</div>
          <FilaDato label="Factor de Potencia" value={d.fp} unit="%" color={d.fp >= 90 ? '#10B981' : '#EF4444'} />
          <FilaDato label="Energía Reactiva" value={d.kvarh} unit="kVArh" />
          <FilaDato label="Días facturación" value={d.dias_facturacion} unit="días" />
        </div>

        {/* Importe */}
        <div className="card" style={{ background: 'white' }}>
          <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Importe</div>
          <FilaDato label="Sin IVA" value={d.importe_sin_iva} unit="MXN" prefix="$" />
          <FilaDato label="Total con IVA" value={d.importe_total} unit="MXN" prefix="$" bold />
          {kwh_total > 0 && d.importe_total && (
            <FilaDato label="Precio medio" value={(d.importe_total / kwh_total).toFixed(4)} unit="MXN/kWh" color="#F59E0B" />
          )}
        </div>
      </div>

      {/* Info adicional */}
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
  const formatted = typeof value === 'number'
    ? value >= 1000 ? value.toLocaleString('es-MX') : value.toString()
    : value;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #F1F5F9', fontSize: 13 }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 600, color: color || 'var(--text-primary)' }}>
        {prefix}{formatted} <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>{unit}</span>
      </span>
    </div>
  );
}
