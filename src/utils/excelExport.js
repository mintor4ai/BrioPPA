import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { calcularFlujoPPA, calcularReciboCFE, aplicarNetmetering, calcularTIR, calcularMetricasProyecto } from './calculationEngine.js';
import { TARIFAS_GDMTH } from './mockData.js';

// ─── Estilos reutilizables ─────────────────────────────────────────────────
const GOLD   = 'FFF59E0B';
const DARK   = 'FF0F172A';
const GREEN  = 'FF10B981';
const RED    = 'FFEF4444';
const BLUE   = 'FF3B82F6';
const LGRAY  = 'FFF8FAFC';
const MGRAY  = 'FFE2E8F0';
const WHITE  = 'FFFFFFFF';

const hdr = (bg, color = WHITE) => ({
  font: { bold: true, color: { argb: color }, size: 11 },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
  alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
  border: { bottom: { style: 'thin', color: { argb: MGRAY } } },
});

const num = (fmt = '#,##0.00') => ({ numFmt: fmt });
const pct = () => ({ numFmt: '0.00%' });
const mxn = () => ({ numFmt: '"$"#,##0.00' });
const usd = () => ({ numFmt: '"USD $"#,##0.00' });

function autoWidth(sheet, minW = 8) {
  sheet.columns.forEach(col => {
    let max = minW;
    col.eachCell({ includeEmpty: false }, c => {
      const v = c.value?.toString() || '';
      if (v.length > max) max = v.length;
    });
    col.width = Math.min(max + 2, 40);
  });
}

