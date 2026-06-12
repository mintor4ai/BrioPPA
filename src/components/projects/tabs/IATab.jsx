import { useState } from 'react';
import { generarResumenEjecutivo, generarCartaPropuesta, generarReporteAutorizacion } from '../../../utils/claudeAPI.js';
import { saveIAOutput, getIAOutputs } from '../../../utils/supabase.js';

const DOCS = [
  { tipo: 'resumen_ejecutivo',     label: 'Resumen Ejecutivo',         desc: 'Párrafo ejecutivo de 4-5 líneas para uso interno' },
  { tipo: 'carta_propuesta',       label: 'Carta Propuesta al Cliente', desc: 'Documento formal ~400 palabras listo para enviar' },
  { tipo: 'reporte_autorizacion',  label: 'Reporte de Autorización',    desc: 'Análisis de riesgos y recomendación para comité' },
];

export default function IATab({ proyecto }) {
  const [contenidos, setContenidos] = useState({});
  const [loading, setLoading] = useState({});

  const generar = async (tipo) => {
    setLoading(l => ({ ...l, [tipo]: true }));
    try {
      let resultado;
      if (tipo === 'resumen_ejecutivo') resultado = await generarResumenEjecutivo(proyecto);
      else if (tipo === 'carta_propuesta') resultado = await generarCartaPropuesta(proyecto);
      else resultado = await generarReporteAutorizacion(proyecto);

      const { texto, tokens } = resultado;
      setContenidos(c => ({ ...c, [tipo]: texto }));
      await saveIAOutput(proyecto.id, tipo, texto, tokens);
    } catch (e) {
      setContenidos(c => ({ ...c, [tipo]: `Error: ${e.message}` }));
    }
    setLoading(l => ({ ...l, [tipo]: false }));
  };

  const copiar = (texto) => {
    navigator.clipboard.writeText(texto);
  };

  return (
    <div>
      <div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--ia-purple-light)', borderRadius: 10, border: '1px solid #C4B5FD' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ia-purple)', marginBottom: 4 }}>✨ Centro de Documentos IA</div>
        <div style={{ fontSize: 12, color: '#5B21B6' }}>Genera documentos profesionales con IA para este proyecto. Requiere VITE_ANTHROPIC_API_KEY configurada.</div>
      </div>

      {DOCS.map(doc => (
        <div key={doc.tipo} className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{doc.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{doc.desc}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {contenidos[doc.tipo] && (
                <button onClick={() => copiar(contenidos[doc.tipo])}
                  style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: 'white' }}>
                  Copiar
                </button>
              )}
              <button className="ia-button" onClick={() => generar(doc.tipo)} disabled={loading[doc.tipo]} style={{ fontSize: 12 }}>
                {loading[doc.tipo]
                  ? <><span className="spinner">⟳</span> Generando...</>
                  : contenidos[doc.tipo] ? '↺ Regenerar' : '✨ Generar'}
              </button>
            </div>
          </div>

          {contenidos[doc.tipo] && (
            <div style={{ marginTop: 12, padding: '14px 16px', background: '#FAFAF9', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, lineHeight: 1.8, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', maxHeight: 320, overflowY: 'auto' }}>
              {contenidos[doc.tipo]}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
