import { createClient } from '@supabase/supabase-js';

// Supabaseの設定
// 環境変数が設定されていない場合のデフォルト値
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://byylkzpoitkmxhyzjnxj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5eWxrenBvaXRrbXhoeXpqbnhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTIzOTA4MzAsImV4cCI6MjAyNzk2NjgzMH0.dJ8CyhHCPkYksc9TyjE4_KO8CUFxCkLqOpJFpH6xGyo';

// デバッグ情報をコンソールに出力
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseAnonKey ? 'Set' : 'Not Set');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
