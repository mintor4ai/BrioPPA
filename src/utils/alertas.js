export function generarAlertasDeterministas(proyectos) {
  const alertas = [];
  const hoy = new Date();

  proyectos.forEach(p => {
    const diasSinMovimiento = Math.floor((hoy - new Date(p.updated_at)) / 86400000);

    if (diasSinMovimiento > 30 && !['Autorizado', 'Operando'].includes(p.estado)) {
      alertas.push({
        tipo: 'estancado', severidad: diasSinMovimiento > 60 ? 'alta' : 'media',
        proyecto_id: p.id, cliente: p.cliente,
        mensaje: `Sin actividad hace ${diasSinMovimiento} días`,
        accion_sugerida: 'Actualizar estado o registrar nota de seguimiento',
      });
    }

    if (p.tir_gpbi_25 != null && p.tir_gpbi_25 < 0.20) {
      alertas.push({
        tipo: 'tir_baja', severidad: 'alta',
        proyecto_id: p.id, cliente: p.cliente,
        mensaje: `TIR GPBI ${((p.tir_gpbi_25 || 0) * 100).toFixed(1)}% está por debajo del mínimo (20%)`,
        accion_sugerida: 'Revisar tarifa PPA o estructura de costos',
      });
    }

    if (p.fecha_inicio_construccion) {
      const diasParaConstruccion = Math.floor((new Date(p.fecha_inicio_construccion) - hoy) / 86400000);
      if (diasParaConstruccion > 0 && diasParaConstruccion <= 30 && p.estado !== 'Autorizado') {
        alertas.push({
          tipo: 'construccion_proxima', severidad: 'alta',
          proyecto_id: p.id, cliente: p.cliente,
          mensaje: `Inicio de construcción en ${diasParaConstruccion} días pero proyecto no está Autorizado`,
          accion_sugerida: 'Completar proceso de autorización urgente',
        });
      }
    }

    if (p.descuento_vs_cfe != null && p.descuento_vs_cfe < 0.25) {
      alertas.push({
        tipo: 'descuento_bajo', severidad: 'media',
        proyecto_id: p.id, cliente: p.cliente,
        mensaje: `Descuento vs CFE de solo ${((p.descuento_vs_cfe || 0) * 100).toFixed(1)}% puede dificultar el cierre`,
        accion_sugerida: 'Considerar ajustar tarifa PPA para mejorar propuesta de valor',
      });
    }
  });

  return alertas.sort((a, b) => a.severidad === 'alta' ? -1 : b.severidad === 'alta' ? 1 : 0);
}
