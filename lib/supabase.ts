import { createClient } from '@supabase/supabase-js';

/**
 * Configurações do Supabase.
 * Prioriza as variáveis de ambiente, mas utiliza as chaves fornecidas pelo usuário
 * como valores padrão para garantir que a conexão funcione imediatamente nesta sessão.
 */
const getEnvVar = (name: string, fallback: string): string => {
  // 1. Tenta process.env
  if (typeof process !== 'undefined' && process.env && process.env[name]) {
    return process.env[name] as string;
  }
  
  try {
    // 2. Tenta import.meta.env (Vite)
    const viteEnv = (import.meta as any).env;
    if (viteEnv && viteEnv[name]) {
      return viteEnv[name];
    }
  } catch (e) {}

  return fallback;
};

// Chaves fornecidas pelo usuário
const PROVIDED_URL = 'https://qamjtmdulgknnnyrvwfk.supabase.co';
const PROVIDED_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhbWp0bWR1bGdrbm5ueXJ2d2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNzg3MjAsImV4cCI6MjA4MTY1NDcyMH0.7qymHS-ZZx9Fg_O4ct2meTrvsflptlRLyikTYvG7Nwc';

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', PROVIDED_URL);
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', PROVIDED_KEY);

// Verificação de integridade
const isValidConfig = !!supabaseUrl && 
                      !!supabaseAnonKey && 
                      supabaseUrl.startsWith('https://') &&
                      !supabaseUrl.includes('placeholder');

if (!isValidConfig) {
  console.error("ERRO: As chaves do Supabase não foram configuradas corretamente.");
}

/**
 * Inicialização do cliente Supabase.
 */
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

export const isSupabaseConfigured = () => isValidConfig;
