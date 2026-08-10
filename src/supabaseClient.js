import { createClient } from '@supabase/supabase-js';

// Используем значения из env или фоллбэк на пустую строку
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

if (!import.meta.env.VITE_SUPABASE_URL) {
  console.warn('⚠️ VITE_SUPABASE_URL не найдена в variables Vercel!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);