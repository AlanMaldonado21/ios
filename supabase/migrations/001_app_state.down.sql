-- Deshace 001_app_state.sql. Borra la copia en la nube; los datos locales de cada dispositivo no se tocan.
drop table if exists public.app_state;
