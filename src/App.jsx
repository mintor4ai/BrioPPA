import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import Toast from './components/layout/Toast.jsx';
import Dashboard from './components/dashboard/Dashboard.jsx';
import ProjectList from './components/projects/ProjectList.jsx';
import IACenter from './components/ia/IACenter.jsx';
import ConfigPanel from './components/config/ConfigPanel.jsx';
import NewProjectWizard from './components/wizard/NewProjectWizard.jsx';

function AppInner() {
  const { loading, demoMode } = useApp();
  const [view, setView] = useState('dashboard');
  const [selectedId, setSelectedId] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  const openNew = () => setWizardOpen(true);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--solar-dark)', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <svg width={36} height={36} viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="15" fill="rgba(255,255,255,0.1)" />
            <path d="M18 4L8 18H16L14 28L24 14H16L18 4Z" fill="white" />
          </svg>
          <span style={{ fontSize: 24, fontWeight: 800, color: 'white', letterSpacing: '0.08em' }}>BRIO</span>
        </div>
        <div style={{ color: '#64748B', fontSize: 13 }}>Cargando PPA Manager...</div>
        <div style={{ width: 40, height: 40, border: '3px solid #334155', borderTopColor: '#F59E0B', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar view={view} setView={(v) => { setView(v); if (v === 'nueva') { openNew(); setView('proyectos'); } }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Demo banner */}
        {demoMode && (
          <div style={{ background: '#FFFBEB', borderBottom: '1px solid #FCD34D', padding: '7px 20px', fontSize: 12, color: '#92400E', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <span>⚠ <b>Modo Demo</b> — Datos de ejemplo. Conecta Supabase para persistencia real.</span>
            <span style={{ color: '#A16207' }}>Configura .env.local con tus credenciales</span>
          </div>
        )}

        {/* Main content */}
        <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {view === 'dashboard' && <Dashboard setView={setView} setSelectedId={setSelectedId} />}
          {view === 'proyectos' && <ProjectList selectedId={selectedId} setSelectedId={setSelectedId} onNew={openNew} />}
          {view === 'ia' && <IACenter setView={setView} setSelectedId={setSelectedId} />}
          {view === 'config' && <ConfigPanel />}
        </main>
      </div>

      {/* Wizard modal */}
      {wizardOpen && (
        <NewProjectWizard
          onClose={() => setWizardOpen(false)}
          onSaved={(id) => { setSelectedId(id); setView('proyectos'); setWizardOpen(false); }}
        />
      )}

      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
