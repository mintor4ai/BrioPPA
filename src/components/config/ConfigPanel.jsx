import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { TARIFAS_GDMTH } from '../../utils/mockData.js';

export default function ConfigPanel() {
  const { demoMode } = useApp();
  const [tarifas, setTarifas] = useState(TARIFAS_GDMTH);
  const [fx, setFx] = useState(17.4);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>⚙ Configuración</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Parámetros del sistema y tarifas CFE</p>
      </div>

      {/* Demo mode banner */}
      {demoMode && (
        <div style={{ padding: '12px 16px', background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 10, marginBottom: 20, fontSize: 13 }}>
          <b>Modo Demo</b> — Los datos se guardan en memoria. Conecta Supabase para persistencia real.
          <br /><span style={{ color: 'var(--text-secondary)' }}>Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en las variables de entorno.</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* FX */}
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Tipo de Cambio</div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>FX MXN/USD</label>
            <input className="input-base" style={{ marginTop: 4 }} type="number" step="0.1" value={fx} onChange={e => setFx(e.target.value)} />
          </div>
        </div>

        {/* Variables de entorno */}
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Variables de Entorno</div>
          <table style={{ width: '100%', fontSize: 12 }}>
            <tbody>
              {[
                ['VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL ? '✓ Configurada' : '✗ No configurada'],
                ['VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓ Configurada' : '✗ No configurada'],
                ['VITE_ANTHROPIC_API_KEY', import.meta.env.VITE_ANTHROPIC_API_KEY ? '✓ Configurada' : '✗ No configurada'],
              ].map(([k, v]) => (
                <tr key={k} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 0', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{k}</td>
                  <td style={{ padding: '8px 0', fontWeight: 600, color: v.includes('✓') ? '#10B981' : '#EF4444' }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tarifas GDMTH */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Tarifas CFE GDMTH Vigentes</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {Object.entries(tarifas).map(([k, v]) => (
              <div key={k}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{k}</label>
                <input className="input-base" style={{ marginTop: 4 }} type="number" step="0.001" value={v} onChange={e => setTarifas(t => ({ ...t, [k]: parseFloat(e.target.value) }))} />
              </div>
            ))}
          </div>
          <button onClick={handleSave} style={{ marginTop: 16, padding: '8px 20px', background: saved ? '#10B981' : 'var(--solar-gold)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
            {saved ? '✓ Guardado' : 'Guardar tarifas'}
          </button>
        </div>

        {/* About */}
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Acerca del sistema</div>
          <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            <div>Brio PPA Manager v1.0</div>
            <div>Brio Energía · Grupo GP</div>
            <div>Stack: React · Supabase · Vercel · Claude API</div>
            <div style={{ marginTop: 8 }}>Motor de cálculo: calculationEngine.js</div>
            <div>IA: claude-sonnet-4-6</div>
          </div>
        </div>
      </div>
    </div>
  );
}
