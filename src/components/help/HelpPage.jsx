import { useState } from 'react';

const SECTIONS = [
  { id: 'overview',    icon: '🏠', label: 'Visión General' },
  { id: 'dashboard',  icon: '⊞', label: 'Dashboard' },
  { id: 'proyectos',  icon: '📋', label: 'Proyectos' },
  { id: 'wizard',     icon: '+', label: 'Nueva Cotización' },
  { id: 'cfe',        icon: '📄', label: 'Lector CFE' },
  { id: 'simulador',  icon: '⚡', label: 'Simulador' },
  { id: 'ia',         icon: '✨', label: 'IA Center' },
  { id: 'excel',      icon: '📥', label: 'Exportar Excel' },
  { id: 'calculo',    icon: '🔢', label: 'Motor de Cálculo' },
  { id: 'config',     icon: '⚙', label: 'Configuración' },
  { id: 'glosario',   icon: '📖', label: 'Glosario' },
];

function Tag({ children, color = '#F59E0B' }) {
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${color}20`, color, border: `1px solid ${color}40`, marginRight: 4, marginBottom: 4 }}>
      {children}
    </span>
  );
}

function SectionTitle({ icon, title, subtitle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: '2px solid var(--border)' }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{title}</h2>
        {subtitle && <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{subtitle}</p>}
      </div>
    </div>
  );
}

function InfoBox({ icon = 'ℹ', children, color = '#3B82F6' }) {
  return (
    <div style={{ background: `${color}0D`, border: `1px solid ${color}30`, borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10 }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
      <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

function Step({ num, title, children }) {
  return (
    <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--solar-dark)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0, marginTop: 2 }}>
        {num}
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{children}</div>
      </div>
    </div>
  );
}

function Table({ headers, rows }) {
  return (
    <div style={{ overflowX: 'auto', marginBottom: 16 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{ padding: '8px 12px', background: 'var(--solar-dark)', color: '#F59E0B', textAlign: 'left', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#F8FAFC' : 'white', borderBottom: '1px solid var(--border)' }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '8px 12px', color: j === 0 ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: j === 0 ? 600 : 400 }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── CONTENIDO POR SECCIÓN ─────────────────────────────────────────────────

const content = {
  overview: (
    <div>
      <SectionTitle icon="🏠" title="Brio PPA Manager" subtitle="Plataforma de gestión de contratos de energía solar" />
      <InfoBox icon="⚡" color="#F59E0B">
        <strong>Brio PPA Manager</strong> es una herramienta diseñada para que el equipo de Brio Energía / GPBI gestione el ciclo completo de cotizaciones y proyectos PPA (Power Purchase Agreement) de energía solar.
      </InfoBox>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>¿Qué es un PPA Solar?</h3>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>
        Un <strong>Power Purchase Agreement</strong> es un contrato a largo plazo (típicamente 15–25 años) en el que Brio Energía instala y opera un sistema fotovoltaico en las instalaciones del cliente. El cliente paga una tarifa fija por la energía generada (MXN o USD/kWh), siempre por debajo de la tarifa CFE, obteniendo ahorros desde el día 1 sin inversión inicial.
      </p>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Módulos disponibles</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { icon: '⊞', name: 'Dashboard', desc: 'Vista general de portafolio y alertas' },
          { icon: '📋', name: 'Proyectos', desc: 'Gestión de cotizaciones y proyectos' },
          { icon: '+', name: 'Nueva Cotización', desc: 'Wizard de 4 pasos para crear proyectos' },
          { icon: '📄', name: 'Lector CFE', desc: 'OCR inteligente de recibos CFE' },
          { icon: '⚡', name: 'Simulador', desc: 'Fine-tuning visual de parámetros PPA' },
          { icon: '✨', name: 'IA Center', desc: 'Documentos y briefings con Claude AI' },
          { icon: '📥', name: 'Exportar Excel', desc: 'Export con 4 hojas y análisis completo' },
          { icon: '⚙', name: 'Configuración', desc: 'Tarifas, FX y parámetros del sistema' },
        ].map((m, i) => (
          <div key={i} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 18 }}>{m.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{m.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Flujo típico de trabajo</h3>
      <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap' }}>
        {['Leer recibo CFE', '→', 'Crear cotización', '→', 'Simular escenarios', '→', 'Generar docs IA', '→', 'Exportar Excel', '→', 'Autorizar proyecto'].map((s, i) => (
          <span key={i} style={{ padding: '6px 10px', background: s === '→' ? 'transparent' : '#FEF3C7', border: s === '→' ? 'none' : '1px solid #FCD34D', borderRadius: 8, fontSize: 12, fontWeight: s === '→' ? 700 : 600, color: s === '→' ? '#94A3B8' : '#92400E', marginBottom: 6 }}>{s}</span>
        ))}
      </div>
    </div>
  ),

  dashboard: (
    <div>
      <SectionTitle icon="⊞" title="Dashboard" subtitle="Vista general del portafolio de proyectos" />
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>
        El Dashboard presenta una vista ejecutiva del portafolio completo. Se actualiza automáticamente con cada cambio en los proyectos.
      </p>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Tarjetas KPI superiores</h3>
      <Table
        headers={['KPI', 'Descripción', 'Unidad']}
        rows={[
          ['Proyectos activos', 'Total de proyectos (excluye Perdido)', 'Cantidad'],
          ['Capacidad total', 'Suma de kWp de todos los proyectos activos', 'MWp'],
          ['Ingresos año 1', 'Suma de ingreso_anual_mxn de proyectos activos', 'MXN/año'],
          ['TIR GPBI prom.', 'Promedio ponderado de TIR GPBI 25 años', '%'],
        ]}
      />
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Componentes del Dashboard</h3>
      <Table
        headers={['Componente', 'Descripción']}
        rows={[
          ['Pipeline de estados', 'Barra visual con el count de proyectos por etapa: Prospecto → Operando'],
          ['Gráfica de proyectos', 'BarChart con capacidad (kWp) por proyecto, ordenados por tamaño'],
          ['Mapa de TIR vs Payback', 'Scatter chart: eje X = payback meses, eje Y = TIR GPBI, burbuja = capacidad'],
          ['Alertas activas', 'Lista de alertas de alto impacto (expiración, bajo TIR, vencimientos)'],
          ['Proyectos recientes', 'Últimos 5 proyectos modificados con estado y KPIs clave'],
        ]}
      />
      <InfoBox icon="🔔" color="#F59E0B">
        Las alertas en rojo en el badge del menú "Dashboard" indican alertas de <strong>severidad alta</strong>. Se generan automáticamente al guardar cada proyecto en base a reglas de negocio.
      </InfoBox>
    </div>
  ),

  proyectos: (
    <div>
      <SectionTitle icon="📋" title="Módulo de Proyectos" subtitle="Gestión completa del ciclo de vida de cada cotización" />
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Lista de proyectos</h3>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
        La columna izquierda muestra todos los proyectos con búsqueda, filtros por estado y ordenamiento. Cada tarjeta muestra: cliente, capacidad, estado, tarifa PPA y TIR GPBI.
      </p>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Drawer de proyecto — 6 pestañas</h3>
      <Table
        headers={['Tab', 'Nombre', 'Contenido']}
        rows={[
          ['1', 'Resumen', 'KPIs principales, TIR a 10/15/25 años, payback, ingreso anual, utilidad bruta'],
          ['2', 'Recibo CFE', 'Comparativa mes a mes: factura sin solar vs con solar + cobro Brio + ahorro %'],
          ['3', 'Flujo Financiero', 'Gráfica AreaChart de flujo acumulado 25 años, tabla de flujos anuales'],
          ['4', 'Sistema', 'Parámetros técnicos editables: paneles, EPC, distribuidor, fechas, notas. Re-lector CFE'],
          ['5', 'IA Docs', 'Generación de documentos con Claude AI: resumen ejecutivo, carta propuesta, reporte'],
          ['6', '⚡ Ajustar', 'Simulador visual con sliders — ver sección Simulador'],
        ]}
      />
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Estados del proyecto</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {[
          { e: 'Prospecto', c: '#6366F1', d: 'Lead inicial, sin datos completos' },
          { e: 'Cotización', c: '#F59E0B', d: 'PPA cotizado, esperando decisión del cliente' },
          { e: 'Negociación', c: '#EF4444', d: 'En proceso activo de negociación de términos' },
          { e: 'Autorizado', c: '#10B981', d: 'Firmado, en preparación para construcción' },
          { e: 'Construcción', c: '#3B82F6', d: 'Sistema en proceso de instalación' },
          { e: 'Operando', c: '#059669', d: 'Sistema operando, PPA activo y generando ingresos' },
          { e: 'Perdido', c: '#9CA3AF', d: 'Proyecto cancelado o perdido vs competencia' },
        ].map(({ e, c, d }) => (
          <div key={e} style={{ background: `${c}10`, border: `1px solid ${c}30`, borderRadius: 8, padding: '8px 12px', minWidth: 140 }}>
            <div style={{ color: c, fontWeight: 700, fontSize: 12 }}>{e}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{d}</div>
          </div>
        ))}
      </div>
    </div>
  ),

  wizard: (
    <div>
      <SectionTitle icon="+" title="Nueva Cotización — Wizard" subtitle="Crea una cotización PPA completa en 4 pasos" />
      <InfoBox icon="💡" color="#10B981">
        Puedes acelerar el paso 1 usando el <strong>Lector CFE</strong> integrado en el wizard. Carga el recibo del cliente y los datos de consumo se llenan automáticamente.
      </InfoBox>
      <Step num={1} title="Datos del cliente">
        Razón social, ubicación, tarifa CFE (GDMTH, GDMT, BT, etc.), división CFE, canal de venta, UEN y nombre del contacto. <br /><br />
        Opcionalmente: sube un recibo CFE para auto-llenar el perfil de consumo mensual (12 meses de kWh base/intermedia/punta y demandas kW).
      </Step>
      <Step num={2} title="Sistema fotovoltaico">
        Capacidad en kWp, número y potencia de paneles, generación anual estimada en MWh, cobertura del consumo (%), nombre del distribuidor y datos del EPC instalador.
      </Step>
      <Step num={3} title="Parámetros PPA">
        Tarifa PPA en USD/kWh y MXN/kWh (se calculan automáticamente con el FX configurado), CAPEX total en USD, precio de venta por watt (USD/W), O&M anual, inflación anual, degradación de paneles e inicio de contrato.<br /><br />
        El sistema calcula en tiempo real el <strong>descuento vs CFE</strong> y la <strong>utilidad bruta</strong>.
      </Step>
      <Step num={4} title="Resumen y confirmación">
        Vista previa con TIR calculado a 10, 15 y 25 años (proyecto y GPBI), payback estimado en meses e ingreso proyectado año 1. Confirmar guarda el proyecto en Supabase.
      </Step>
    </div>
  ),

  cfe: (
    <div>
      <SectionTitle icon="📄" title="Lector CFE (OCR)" subtitle="Extracción automática de datos de recibos CFE con Claude Vision" />
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
        Usa Claude Vision (IA multimodal) para leer recibos CFE en formato PDF o imagen, y extraer automáticamente todos los datos de consumo y demanda eléctrica.
      </p>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Formatos soportados</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['PDF', 'JPG / JPEG', 'PNG', 'WebP'].map(f => <Tag key={f} color="#3B82F6">{f}</Tag>)}
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Datos que extrae</h3>
      <Table
        headers={['Campo', 'Descripción', 'Ejemplo']}
        rows={[
          ['kWh base', 'Energía consumida en período base (22:00–06:00)', '12,450 kWh'],
          ['kWh intermedia', 'Energía en período intermedio (06:00–20:00 sem.)', '28,300 kWh'],
          ['kWh punta', 'Energía en período punta (18:00–21:00 lun-vie)', '4,200 kWh'],
          ['kW base / inter / punta', 'Demanda máxima en cada período', '180 kW'],
          ['kW máxima', 'Demanda contratada o registrada máxima', '245 kW'],
          ['Factor de potencia', 'Cos φ — afecta recargos CFE si < 90%', '0.94'],
          ['kVArh', 'Energía reactiva consumida', '2,100 kVArh'],
          ['Importe total', 'Total a pagar incluyendo IVA', '$185,430 MXN'],
          ['Período de facturación', 'Mes y año del recibo', 'Mayo 2025'],
          ['N° de servicio', 'Número de cuenta CFE del cliente', '012-456-789-0'],
          ['División CFE', 'Región de la distribuidora', 'Centro Norte'],
          ['Nombre del cliente', 'Razón social en el recibo', 'TEKLAS MEXICO S.A.'],
          ['Dirección del servicio', 'Ubicación del suministro', 'Blvd. Industrial 400, AGS'],
          ['Número de medidor', 'ID del medidor instalado', 'ME-4521-08'],
        ]}
      />
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Modo multi-recibo (página Lector CFE)</h3>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>
        La página independiente permite cargar hasta <strong>12 recibos</strong> (uno por mes). Al cargar todos los meses, el sistema calcula:
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {['kWh total anual', 'Importe total anual', 'Precio medio CFE ($/kWh)', 'Demanda pico anual (kW)'].map(t => <Tag key={t} color="#10B981">{t}</Tag>)}
      </div>
      <InfoBox icon="🔑" color="#7C3AED">
        Requiere que la variable <code>VITE_ANTHROPIC_API_KEY</code> esté configurada en Vercel. El archivo de recibo nunca se envía al servidor — se procesa directamente desde el navegador usando la API de Anthropic con el header <code>anthropic-dangerous-direct-browser-access</code>.
      </InfoBox>
    </div>
  ),

  simulador: (
    <div>
      <SectionTitle icon="⚡" title="Simulador PPA" subtitle="Fine-tuning visual en tiempo real de todos los parámetros" />
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
        El Simulador permite ajustar cualquier parámetro del modelo PPA moviendo sliders y ver al instante cómo cambian el TIR, payback e ingresos. Disponible como pestaña dentro del drawer de cada proyecto (⚡ Ajustar) y como pantalla completa en el menú lateral.
      </p>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Parámetros ajustables</h3>
      <Table
        headers={['Parámetro', 'Rango', 'Impacto principal']}
        rows={[
          ['Tarifa PPA (USD/kWh)', '$0.05 – $0.15', 'Ingresos directos, TIR, descuento vs CFE'],
          ['Tipo de cambio FX', '$15 – $22 MXN/USD', 'Tarifa en MXN, ingresos en pesos, utilidad'],
          ['Capacidad del sistema (kWp)', '50 – 5,000 kWp', 'Escala del proyecto, CAPEX, generación'],
          ['Factor de generación', '70% – 130%', 'Ajuste sobre generación estimada base'],
          ['CAPEX total (USD)', '$100K – $5M', 'Inversión inicial, TIR, payback'],
          ['Precio de venta (USD/W)', '$0.50 – $1.50', 'Utilidad bruta, precio al cliente'],
          ['Cobertura SFV (%)', '30% – 95%', 'Fracción del consumo cubierta con solar'],
          ['Inflación anual (%)', '1% – 10%', 'Crecimiento de la tarifa CFE de referencia'],
          ['Degradación de paneles (%/año)', '0.2% – 1%/año', 'Reducción de generación a largo plazo'],
          ['O&M anual (USD)', '$0 – 3% CAPEX', 'Costos operativos, flujo neto'],
        ]}
      />
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Visualizaciones</h3>
      <Table
        headers={['Elemento', 'Descripción']}
        rows={[
          ['KPIs superiores', 'TIR GPBI 25a, Payback, Ingreso Año 1, Tarifa MXN — con indicador vs original'],
          ['Gráfica flujo acumulado', 'LineChart: línea dorada (ajustado) vs línea gris punteada (original original) en 25 años'],
          ['Tabla comparativa', 'TIR GPBI 10/15/25a, Payback, Ingreso Año 1 — columnas Original / Ajustado / Δ'],
        ]}
      />
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Acciones disponibles</h3>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 8, padding: '10px 14px', flex: 1, minWidth: 180 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#92400E' }}>💾 Guardar ajustes</div>
          <div style={{ fontSize: 12, color: '#92400E', marginTop: 4 }}>Sobreescribe el proyecto con los nuevos parámetros ajustados. Persiste en Supabase.</div>
        </div>
        <div style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 8, padding: '10px 14px', flex: 1, minWidth: 180 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#065F46' }}>📥 Exportar Excel</div>
          <div style={{ fontSize: 12, color: '#065F46', marginTop: 4 }}>Genera el Excel con los parámetros actuales del simulador (no los del proyecto guardado).</div>
        </div>
        <div style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px', flex: 1, minWidth: 180 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>↺ Resetear</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Restaura todos los sliders a los valores originales del proyecto guardado.</div>
        </div>
      </div>
    </div>
  ),

  ia: (
    <div>
      <SectionTitle icon="✨" title="IA Center" subtitle="Documentos inteligentes generados con Claude AI" />
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
        El módulo de IA usa el modelo <strong>claude-sonnet-4-6</strong> de Anthropic para generar documentos comerciales y operativos personalizados para cada proyecto, tomando como base todos los parámetros financieros calculados.
      </p>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Documentos disponibles por proyecto (Tab IA Docs)</h3>
      <Table
        headers={['Documento', 'Audiencia', 'Extensión aprox.', 'Contenido']}
        rows={[
          ['📊 Resumen Ejecutivo', 'Cliente · Dirección General', '~300 palabras', 'Beneficios del PPA, ahorro proyectado, TIR, ventajas competitivas de Brio'],
          ['📝 Carta Propuesta', 'Compras · Legal · Finanzas', '~600 palabras', 'Descripción técnica del sistema, condiciones contractuales, cronograma, próximos pasos'],
          ['✅ Reporte Autorización', 'Comité directivo interno', '~800 palabras', 'Análisis de rentabilidad, riesgos, comparativa de escenarios, recomendación de inversión'],
        ]}
      />
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Briefing semanal (IA Center principal)</h3>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
        Genera un briefing ejecutivo del <strong>portafolio completo</strong>: estado de todos los proyectos, alertas críticas, oportunidades prioritarias y recomendaciones de acción para la semana.
      </p>
      <InfoBox icon="💰" color="#7C3AED">
        Cada llamada a la IA consume tokens del API de Anthropic. Costo aproximado: <strong>$0.003–$0.015 USD por documento</strong> generado. El API key se configura en Vercel como variable de entorno <code>VITE_ANTHROPIC_API_KEY</code>.
      </InfoBox>
      <InfoBox icon="⚠" color="#EF4444">
        La clave API se llama directamente desde el navegador (browser-side). Esto es aceptable para un MVP interno, pero se recomienda mover las llamadas a un backend (Edge Function de Supabase o Vercel Function) antes de hacer el producto público.
      </InfoBox>
    </div>
  ),

  excel: (
    <div>
      <SectionTitle icon="📥" title="Exportar Excel" subtitle="Reporte completo en 4 hojas con formato profesional" />
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
        Genera un archivo <code>.xlsx</code> completamente formateado con colores, bordes, números y totales. Compatible con Microsoft Excel y Google Sheets. Accesible desde el tab <strong>⚡ Ajustar</strong> de cualquier proyecto o desde el Simulador pantalla completa.
      </p>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Hojas del Excel</h3>
      <Table
        headers={['Hoja', 'Nombre', 'Contenido']}
        rows={[
          ['1 📊', 'Resumen', 'Identificación, sistema SFV, parámetros PPA, financiero. TIR en color: verde ≥20%, rojo <20%'],
          ['2 💰', 'Flujo 25 Años', 'Tabla anual: generación, tarifa, ingresos, O&M, G&A, flujo neto y acumulado. Header congelado'],
          ['3 📄', 'Recibo CFE', 'Comparativa mensual: factura sin/con solar, cobro Brio, ahorro por mes y totales anuales'],
          ['4 📈', 'Escenarios', '3 escenarios (Conservador/Base/Optimista) + tabla de sensibilidad tarifa PPA vs TIR'],
        ]}
      />
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Detalle hoja de Escenarios</h3>
      <Table
        headers={['Escenario', 'Tarifa PPA', 'Generación', 'CAPEX']}
        rows={[
          ['Conservador', '+5% sobre base', '90% del estimado', '+10% sobre base'],
          ['Base', 'Tarifa actual', '100% del estimado', 'CAPEX actual'],
          ['Optimista', '-5% sobre base', '105% del estimado', '-5% sobre base'],
        ]}
      />
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
        La tabla de sensibilidad muestra el TIR GPBI 25 años para 7 puntos de tarifa alrededor del valor base (±$0.005, ±$0.010, ±$0.015 USD/kWh), identificando visualmente en verde qué tarifas cumplen el umbral del 20%.
      </p>
    </div>
  ),

  calculo: (
    <div>
      <SectionTitle icon="🔢" title="Motor de Cálculo PPA" subtitle="Lógica financiera del modelo de flujos a 25 años" />
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Estructura del flujo mensual</h3>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
        El motor calcula <strong>300 períodos mensuales</strong> (25 años × 12 meses) con la siguiente estructura:
      </p>
      <div style={{ background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 10, padding: 16, fontFamily: 'monospace', fontSize: 12, lineHeight: 2, marginBottom: 20 }}>
        <div><span style={{ color: '#7C3AED', fontWeight: 700 }}>Generación</span> = Gen_Año1 × (1 - degradación)^año × factor_estacional[mes]</div>
        <div><span style={{ color: '#10B981', fontWeight: 700 }}>Ingreso</span> = Generación_kWh × Tarifa_USD × (1 + inflación)^año</div>
        <div><span style={{ color: '#EF4444', fontWeight: 700 }}>O&M</span> = om_usd_anual × (1 + 0.03)^año / 12</div>
        <div><span style={{ color: '#EF4444', fontWeight: 700 }}>G&A</span> = Ingreso × 4%</div>
        <div><span style={{ color: '#F59E0B', fontWeight: 700 }}>Flujo_Proyecto</span> = Ingreso - O&M - G&A</div>
        <div><span style={{ color: '#3B82F6', fontWeight: 700 }}>Flujo_GPBI</span> = Flujo_Proyecto × 70%</div>
        <div><span style={{ color: '#64748B', fontWeight: 700 }}>Acumulado</span> = Σ Flujo_Proyecto - CAPEX (mes 0)</div>
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Cálculo de TIR</h3>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>
        Se usa el método de <strong>bisección numérica</strong> para encontrar la tasa mensual <em>r</em> tal que el VPN = 0, luego se anualiza: <code>TIR_anual = (1 + r_mensual)^12 - 1</code>.
      </p>
      <Table
        headers={['Métrica', 'Descripción']}
        rows={[
          ['tir_proyecto_25', 'TIR considerando flujos de los 25 años completos del contrato'],
          ['tir_proyecto_15', 'TIR truncado al año 15 (perspectiva de mediano plazo)'],
          ['tir_proyecto_10', 'TIR truncado al año 10 (retorno temprano)'],
          ['tir_gpbi_25/15/10', 'TIR del flujo GPBI (70% del flujo proyecto). Umbral target: ≥ 20%'],
          ['payback_meses', 'Mes en que el flujo acumulado de GPBI cruza de negativo a positivo'],
        ]}
      />
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Tarifa GDMTH (CFE)</h3>
      <Table
        headers={['Componente', 'Valor actual', 'Unidad']}
        rows={[
          ['Cargo fijo', '$304.99', 'MXN/mes'],
          ['Energía base', '$0.884', 'MXN/kWh'],
          ['Energía intermedia', '$1.725', 'MXN/kWh'],
          ['Energía punta', '$1.9932', 'MXN/kWh'],
          ['Distribución', '$101.35', 'MXN/kW-mes'],
          ['Capacidad', '$62.50', 'MXN/kW-mes'],
          ['Transmisión', '$0.1758', 'MXN/kWh'],
          ['CENACE', '$0.0106', 'MXN/kWh'],
          ['SCNMEM', '$0.0062', 'MXN/kWh'],
          ['IVA', '16%', 'Sobre el subtotal'],
        ]}
      />
      <InfoBox icon="☀" color="#10B981">
        El <strong>netmetering</strong> se aplica distribuyendo la generación solar: 10% en período base, 90% en intermedia, 0% en punta (por disponibilidad solar). Los kWh generados se restan del consumo CFE en cada período antes de calcular la factura con solar.
      </InfoBox>
    </div>
  ),

  config: (
    <div>
      <SectionTitle icon="⚙" title="Configuración" subtitle="Parámetros globales del sistema" />
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Variables de entorno requeridas</h3>
      <Table
        headers={['Variable', 'Descripción', 'Dónde se configura']}
        rows={[
          ['VITE_SUPABASE_URL', 'URL del proyecto Supabase (https://xxx.supabase.co)', 'Vercel → Settings → Env Vars'],
          ['VITE_SUPABASE_ANON_KEY', 'Clave pública anon de Supabase', 'Vercel → Settings → Env Vars'],
          ['VITE_ANTHROPIC_API_KEY', 'API key de Anthropic para Claude AI y OCR', 'Vercel → Settings → Env Vars'],
        ]}
      />
      <InfoBox icon="⚠" color="#EF4444">
        Nunca pongas estas variables en el código fuente ni en <code>.env</code> commiteado al repositorio. El <code>.gitignore</code> excluye <code>.env.local</code> y archivos <code>*.local</code>.
      </InfoBox>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Modo Demo</h3>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
        Si <code>VITE_SUPABASE_URL</code> no está configurado, la app funciona en <strong>Modo Demo</strong> con 3 proyectos de ejemplo (TEKLAS, VITRO, LALA). El banner amarillo en la parte superior indica este estado. Los datos no se persisten entre sesiones.
      </p>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Panel de Configuración</h3>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
        Desde el menú lateral ⚙ Configuración puedes ajustar: tipo de cambio FX por defecto, tarifas GDMTH actualizadas, parámetros por defecto de nuevas cotizaciones y credenciales de conexión.
      </p>
    </div>
  ),

  glosario: (
    <div>
      <SectionTitle icon="📖" title="Glosario" subtitle="Términos técnicos y acrónimos del sistema" />
      <Table
        headers={['Término', 'Significado']}
        rows={[
          ['PPA', 'Power Purchase Agreement — contrato de compraventa de energía a largo plazo'],
          ['kWp', 'kilowatt-pico — capacidad nominal del sistema fotovoltaico en condiciones estándar'],
          ['MWh', 'Megawatt-hora — unidad de energía generada (1,000 kWh)'],
          ['GDMTH', 'General de Media Tensión con Horario — tarifa CFE para grandes consumidores industriales'],
          ['TIR', 'Tasa Interna de Retorno — rentabilidad anualizada del flujo de caja del proyecto'],
          ['VPN', 'Valor Presente Neto — valor actual de todos los flujos futuros descontados a una tasa'],
          ['CAPEX', 'Capital Expenditure — inversión inicial en el sistema fotovoltaico'],
          ['O&M', 'Operations & Maintenance — costos anuales de operación y mantenimiento'],
          ['G&A', 'General & Administrative — costos generales (4% de ingresos en el modelo)'],
          ['FP', 'Factor de Potencia — relación entre potencia activa y aparente (cos φ). CFE penaliza FP < 0.90'],
          ['kVArh', 'kilovolt-amperio reactivo hora — energía reactiva. Genera recargos si es excesiva'],
          ['Netmetering', 'Compensación energética: la generación solar resta del consumo CFE antes de facturar'],
          ['GPBI', 'Nombre de la UEN (Unidad de Negocio) de Brio Energía para proyectos PPA industriales'],
          ['EPC', 'Engineering, Procurement & Construction — empresa que instala el sistema solar'],
          ['SFV', 'Sistema Fotovoltaico — la instalación de paneles solares completa'],
          ['UEN', 'Unidad Estratégica de Negocio — división comercial dentro de Brio Energía'],
          ['FX', 'Tipo de cambio MXN/USD utilizado en el modelo financiero'],
          ['Payback', 'Período de recuperación de la inversión — mes en que el flujo acumulado cruza cero'],
          ['Punta', 'Período tarifario de mayor precio CFE (18:00–21:00 lunes a viernes)'],
          ['Intermedia', 'Período tarifario de precio medio CFE (resto del día en días hábiles)'],
          ['Base', 'Período tarifario de menor precio CFE (22:00–06:00, fines de semana y festivos)'],
          ['Bisección', 'Método numérico iterativo para encontrar raíces de funciones (usado para calcular TIR)'],
          ['RLS', 'Row Level Security — seguridad a nivel de fila en Supabase/PostgreSQL'],
        ]}
      />
    </div>
  ),
};

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState('overview');

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: 'white', borderRight: '1px solid var(--border)', flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 16px 10px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--solar-dark)' }}>📚 Documentación</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Brio PPA Manager v1.0</div>
        </div>
        <nav style={{ flex: 1, padding: '8px 0' }}>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              style={{
                width: '100%',
                background: activeSection === s.id ? '#FEF3C7' : 'none',
                border: 'none',
                borderLeft: activeSection === s.id ? '3px solid #F59E0B' : '3px solid transparent',
                textAlign: 'left',
                padding: '9px 16px',
                cursor: 'pointer',
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                fontSize: 13,
                fontWeight: activeSection === s.id ? 700 : 500,
                color: activeSection === s.id ? '#92400E' : 'var(--text-primary)',
              }}>
              <span style={{ fontSize: 15 }}>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </nav>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)' }}>
          <div>Stack técnico:</div>
          <div style={{ marginTop: 4, lineHeight: 1.8 }}>React 18 · Vite 5<br />Supabase · Vercel<br />Claude AI · ExcelJS<br />Recharts · Tailwind</div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', maxWidth: 860 }}>
        {content[activeSection]}
      </div>
    </div>
  );
}
