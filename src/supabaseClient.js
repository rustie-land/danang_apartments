import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 🔍 Проверка ключей в консоли браузера
console.log('Supabase URL Loaded:', !!supabaseUrl);
console.log('Supabase Key Loaded:', !!supabaseAnonKey);

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');