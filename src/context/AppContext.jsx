import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MOCK_PROYECTOS } from '../utils/mockData.js';
import { getProyectos, saveProyecto as sbSave, deleteProyecto as sbDelete, isSupabaseConfigured } from '../utils/supabase.js';
import { generarAlertasDeterministas } from '../utils/alertas.js';
import { calcularMetricasProyecto } from '../utils/calculationEngine.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [proyectos, setProyectos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((msg, tipo = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, tipo }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const data = await getProyectos();
        setProyectos(data || MOCK_PROYECTOS);
        setDemoMode(!data || data.length === 0);
      } else {
        setProyectos(MOCK_PROYECTOS);
        setDemoMode(true);
      }
    } catch (e) {
      setProyectos(MOCK_PROYECTOS);
      setDemoMode(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    setAlertas(generarAlertasDeterministas(proyectos));
  }, [proyectos]);

  const saveProyecto = useCallback(async (proyecto) => {
    const metricas = calcularMetricasProyecto(proyecto);
    const proyectoFull = { ...proyecto, ...metricas, updated_at: new Date().toISOString() };

    if (!demoMode && isSupabaseConfigured()) {
      const saved = await sbSave(proyectoFull);
      setProyectos(prev => {
        const idx = prev.findIndex(p => p.id === saved.id);
        return idx >= 0 ? prev.map(p => p.id === saved.id ? saved : p) : [saved, ...prev];
      });
      return saved;
    } else {
      setProyectos(prev => {
        const idx = prev.findIndex(p => p.id === proyectoFull.id);
        return idx >= 0 ? prev.map(p => p.id === proyectoFull.id ? proyectoFull : p) : [proyectoFull, ...prev];
      });
      return proyectoFull;
    }
  }, [demoMode]);

  const deleteProyecto = useCallback(async (id) => {
    if (!demoMode && isSupabaseConfigured()) await sbDelete(id);
    setProyectos(prev => prev.filter(p => p.id !== id));
  }, [demoMode]);

  return (
    <AppContext.Provider value={{ proyectos, alertas, loading, demoMode, toasts, addToast, removeToast, saveProyecto, deleteProyecto, loadData }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
