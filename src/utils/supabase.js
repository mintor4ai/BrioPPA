import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const isSupabaseConfigured = () => !!supabase;

export async function getProyectos() {
  if (!supabase) return null;
  const { data, error } = await supabase.from('proyectos').select('*').order('updated_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function saveProyecto(proyecto) {
  if (!supabase) return null;
  const { data, error } = await supabase.from('proyectos').upsert(proyecto).select().single();
  if (error) throw error;
  return data;
}

export async function deleteProyecto(id) {
  if (!supabase) return null;
  const { error } = await supabase.from('proyectos').delete().eq('id', id);
  if (error) throw error;
}

export async function saveIAOutput(proyecto_id, tipo, contenido, tokens) {
  if (!supabase) return null;
  await supabase.from('ia_outputs').upsert({ proyecto_id, tipo, contenido, tokens_usados: tokens, updated_at: new Date().toISOString() }, { onConflict: 'proyecto_id,tipo' });
}

export async function getIAOutputs(proyecto_id) {
  if (!supabase) return [];
  const { data } = await supabase.from('ia_outputs').select('*').eq('proyecto_id', proyecto_id);
  return data || [];
}
