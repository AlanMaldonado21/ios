// Supabase (opcional). Con url y anonKey vacíos la app funciona igual, solo en este dispositivo.
// La anon key es pública por diseño: la seguridad la da RLS (supabase/migrations/001_app_state.sql).
window.SUPABASE_CONFIG = { url: '', anonKey: '' };
