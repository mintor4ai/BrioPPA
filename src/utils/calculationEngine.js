export function calcularReciboCFE(consumo, tarifas) {
  const { kwh_base = 0, kwh_intermedia = 0, kwh_punta = 0, kw_base = 0, kw_intermedia = 0, kw_punta = 0, fp = 90, dias_mes = 31 } = consumo;
  const kw_max = Math.max(kw_base, kw_intermedia, kw_punta);
  const kwh_total = kwh_base + kwh_intermedia + kwh_punta;
  const fc = 0.57;
  const cargo_fijo       = tarifas.fijo || 304.99;
  const energia_base     = kwh_base * (tarifas.base || 0.884);
  const energia_inter    = kwh_intermedia * (tarifas.intermedia || 1.725);
  const energia_punta    = kwh_punta * (tarifas.punta || 1.9932);
  const distribucion     = kw_max * (tarifas.distribucion || 101.35);
  const capacidad        = kw_max * (tarifas.capacidad || 62.5) * fc * (dias_mes / 30);
  const transmision      = kwh_total * (tarifas.transmision || 0.1758);
  const cenace           = kwh_total * (tarifas.cenace || 0.0106);
  const scnmem           = kwh_total * (tarifas.scnmem || 0.0062);
  const fp_real = fp / 100;
  const fp_penalty = fp_real < 0.90 ? -(distribucion + capacidad) * ((0.90 / fp_real) - 1) : 0;
  const subtotal = cargo_fijo + energia_base + energia_inter + energia_punta + distribucion + capacidad + transmision + cenace + scnmem + fp_penalty;
  const total = subtotal * 1.16;
  return { cargo_fijo, energia_base, energia_inter, energia_punta, distribucion, capacidad, transmision, cenace, scnmem, fp_penalty, subtotal, total, kwh_total, kw_max };
}

export function aplicarNetmetering(consumo, generacion_mensual) {
  const gen_base  = generacion_mensual * 0.10;
  const gen_inter = generacion_mensual * 0.90;
  return {
    ...consumo,
    kwh_base:       Math.max(0, (consumo.kwh_base || 0) - gen_base),
    kwh_intermedia: Math.max(0, (consumo.kwh_intermedia || 0) - gen_inter),
    fp: Math.min(90, consumo.fp || 90),
  };
}

export function calcularFlujoPPA(params) {
  const {
    generacion_anual_mwh = 0,
    tarifa_brio_usd = 0,
    inflacion_anual = 0.045,
    degradacion_anual = 0.004,
    capex_usd = 0,
    om_usd_anual = 0,
    ga_pct = 0.04,
    gpbi_share = 0.70,
    brio_share = 0.30,
    precio_venta_usd = 0,
  } = params;

  const generacion_anual_kwh = generacion_anual_mwh * 1000;
  const flujos = [];

  const periodos_construccion = [
    { periodo: -5, epc_pct: 0.50 },
    { periodo: -4, epc_pct: 0.00 },
    { periodo: -3, epc_pct: 0.20 },
    { periodo: -2, epc_pct: 0.25 },
    { periodo: -1, epc_pct: 0.00 },
    { periodo:  0, epc_pct: 0.05 },
  ];

  let acumulado_proyecto = 0;
  let acumulado_gpbi = 0;

  periodos_construccion.forEach(({ periodo, epc_pct }) => {
    const epc = -(precio_venta_usd * epc_pct);
    const ga  = epc !== 0 ? epc * 0.04 : 0;
    const flujo_proyecto = epc + ga;
    const flujo_gpbi = flujo_proyecto * gpbi_share;
    const flujo_brio = flujo_proyecto * brio_share;
    acumulado_proyecto += flujo_proyecto;
    acumulado_gpbi += flujo_gpbi;
    flujos.push({ periodo, tipo: 'construccion', generacion: 0, tarifa: 0, ingreso: 0, epc, om: 0, ga, beneficio_fiscal: 0, flujo_proyecto, flujo_gpbi, flujo_brio, acumulado_proyecto, acumulado_gpbi });
  });

  let payback_mes = null;

  for (let anio = 1; anio <= 25; anio++) {
    const factor_degradacion = Math.pow(1 - degradacion_anual, anio - 1);
    const factor_inflacion   = Math.pow(1 + inflacion_anual, anio - 1);
    const generacion_anual_real = generacion_anual_kwh * factor_degradacion;
    const tarifa_año = tarifa_brio_usd * factor_inflacion;
    const om_mes = om_usd_anual / 12;

    for (let mes = 1; mes <= 12; mes++) {
      const periodo = (anio - 1) * 12 + mes;
      const generacion_mes = generacion_anual_real / 12;
      const ingreso = generacion_mes * tarifa_año;
      const ga = ingreso * ga_pct;
      const beneficio_fiscal = (anio === 1 && mes === 1) ? capex_usd * 0.30 : 0;
      const flujo_proyecto = ingreso - om_mes - ga + beneficio_fiscal;
      const flujo_gpbi = flujo_proyecto > 0 ? flujo_proyecto * gpbi_share : flujo_proyecto;
      const flujo_brio = flujo_proyecto > 0 ? flujo_proyecto * brio_share : 0;
      acumulado_proyecto += flujo_proyecto;
      acumulado_gpbi += flujo_gpbi;
      if (payback_mes === null && acumulado_proyecto >= 0) payback_mes = periodo;
      flujos.push({ periodo, anio, mes, tipo: 'operacion', generacion: generacion_mes, tarifa: tarifa_año, ingreso, om: om_mes, ga, beneficio_fiscal, flujo_proyecto, flujo_gpbi, flujo_brio, acumulado_proyecto, acumulado_gpbi });
    }
  }

  return { flujos, payback_mes };
}

