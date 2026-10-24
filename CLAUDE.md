# Hábitos + Finanzas

Se publica con GitHub Pages desde `main` (raíz), sin paso de build en el servidor.

## Hábitos
- `index.html`: app de hábitos en un solo archivo (HTML + CSS propio + JS sin librerías). Datos en `localStorage` (`habitos-v1`). No pasa por Vite.
- Rutas por hash: `#hoy`, `#prog`, `#hab` (`#hab-ajustes`, `#hab-syncbox` llevan a esa sección).
- Campos opcionales nuevos (no rompen datos viejos): `settings.weekMin` (días para una semana buena, 4 por defecto) y `hito` por hábito (sesiones).
- Colores de hábito: paleta tierra; los hex viejos guardados se muestran con su equivalente (`colorDe`), el dato no se toca.

## Base compartida (`ui/`, la cargan los dos módulos sin build)
- `base.css`: tokens claro/oscuro (papel `#F2EDE4` / tinta `#1B1A17`, acento terracota, musgo = ok, ocre = advertencia), escala 12/14/16/20/28/40, `:focus-visible`, una curva y duración (`--ease`, `--dur`), `prefers-reduced-motion`, chrome común (barra superior con switch Hábitos/Finanzas, tab bar, rail ≥ 900 px, botones, toast, hoja, sello).
- `fonts/`: Fraunces (títulos y cifras), Instrument Sans (texto), JetBrains Mono (montos). Autohospedadas.
- `icons.svg`: sprite de Lucide generado con `npm run iconos` (`scripts/iconos.mjs`). Emojis solo para el emoji que elige el usuario en cada hábito.
- `comun.js`: lógica compartida, todo derivado de los datos: semanas buenas, hitos por hábito, racha de registro de gastos, camino de ahorro, resumen semanal, indicador común, ojito (`finanzas-ocultar-v1`). Tests en `comun.test.ts`.
- Prohibido: paleta Duolingo (#58cc02, #1cb0f6, #ce82ff, #ff9600), confeti, XP o premios por gastar/cargar gastos. Celebración solo en hitos (sello sobrio).

## Finanzas (`/finanzas`)
- Código fuente: `finanzas-src/` (React + TypeScript + Recharts, con Vite).
- Build: `npm run build` → genera `finanzas/`, que **se commitea** (es lo que sirve Pages). Después de cambiar algo en `finanzas-src/` o `lib/`, compilá y commiteá `finanzas/` también.
- Lógica pura: `lib/finanzas/`
  - `calc.ts`: plan mes a mes (ingresos, comisión cobrada el mes siguiente, aguinaldo jun/dic, % automático igual para todos los meses hasta la meta, ahorro, cuotas, libre, resumen).
  - `diario.ts`: gastos diarios, checklist de ahorro, compras con crédito → cuotas (BNA cierra el 22).
  - `seed.ts`: `SEED` replica la planilla original (lo usan los tests); `DATOS_INICIALES` es con lo que arranca la app (ahorro en pesos en 0: los $ 1.627.500 de la planilla eran los mismos U$S 1.050).
  - `format.ts`: `$ 1.234.567` y `U$S 1.234,56`.
- Tests: `npm test` (Vitest). Replican los números de la planilla; tienen que pasar siempre.
- Estado: `finanzas-src/src/store.tsx`. Vive en `localStorage` (`finanzas-v1`) y, si hay sesión, se copia a Supabase (ver Sincronización). `sinGasto` (días "no gasté") es opcional y nuevo. `finanzas-resumen-v1` es una copia de solo lectura del ahorro real para el indicador de Hábitos.
- Pantallas (`#/ruta`): inicio (meta de ahorro real arriba, gasto del mes, hábitos de hoy, últimos gastos, caja plegada), diario, plan (aro = ahorrado real; proyección aparte), mes (detalle), ingresos, cuotas, gastos (fijos), config, mas.
- Estilo: usa `ui/base.css` (link con `vite-ignore`); `styles.css` solo agrega lo propio. Separación con reglas, no cards. Montos: `fmtArs`/`fmtUsd` respetan la máscara del ojito (`setMascara`).
- Chunks perezosos con `lazyConRecarga` (recarga una vez si un deploy borró el chunk) y `ErrorBoundary` con botón Recargar.

## Sincronización con Supabase (opcional)
- `config.js` (raíz) tiene `url` y `anonKey`; vacíos = todo sigue solo en el dispositivo. La anon key es pública, la seguridad es RLS.
- `sync.js` (raíz, sin dependencias, lo cargan Hábitos y Finanzas): login email+contraseña (GoTrue por fetch), una sesión compartida (`sb-session-v1`), y un documento JSON por app en `public.app_state (user_id, app, data, updated_at)`. localStorage sigue siendo la fuente local; cada cambio se sube con debounce; al abrir/volver al foco se baja lo más nuevo (último cambio gana, por documento completo).
- Estado honesto, por app: sincronizado / pendiente (cambio local sin subir, marcado `dirty` en `<key>-sync`) / error con reintento automático (5 s, 15 s, 45 s… hasta 5 min) y "Reintentar ahora". Nunca dice "Sincronizado" si el último envío falló.
- Primera vez que se vincula un dispositivo con datos en ambos lados se pregunta cuál usar; antes de reemplazar lo local se guarda `<key>-backup-<ts>` en localStorage (quedan las últimas 3 por app).
- Esquema: `supabase/migrations/001_app_state.sql` (RLS por `auth.uid()`), deshacer con `001_app_state.down.sql`. Se corre a mano en el SQL Editor de Supabase.
- Pruebas: se hicieron contra un Supabase simulado (no está en el repo); falta una prueba contra el proyecto real.