// ─── HOJA 1: RESUMEN EJECUTIVO ─────────────────────────────────────────────
function crearHojaResumen(wb, p, metricas) {
  const ws = wb.addWorksheet('📊 Resumen', { properties: { tabColor: { argb: GOLD } } });

  // Logo / título
  ws.mergeCells('A1:F1');
  ws.getCell('A1').value = `BRIO ENERGÍA — COTIZACIÓN PPA · ${p.cliente?.toUpperCase()}`;
  ws.getCell('A1').font = { bold: true, size: 16, color: { argb: WHITE } };
  ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK } };
  ws.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 32;

  ws.mergeCells('A2:F2');
  ws.getCell('A2').value = `Generado el ${new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
  ws.getCell('A2').font = { size: 10, color: { argb: 'FF94A3B8' } };
  ws.getCell('A2').alignment = { horizontal: 'center' };
  ws.getRow(2).height = 18;

  // ─── Sección: Datos del proyecto ───
  const sectionHeader = (row, label, bg = DARK) => {
    ws.mergeCells(`A${row}:F${row}`);
    ws.getCell(`A${row}`).value = label;
    ws.getCell(`A${row}`).font = { bold: true, size: 11, color: { argb: WHITE } };
    ws.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    ws.getCell(`A${row}`).alignment = { horizontal: 'left', indent: 1, vertical: 'middle' };
    ws.getRow(row).height = 22;
  };

  const addRow = (ws, row, label, value, fmt) => {
    ws.getCell(`A${row}`).value = label;
    ws.getCell(`A${row}`).font = { color: { argb: 'FF64748B' }, size: 10 };
    ws.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LGRAY } };
    ws.getCell(`B${row}`).value = value;
    ws.getCell(`B${row}`).font = { bold: true, size: 11 };
    if (fmt) ws.getCell(`B${row}`).numFmt = fmt;
    ws.getRow(row).height = 18;
  };

  sectionHeader(4, '  IDENTIFICACIÓN DEL PROYECTO');
  addRow(ws, 5,  'Cliente',              p.cliente);
  addRow(ws, 6,  'Ubicación',            p.ubicacion);
  addRow(ws, 7,  'Canal / UEN',          `${p.canal} · ${p.uen}`);
  addRow(ws, 8,  'Tarifa CFE',           p.tarifa_cfe);
  addRow(ws, 9,  'División CFE',         p.division_cfe);
  addRow(ws, 10, 'Estado del proyecto',  p.estado);

  sectionHeader(12, '  SISTEMA FOTOVOLTAICO', '1E3A5F');
  addRow(ws, 13, 'Capacidad instalada',    p.capacidad_kwp,           '#,##0.00 "kWp"');
  addRow(ws, 14, 'Número de paneles',      p.num_paneles,             '#,##0');
  addRow(ws, 15, 'Potencia por panel',     p.potencia_panel_kw * 1000, '#,##0 "W"');
  addRow(ws, 16, 'Generación anual año 1', p.generacion_anual_mwh,    '#,##0.00 "MWh/año"');
  addRow(ws, 17, 'Cobertura del consumo',  (p.cobertura_sfv || 0),    '0.0%');

  sectionHeader(19, '  PARÁMETROS PPA', '1E3A5F');
  addRow(ws, 20, 'Tarifa PPA (USD/kWh)',   p.tarifa_brio_usd,         '"USD $"0.0000');
  addRow(ws, 21, 'Tarifa PPA (MXN/kWh)',   p.tarifa_brio_mxn,         '"$"0.0000');
  addRow(ws, 22, 'Tipo de cambio FX',      p.fx,                      '"$"#,##0.00 "MXN/USD"');
  addRow(ws, 23, 'Descuento vs CFE',       (p.descuento_vs_cfe || 0), '0.0%');
  addRow(ws, 24, 'Ajuste inflacionario',   (p.inflacion_anual || 0.045), '0.0%');
  addRow(ws, 25, 'Degradación paneles',    (p.degradacion_anual || 0.004), '0.0%');
  addRow(ws, 26, 'Ingreso año 1 (MXN)',    p.ingreso_anual_mxn,       '"$"#,##0');

  sectionHeader(28, '  FINANCIERO', '1E3A5F');
  addRow(ws, 29, 'CAPEX total',            p.capex_usd,               '"USD $"#,##0');
  addRow(ws, 30, 'Precio de venta',        p.precio_venta_usd_w,      '"USD $"0.0000"/W"');
  addRow(ws, 31, 'Utilidad bruta',         (p.utilidad_bruta_pct || 0), '0.0%');
  addRow(ws, 32, 'O&M anual',              p.om_usd_anual,            '"USD $"#,##0');
  addRow(ws, 33, 'Distribuidor',           p.distribuidor);
  addRow(ws, 34, 'EPC / Instalador',       p.epc);

  sectionHeader(36, '  RENTABILIDAD', '065F46');
  // Color condicional TIR
  const tirRows = [
    ['TIR Proyecto 10 años', metricas.tir_proyecto_10],
    ['TIR GPBI 10 años',     metricas.tir_gpbi_10],
    ['TIR Proyecto 15 años', metricas.tir_proyecto_15],
    ['TIR GPBI 15 años',     metricas.tir_gpbi_15],
    ['TIR Proyecto 25 años', metricas.tir_proyecto_25],
    ['TIR GPBI 25 años',     metricas.tir_gpbi_25],
    ['Payback',              metricas.payback_meses],
  ];
  tirRows.forEach(([label, val], i) => {
    const row = 37 + i;
    ws.getCell(`A${row}`).value = label;
    ws.getCell(`A${row}`).font = { color: { argb: 'FF64748B' }, size: 10 };
    ws.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LGRAY } };
    ws.getCell(`B${row}`).value = val;
    ws.getCell(`B${row}`).font = { bold: true, size: 12, color: { argb: label.includes('Payback') ? DARK : (val >= 0.20 ? GREEN : RED) } };
    ws.getCell(`B${row}`).numFmt = label.includes('Payback') ? '#,##0 "meses"' : '0.00%';
    ws.getRow(row).height = 20;
  });

  ws.getColumn('A').width = 28;
  ws.getColumn('B').width = 22;
  ['C','D','E','F'].forEach(c => { ws.getColumn(c).width = 12; });

  return ws;
}

// ─── HOJA 2: FLUJO FINANCIERO 25 AÑOS ─────────────────────────────────────
function crearHojaFlujo(wb, p) {
  const ws = wb.addWorksheet('💰 Flujo 25 Años', { properties: { tabColor: { argb: GREEN } } });

  ws.mergeCells('A1:J1');
  ws.getCell('A1').value = `FLUJO FINANCIERO PPA 25 AÑOS — ${p.cliente?.toUpperCase()}`;
  ws.getCell('A1').font = { bold: true, size: 13, color: { argb: WHITE } };
  ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK } };
  ws.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 28;

  // Parámetros de referencia (para fórmulas)
  ws.getCell('L2').value = 'PARÁMETROS';
  ws.getCell('L2').font = { bold: true };
  const params = [
    ['Gen. anual kWh', (p.generacion_anual_mwh || 0) * 1000],
    ['Tarifa USD/kWh', p.tarifa_brio_usd || 0],
    ['Inflación', p.inflacion_anual || 0.045],
    ['Degradación', p.degradacion_anual || 0.004],
    ['CAPEX USD', p.capex_usd || 0],
    ['O&M USD/año', p.om_usd_anual || 0],
    ['G&A %', 0.04],
    ['GPBI share', 0.70],
    ['FX MXN/USD', p.fx || 17.4],
  ];
  params.forEach(([label, val], i) => {
    ws.getCell(`L${3 + i}`).value = label;
    ws.getCell(`M${3 + i}`).value = val;
    ws.getCell(`M${3 + i}`).numFmt = i >= 2 && i <= 3 ? '0.000%' : '#,##0.00';
  });

  // Headers
  const headers = ['Año', 'Generación (kWh)', 'Tarifa (USD/kWh)', 'Ingresos (USD)', 'O&M (USD)', 'G&A (USD)', 'Flujo Neto (USD)', 'Flujo GPBI (USD)', 'Acum. Proyecto (USD)', 'Acum. GPBI (USD)'];
  const headerRow = ws.getRow(3);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    Object.assign(cell, hdr(DARK));
  });
  headerRow.height = 24;

  const { flujos } = calcularFlujoPPA({
    generacion_anual_mwh: p.generacion_anual_mwh || 0,
    tarifa_brio_usd: p.tarifa_brio_usd || 0,
    inflacion_anual: p.inflacion_anual || 0.045,
    degradacion_anual: p.degradacion_anual || 0.004,
    capex_usd: p.capex_usd || 0,
    om_usd_anual: p.om_usd_anual || 0,
    precio_venta_usd: p.capex_usd || 0,
  });

  // Flujos anuales (suma de 12 meses por año)
  const anuales = Array.from({ length: 25 }, (_, i) => {
    const anio = i + 1;
    const meses = flujos.filter(f => f.tipo === 'operacion' && f.anio === anio);
    return {
      anio,
      gen: meses.reduce((s, m) => s + m.generacion, 0),
      tarifa: meses[0]?.tarifa || 0,
      ingreso: meses.reduce((s, m) => s + m.ingreso, 0),
      om: meses.reduce((s, m) => s + m.om, 0),
      ga: meses.reduce((s, m) => s + m.ga, 0),
      flujo: meses.reduce((s, m) => s + m.flujo_proyecto, 0),
      flujoGpbi: meses.reduce((s, m) => s + m.flujo_gpbi, 0),
      acumProy: meses.at(-1)?.acumulado_proyecto || 0,
      acumGpbi: meses.at(-1)?.acumulado_gpbi || 0,
    };
  });

  anuales.forEach((row, i) => {
    const r = ws.getRow(4 + i);
    r.values = [row.anio, row.gen, row.tarifa, row.ingreso, row.om, row.ga, row.flujo, row.flujoGpbi, row.acumProy, row.acumGpbi];
    const bg = i % 2 === 0 ? LGRAY : WHITE;
    r.eachCell({ includeEmpty: false }, (cell, col) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.font = { size: 10 };
      if (col === 1) { cell.font = { bold: true, size: 10 }; cell.numFmt = '"Año "#,##0'; }
      else if (col === 2) cell.numFmt = '#,##0';
      else if (col === 3) cell.numFmt = '"USD $"0.0000';
      else if (col >= 7 && col <= 8) { cell.numFmt = '"USD $"#,##0.00'; cell.font = { bold: true, size: 10, color: { argb: row.flujo >= 0 ? GREEN : RED } }; }
      else if (col >= 9) { cell.numFmt = '"USD $"#,##0.00'; cell.font = { bold: true, size: 10, color: { argb: row.acumProy >= 0 ? GREEN : RED } }; }
      else cell.numFmt = '"USD $"#,##0.00';
    });
    r.height = 18;
  });

  // Totales
  const totalRow = ws.getRow(30);
  totalRow.values = ['TOTAL 25 AÑOS', '', '', anuales.reduce((s, r) => s + r.ingreso, 0), anuales.reduce((s, r) => s + r.om, 0), anuales.reduce((s, r) => s + r.ga, 0), anuales.reduce((s, r) => s + r.flujo, 0), anuales.reduce((s, r) => s + r.flujoGpbi, 0), '', ''];
  totalRow.eachCell({ includeEmpty: false }, (cell, col) => {
    cell.font = { bold: true, size: 11, color: { argb: WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A5F' } };
    if (col >= 4) cell.numFmt = '"USD $"#,##0.00';
  });
  totalRow.height = 22;

  const widths = [8, 18, 16, 16, 14, 14, 16, 16, 18, 18];
  widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  // Freeze header row
  ws.views = [{ state: 'frozen', ySplit: 3 }];

  return ws;
}

// ─── HOJA 3: COMPARATIVA CFE MENSUAL ──────────────────────────────────────
function crearHojaCFE(wb, p) {
  const ws = wb.addWorksheet('📄 Recibo CFE', { properties: { tabColor: { argb: BLUE } } });
  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  ws.mergeCells('A1:I1');
  ws.getCell('A1').value = `ANÁLISIS CFE CON SOLAR — ${p.cliente?.toUpperCase()}`;
  ws.getCell('A1').font = { bold: true, size: 13, color: { argb: WHITE } };
  ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK } };
  ws.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 28;

  const headers = ['Mes', 'CFE sin solar (MXN)', 'CFE con solar (MXN)', 'Cobro Brio (MXN)', 'Total cliente (MXN)', 'Ahorro mensual (MXN)', '% Ahorro', 'kWh generados', 'Precio medio CFE'];
  const hr = ws.getRow(2);
  headers.forEach((h, i) => {
    const cell = hr.getCell(i + 1);
    cell.value = h;
    Object.assign(cell, hdr('1E3A5F'));
  });
  hr.height = 24;

  const consumos = p.consumos || Array(12).fill({ kwh_base: 0, kwh_intermedia: 0, kwh_punta: 0, kw_base: 0, kw_intermedia: 0, kw_punta: 0, fp: 90, dias_mes: 30 });
  const genMensual = p.generacion_mensual || Array(12).fill((p.generacion_anual_mwh || 0) / 12);

  let totalSin = 0, totalCon = 0, totalBrio = 0, totalAhorro = 0, totalKwh = 0;

  MESES.forEach((mes, i) => {
    const consumo = consumos[i] || {};
    const gen = (genMensual[i] || 0) * 1000;
    const reciboSin = calcularReciboCFE(consumo, TARIFAS_GDMTH);
    const consumoCon = aplicarNetmetering(consumo, gen);
    const reciboCon = calcularReciboCFE(consumoCon, TARIFAS_GDMTH);
    const cobro = gen * (p.tarifa_brio_mxn || 0);
    const total = reciboCon.total + cobro;
    const ahorro = reciboSin.total - total;
    const pct = reciboSin.total > 0 ? ahorro / reciboSin.total : 0;

    totalSin += reciboSin.total; totalCon += reciboCon.total;
    totalBrio += cobro; totalAhorro += ahorro; totalKwh += gen;

    const r = ws.getRow(3 + i);
    r.values = [mes, reciboSin.total, reciboCon.total, cobro, total, ahorro, pct, gen, reciboSin.total / (reciboSin.kwh_total || 1)];
    const bg = i % 2 === 0 ? LGRAY : WHITE;
    r.eachCell({ includeEmpty: false }, (cell, col) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.font = { size: 10 };
      if (col === 1) cell.font = { bold: true, size: 10 };
      else if (col === 7) { cell.numFmt = '0.0%'; cell.font = { bold: true, size: 10, color: { argb: pct >= 0.3 ? GREEN : 'FFF59E0B' } }; }
      else if (col === 6) { cell.numFmt = '"$"#,##0.00'; cell.font = { bold: true, size: 10, color: { argb: ahorro >= 0 ? GREEN : RED } }; }
      else if (col === 8) cell.numFmt = '#,##0';
      else if (col === 9) cell.numFmt = '"$"0.0000 "/kWh"';
      else cell.numFmt = '"$"#,##0.00';
    });
    r.height = 18;
  });

  // Totales
  const tr = ws.getRow(16);
  tr.values = ['TOTAL ANUAL', totalSin, totalCon, totalBrio, totalSin - totalAhorro, totalAhorro, totalAhorro / totalSin, totalKwh, totalSin / totalKwh];
  tr.eachCell({ includeEmpty: false }, (cell, col) => {
    cell.font = { bold: true, size: 11, color: { argb: WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '065F46' } };
    if (col === 7) cell.numFmt = '0.0%';
    else if (col === 8) cell.numFmt = '#,##0';
    else if (col === 9) cell.numFmt = '"$"0.0000';
    else if (col > 1) cell.numFmt = '"$"#,##0.00';
  });
  tr.height = 22;

  const widths2 = [14, 20, 20, 18, 20, 20, 10, 16, 18];
  widths2.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  return ws;
}

// ─── HOJA 4: ESCENARIOS ───────────────────────────────────────────────────
function crearHojaEscenarios(wb, p) {
  const ws = wb.addWorksheet('📈 Escenarios', { properties: { tabColor: { argb: 'FFEF4444' } } });

  ws.mergeCells('A1:H1');
  ws.getCell('A1').value = `ANÁLISIS DE ESCENARIOS — ${p.cliente?.toUpperCase()}`;
  ws.getCell('A1').font = { bold: true, size: 13, color: { argb: WHITE } };
  ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK } };
  ws.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 28;

  const escenarios = [
    { nombre: 'Conservador', tarifa: (p.tarifa_brio_usd || 0) * 1.05, gen_factor: 0.90, capex_factor: 1.10, color: RED },
    { nombre: 'Base',        tarifa: (p.tarifa_brio_usd || 0),        gen_factor: 1.00, capex_factor: 1.00, color: BLUE },
    { nombre: 'Optimista',   tarifa: (p.tarifa_brio_usd || 0) * 0.95, gen_factor: 1.05, capex_factor: 0.95, color: GREEN },
  ];

  const headers3 = ['Escenario', 'Tarifa PPA', 'Generación Año 1', 'CAPEX', 'Ingreso Año 1', 'TIR GPBI 25a', 'TIR GPBI 15a', 'Payback'];
  const hr3 = ws.getRow(3);
  headers3.forEach((h, i) => {
    const cell = hr3.getCell(i + 1);
    cell.value = h;
    Object.assign(cell, hdr('1E3A5F'));
  });
  hr3.height = 24;

  escenarios.forEach((esc, i) => {
    const gen = (p.generacion_anual_mwh || 0) * esc.gen_factor;
    const capex = (p.capex_usd || 0) * esc.capex_factor;
    const om = capex * 0.012;
    const { flujos, payback_mes } = calcularFlujoPPA({
      generacion_anual_mwh: gen,
      tarifa_brio_usd: esc.tarifa,
      inflacion_anual: p.inflacion_anual || 0.045,
      degradacion_anual: p.degradacion_anual || 0.004,
      capex_usd: capex,
      om_usd_anual: om,
      precio_venta_usd: capex,
    });

    const flujosGPBI = flujos.map(f => f.flujo_gpbi);
    const tir25 = calcularTIR(flujosGPBI, 25);
    const tir15 = calcularTIR(flujosGPBI, 15);
    const ingreso1 = gen * 1000 * esc.tarifa * (p.fx || 17.4);

    const r = ws.getRow(4 + i);
    r.values = [esc.nombre, esc.tarifa, gen, capex, ingreso1, tir25, tir15, payback_mes];
    r.eachCell({ includeEmpty: false }, (cell, col) => {
      cell.font = { bold: col === 1, size: 11, color: { argb: col === 1 ? esc.color : DARK } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LGRAY } };
      cell.alignment = { horizontal: col === 1 ? 'left' : 'center', vertical: 'middle' };
      if (col === 2) cell.numFmt = '"USD $"0.0000 "/kWh"';
      else if (col === 3) cell.numFmt = '#,##0.00 "MWh/año"';
      else if (col === 4 || col === 5) cell.numFmt = col === 4 ? '"USD $"#,##0' : '"$"#,##0';
      else if (col === 6 || col === 7) { cell.numFmt = '0.00%'; cell.font = { bold: true, size: 12, color: { argb: (col === 6 ? tir25 : tir15) >= 0.20 ? GREEN : RED } }; }
      else if (col === 8) cell.numFmt = '#,##0 "meses"';
    });
    r.height = 24;
  });

  // Análisis de sensibilidad — tabla tarifa vs TIR
  ws.mergeCells('A9:H9');
  ws.getCell('A9').value = 'ANÁLISIS DE SENSIBILIDAD — Tarifa PPA vs TIR GPBI 25 años';
  ws.getCell('A9').font = { bold: true, size: 11, color: { argb: WHITE } };
  ws.getCell('A9').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A5F' } };
  ws.getCell('A9').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(9).height = 22;

  const tarifaBase = p.tarifa_brio_usd || 0.097;
  const tarifas = [-0.015, -0.010, -0.005, 0, +0.005, +0.010, +0.015].map(d => tarifaBase + d);

  ws.getRow(10).values = ['Tarifa USD/kWh', ...tarifas.map(t => t.toFixed(4))];
  ws.getRow(10).eachCell({ includeEmpty: false }, (cell, col) => {
    Object.assign(cell, hdr(col === 1 ? DARK : '1E3A5F'));
    if (col > 1) cell.numFmt = '"$"0.0000';
  });

  // TIR por tarifa
  const tirPorTarifa = tarifas.map(tarifa => {
    const { flujos } = calcularFlujoPPA({
      generacion_anual_mwh: p.generacion_anual_mwh || 0,
      tarifa_brio_usd: tarifa,
      inflacion_anual: p.inflacion_anual || 0.045,
      degradacion_anual: p.degradacion_anual || 0.004,
      capex_usd: p.capex_usd || 0,
      om_usd_anual: p.om_usd_anual || 0,
      precio_venta_usd: p.capex_usd || 0,
    });
    return calcularTIR(flujos.map(f => f.flujo_gpbi), 25);
  });

  ws.getRow(11).values = ['TIR GPBI 25 años', ...tirPorTarifa];
  ws.getRow(11).eachCell({ includeEmpty: false }, (cell, col) => {
    cell.font = { bold: true, size: 11, color: { argb: col === 1 ? WHITE : ((tirPorTarifa[col - 2] || 0) >= 0.20 ? GREEN : RED) } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: col === 1 ? DARK : LGRAY } };
    cell.alignment = { horizontal: 'center' };
    if (col > 1) cell.numFmt = '0.00%';
  });
  ws.getRow(11).height = 22;

  const widths4 = [18, 14, 14, 14, 14, 14, 14, 14];
  widths4.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  return ws;
}

// ─── FUNCIÓN PRINCIPAL ─────────────────────────────────────────────────────
export async function exportarProyectoExcel(proyecto) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Brio PPA Manager';
  wb.lastModifiedBy = 'Brio Energía';
  wb.created = new Date();
  wb.modified = new Date();
  wb.properties.date1904 = false;

  const metricas = calcularMetricasProyecto(proyecto);
  const p = { ...proyecto, ...metricas };

  crearHojaResumen(wb, p, metricas);
  crearHojaFlujo(wb, p);
  crearHojaCFE(wb, p);
  crearHojaEscenarios(wb, p);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const nombre = `Brio_PPA_${(proyecto.cliente || 'cotizacion').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  saveAs(blob, nombre);
}
