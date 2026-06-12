import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { fmtKwp, fmtPct, fmtDate, colorEstado } from '../../utils/formatters.js';
import ProjectDrawer from './ProjectDrawer.jsx';

const ESTADOS = ['Todos', 'Prospecto', 'Cotizacion', 'Negociacion', 'Autorizado', 'Construccion', 'Operando', 'Perdido'];

export default function ProjectList({ selectedId, setSelectedId, onNew }) {
  const { proyectos, deleteProyecto, addToast } = useApp();
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (selectedId) setDrawerOpen(true);
  }, [selectedId]);

  const filtered = proyectos.filter(p => {
    const matchEstado = filtroEstado === 'Todos' || p.estado === filtroEstado;
    const matchSearch = !busqueda || p.cliente?.toLowerCase().includes(busqueda.toLowerCase()) || p.ubicacion?.toLowerCase().includes(busqueda.toLowerCase());
    return matchEstado && matchSearch;
  });

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este proyecto?')) return;
    await deleteProyecto(id);
    addToast('Proyecto eliminado', 'success');
    if (selectedId === id) { setDrawerOpen(false); setSelectedId(null); }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', background: 'white' }}>
        <input
          className="input-base"
          style={{ width: 220 }}
          placeholder="🔍 Buscar cliente..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {ESTADOS.map(e => (
            <button key={e} onClick={() => setFiltroEstado(e)}
              style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid', fontSize: 12, fontWeight: 500, cursor: 'pointer', background: filtroEstado === e ? colorEstado(e) : 'white', color: filtroEstado === e ? 'white' : 'var(--text-secondary)', borderColor: filtroEstado === e ? colorEstado(e) : 'var(--border)' }}>
              {e}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', alignSelf: 'center' }}>{filtered.length} proyectos</span>
          <button onClick={onNew} style={{ padding: '8px 18px', background: 'var(--solar-gold)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
            + Nueva Cotización
          </button>
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 60 }}>
            <div style={{ fontSize: 40 }}>📋</div>
            <div style={{ marginTop: 12, fontSize: 15 }}>No se encontraron proyectos</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {filtered.map(p => (
              <ProjectCard key={p.id} proyecto={p}
                onClick={() => { setSelectedId(p.id); setDrawerOpen(true); }}
                onDelete={() => handleDelete(p.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Drawer */}
      {drawerOpen && selectedId && (
        <ProjectDrawer
          proyectoId={selectedId}
          onClose={() => { setDrawerOpen(false); setSelectedId(null); }}
        />
      )}
    </div>
  );
}

function ProjectCard({ proyecto: p, onClick, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const c = colorEstado(p.estado);

  return (
    <div className="card" style={{ cursor: 'pointer', position: 'relative', transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <span className="status-badge" style={{ background: `${c}15`, color: c, border: `1px solid ${c}40` }}>
          ● {p.estado}
        </span>
        <div style={{ position: 'relative' }}>
          <button onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-secondary)', padding: '2px 6px' }}>⋮</button>
          {menuOpen && (
            <div style={{ position: 'absolute', right: 0, top: 28, background: 'white', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 10, minWidth: 160 }}
              onMouseLeave={() => setMenuOpen(false)}>
              <MenuItem label="Abrir" onClick={() => { onClick(); setMenuOpen(false); }} />
              <MenuItem label="🗑 Eliminar" onClick={() => { onDelete(); setMenuOpen(false); }} danger />
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div onClick={onClick}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 2 }}>{p.cliente}</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>{p.ubicacion} · {p.tarifa_cfe}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <Stat label="Capacidad" value={fmtKwp(p.capacidad_kwp)} />
          <Stat label="Generación" value={`${(p.generacion_anual_mwh || 0).toFixed(0)} MWh/año`} />
          <Stat label="Tarifa PPA" value={`$${(p.tarifa_brio_mxn || 0).toFixed(3)}/kWh`} />
          <Stat label="Descuento CFE" value={fmtPct(p.descuento_vs_cfe)} color={p.descuento_vs_cfe >= 0.30 ? '#10B981' : '#F59E0B'} />
        </div>
        <div style={{ paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: (p.tir_gpbi_25 || 0) >= 0.20 ? '#10B981' : '#EF4444' }}>
            TIR GPBI: {fmtPct(p.tir_gpbi_25)}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDate(p.updated_at)}</span>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: color || 'var(--text-primary)', marginTop: 1 }}>{value}</div>
    </div>
  );
}

function MenuItem({ label, onClick, danger }) {
  return (
    <div onClick={onClick} style={{ padding: '8px 14px', fontSize: 13, cursor: 'pointer', color: danger ? '#EF4444' : 'var(--text-primary)' }}
      onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
      {label}
    </div>
  );
}
