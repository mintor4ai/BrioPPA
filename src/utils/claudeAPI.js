const MODEL = 'claude-sonnet-4-6';

async function callClaude(prompt, maxTokens = 1000) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY no configurada');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const texto = data.content?.[0]?.text || '';
  const tokens = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
  return { texto, tokens };
}

export function generarResumenEjecutivo(p) {
  return callClaude(`Eres el analista de proyectos de energía solar de Brio Energía, empresa mexicana del Grupo GP.
Analiza los siguientes datos de un proyecto fotovoltaico bajo esquema PPA y genera un resumen ejecutivo
conciso (4-5 oraciones) que capture: la oportunidad, los beneficios económicos para el cliente,
la rentabilidad para Brio, y cualquier consideración importante.

DATOS DEL PROYECTO:
- Cliente: ${p.cliente}
- Ubicación: ${p.ubicacion}
- Capacidad: ${p.capacidad_kwp} kWp (${p.num_paneles} paneles de ${p.potencia_panel_kw} kW)
- Generación anual: ${p.generacion_anual_mwh} MWh
- Cobertura del consumo: ${((p.cobertura_sfv || 0) * 100).toFixed(1)}%
- Tarifa PPA pactada: $${(p.tarifa_brio_mxn || 0).toFixed(4)} MXN/kWh
- Descuento vs CFE: ${((p.descuento_vs_cfe || 0) * 100).toFixed(1)}%
- CAPEX total: $${(p.capex_usd || 0).toLocaleString()} USD
- Precio de venta: $${p.precio_venta_usd_w}/W
- Utilidad bruta: ${((p.utilidad_bruta_pct || 0) * 100).toFixed(1)}%
- TIR GPBI a 25 años: ${((p.tir_gpbi_25 || 0) * 100).toFixed(1)}%
- Payback: ${p.payback_meses} meses
- Estado del proyecto: ${p.estado}

Redacta en tercera persona, tono profesional, sin usar listas ni bullets. Solo párrafo continuo.`, 400);
}

export function generarCartaPropuesta(p) {
  return callClaude(`Eres el director comercial de Brio Energía. Redacta una carta propuesta formal para el cliente
bajo esquema PPA (Power Purchase Agreement). La carta debe:
1. Tener encabezado profesional
2. Introducir a Brio Energía como empresa del Grupo GP con 60 años de trayectoria
3. Presentar la solución fotovoltaica con datos técnicos clave
4. Explicar el beneficio económico y el descuento vs CFE
5. Describir el esquema PPA
6. Incluir términos principales: tarifa, ajuste inflacionario, plazo
7. Cerrar con llamada a la acción

DATOS:
- Cliente: ${p.cliente}, Ubicación: ${p.ubicacion}
- Sistema: ${p.capacidad_kwp} kWp, Generación anual: ${(p.generacion_anual_mwh || 0).toLocaleString()} MWh
- Cobertura: ${((p.cobertura_sfv || 0) * 100).toFixed(0)}% del consumo
- Tarifa PPA: $${(p.tarifa_brio_mxn || 0).toFixed(4)} MXN/kWh
- Descuento: ${((p.descuento_vs_cfe || 0) * 100).toFixed(1)}% sobre CFE
- Ajuste inflacionario: ${((p.inflacion_anual || 0.045) * 100).toFixed(1)}% anual
- CAPEX: $${(p.capex_usd || 0).toLocaleString()} USD

Formato: carta formal, español de negocios mexicano. Firma: "Equipo Comercial, Brio Energía"`, 800);
}

export function generarReporteAutorizacion(p) {
  return callClaude(`Eres el analista de riesgos de Brio Energía. Genera un reporte interno de autorización para el comité directivo.

SECCIÓN 1 — FICHA TÉCNICA: datos del sistema, cliente, ubicación
SECCIÓN 2 — ANÁLISIS FINANCIERO: TIR en escenarios 10/15/25 años, comparación vs benchmark (20% mínimo GPBI)
SECCIÓN 3 — RIESGOS: generación, contraparte, regulatorio, cambiario
SECCIÓN 4 — RECOMENDACIÓN: APROBAR / APROBAR CON CONDICIONES / RECHAZAR con justificación

DATOS:
${JSON.stringify({ cliente: p.cliente, ubicacion: p.ubicacion, capacidad_kwp: p.capacidad_kwp, generacion_anual_mwh: p.generacion_anual_mwh, tarifa_brio_mxn: p.tarifa_brio_mxn, descuento_vs_cfe: p.descuento_vs_cfe, capex_usd: p.capex_usd, tir_gpbi_25: p.tir_gpbi_25, tir_gpbi_15: p.tir_gpbi_15, tir_gpbi_10: p.tir_gpbi_10, payback_meses: p.payback_meses, cobertura_sfv: p.cobertura_sfv, estado: p.estado }, null, 2)}

Formato: secciones claras, lenguaje técnico-ejecutivo.`, 1000);
}

export function generarBriefingSemanal(proyectos, alertas) {
  const fecha = new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  return callClaude(`Eres el analista de cartera de Brio Energía. Es ${fecha}. Genera el briefing semanal.

CARTERA:
${proyectos.map(p => `- ${p.cliente} (${p.estado}): ${p.capacidad_kwp} kWp, TIR GPBI ${((p.tir_gpbi_25 || 0) * 100).toFixed(1)}%, descuento ${((p.descuento_vs_cfe || 0) * 100).toFixed(1)}%`).join('\n')}

ALERTAS: ${alertas.length} activas (${alertas.filter(a => a.severidad === 'alta').length} de alta severidad)

Estructura:
📊 ESTADO DE LA CARTERA — 2-3 líneas con números clave
🔥 ATENCIÓN URGENTE — máximo 2 proyectos con razón específica
✅ AVANCES — qué está yendo bien
⚠️ RIESGOS A MONITOREAR — próximos 30 días
🎯 TOP 3 ACCIONES — en orden de prioridad

Máximo 300 palabras. Español directo y ejecutivo.`, 600);
}
