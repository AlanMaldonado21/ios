# Hábitos + Finanzas

Se publica con GitHub Pages desde `main` (raíz), sin paso de build en el servidor.

## Hábitos
- `index.html`: app de hábitos en un solo archivo (HTML + CSS + JS sin librerías). Datos en `localStorage` (`habitos-v1`).
- No pasa por Vite. El único agregado para finanzas es la pestaña "💰 Finanzas", que navega a `finanzas/`.

## Finanzas (`/finanzas`)
- Código fuente: `finanzas-src/` (React + TypeScript + Recharts, con Vite).
- Build: `npm run build` → genera `finanzas/`, que **se commitea** (es lo que sirve Pages). Después de cambiar algo en `finanzas-src/` o `lib/`, compilá y commiteá `finanzas/` también.
- Lógica pura: `lib/finanzas/`
  - `calc.ts`: plan mes a mes (ingresos, comisión cobrada el mes siguiente, aguinaldo jun/dic, % automático igual para todos los meses hasta la meta, ahorro, cuotas, libre, resumen).
  - `diario.ts`: gastos diarios, checklist de ahorro, compras con crédito → cuotas (BNA cierra el 22).
  - `seed.ts`: `SEED` replica la planilla original (lo usan los tests); `DATOS_INICIALES` es con lo que arranca la app (ahorro en pesos en 0: los $ 1.627.500 de la planilla eran los mismos U$S 1.050).
  - `format.ts`: `$ 1.234.567` y `U$S 1.234,56`.
- Tests: `npm test` (Vitest). Replican los números de la planilla; tienen que pasar siempre.
- Estado: `finanzas-src/src/store.tsx`. Vive en `localStorage` (`finanzas-v1`) y, si hay sesión, se copia a Supabase (ver Sincronización).
- Pantallas (`#/ruta`): inicio (caja del mes, checklist, apertura), diario, plan (proyección, % por mes con slider, gráficos), ingresos, cuotas, gastos (fijos), config.
- Estilo: mismos tokens de color y tipografía que hábitos, acento celeste `#1cb0f6`, verde = positivo, ámbar = advertencia, rojo suave = negativo. Mobile first; sidebar desde 900px.

## Sincronización con Supabase (opcional)
- `config.js` (raíz) tiene `url` y `anonKey`; vacíos = todo sigue solo en el dispositivo. La anon key es pública, la seguridad es RLS.
- `sync.js` (raíz, sin dependencias, lo cargan Hábitos y Finanzas): login email+contraseña (GoTrue por fetch), una sesión compartida (`sb-session-v1`), y un documento JSON por app en `public.app_state (user_id, app, data, updated_at)`. localStorage sigue siendo la fuente local; cada cambio se sube con debounce; al abrir/volver al foco se baja lo más nuevo (último cambio gana, por documento completo).
- Primera vez que se vincula un dispositivo con datos en ambos lados se pregunta cuál usar; antes de reemplazar lo local se guarda `<key>-backup-<ts>` en localStorage.
- Esquema: `supabase/migrations/001_app_state.sql` (RLS por `auth.uid()`), deshacer con `001_app_state.down.sql`. Se corre a mano en el SQL Editor de Supabase.
- Pruebas: se hicieron contra un Supabase simulado (no está en el repo); falta una prueba contra el proyecto real.
