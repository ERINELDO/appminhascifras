
import { createClient } from '@supabase/supabase-js';

const getEnvVar = (name: string, fallback: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[name]) {
    return process.env[name] as string;
  }
  try {
    const viteEnv = (import.meta as any).env;
    if (viteEnv && viteEnv[name]) {
      return viteEnv[name];
    }
  } catch (e) {}
  return fallback;
};

// Chaves do banco de dados
const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL', 'https://qamjtmdulgknnnyrvwfk.supabase.co');
const SUPABASE_ANON_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhbWp0bWR1bGdrbm5ueXJ2d2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNzg3MjAsImV4cCI6MjA4MTY1NDcyMH0.7qymHS-ZZx9Fg_O4ct2meTrvsflptlRLyikTYvG7Nwc');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