export function calcularTIR(flujosMensuales, horizonteAnios = 25) {
  const totalPeriodos = horizonteAnios * 12 + 6;
  const flujos = flujosMensuales.slice(0, totalPeriodos);

  function npv(tasa) {
    return flujos.reduce((sum, flujo, i) => sum + flujo / Math.pow(1 + tasa, i), 0);
  }

  let low = -0.999, high = 10.0;
  if (npv(low) * npv(high) > 0) return null;

  for (let i = 0; i < 200; i++) {
    const mid = (low + high) / 2;
    if (Math.abs(npv(mid)) < 1e-6 || (high - low) / 2 < 1e-10) {
      return Math.pow(1 + mid, 12) - 1;
    }
    npv(low) * npv(mid) < 0 ? (high = mid) : (low = mid);
  }

  return Math.pow(1 + (low + high) / 2, 12) - 1;
}

export function calcularPrecioMedioCFE(recibos) {
  const total_pagado = recibos.reduce((s, r) => s + (r.total || 0), 0);
  const total_kwh    = recibos.reduce((s, r) => s + (r.kwh_total || 0), 0);
  return total_kwh > 0 ? total_pagado / total_kwh : 0;
}

export function calcularDescuento(tarifa_brio_mxn, precio_medio_cfe) {
  return precio_medio_cfe > 0 ? 1 - (tarifa_brio_mxn / precio_medio_cfe) : 0;
}

export function calcularMetricasProyecto(p) {
  const { flujos, payback_mes } = calcularFlujoPPA({
    generacion_anual_mwh: p.generacion_anual_mwh,
    tarifa_brio_usd: p.tarifa_brio_usd,
    inflacion_anual: p.inflacion_anual || 0.045,
    degradacion_anual: p.degradacion_anual || 0.004,
    capex_usd: p.capex_usd,
    om_usd_anual: p.om_usd_anual || (p.capex_usd * 0.012),
    precio_venta_usd: p.capex_usd,
    gpbi_share: 0.70,
    brio_share: 0.30,
  });

  const flujosProyecto = flujos.map(f => f.flujo_proyecto);
  const flujosGPBI     = flujos.map(f => f.flujo_gpbi);

  return {
    tir_proyecto_25: calcularTIR(flujosProyecto, 25),
    tir_gpbi_25:     calcularTIR(flujosGPBI, 25),
    tir_proyecto_15: calcularTIR(flujosProyecto, 15),
    tir_gpbi_15:     calcularTIR(flujosGPBI, 15),
    tir_proyecto_10: calcularTIR(flujosProyecto, 10),
    tir_gpbi_10:     calcularTIR(flujosGPBI, 10),
    payback_meses:   payback_mes,
    flujos,
  };
}
