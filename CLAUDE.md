# Hábitos + Finanzas

Se publica con GitHub Pages desde `main` (raíz), sin paso de build en el servidor.

## Hábitos
- `index.html`: app de hábitos en un solo archivo (HTML + CSS propio + JS sin librerías). Datos en `localStorage` (`habitos-v1`). No pasa por Vite.
- Rutas por hash: `#hoy`, `#pend`, `#prog`, `#hab` (`#hab-ajustes`, `#hab-syncbox` llevan a esa sección).
- Campos opcionales nuevos (no rompen datos viejos): `settings.weekMin` (días para una semana buena, 4 por defecto) y `hito` por hábito (sesiones).
- Pendientes del día: pestaña propia `#pend` (`vPend`, con el número de abiertos en la barra; no aparecen en Hoy). Dato `S.pend`, opcional: `{id, t, k, done}` (`k` = día que se cargó, `done` = día que se tachó o null). Los no hechos pasan al día siguiente con "Desde ayer"; los hechos de días anteriores se borran al cargar (`normalize`). Se cargan escribiendo o con "Dictar pendientes" (Web Speech API, `es-AR`, `continuous = false` porque en iPhone el continuo repite frases); diciendo "punto" se dictan varios (`partirDictado`). Mientras escucha no se redibuja la pantalla (`vozUI`) y siempre termina solo: 2,5 s sin hablar, 8 s si no llega nada (Safari a veces se cuelga) o 30 s de tope (`vozFin`). Sin soporte, no aparece el botón (queda el micrófono del teclado).
- Colores de hábito: paleta tierra; los hex viejos guardados se muestran con su equivalente (`colorDe`), el dato no se toca.

## Base compartida (`ui/`, la cargan los dos módulos sin build)
- `base.css`: estilo amigable tipo Duolingo. Tokens claro/oscuro (fondo `#F4F6FA`, cards blancas con borde 2px y canto inferior 4px, primario verde `--acc`, selección azul `--sel`, violeta, naranja = rachas), botones 3D que se hunden al tocar, barras gordas, animaciones con rebote (`--spring`, `pop`, `rebote`, `llenar`; `.entra` = entrada escalonada), `prefers-reduced-motion`, chrome común (switch en píldora, tab bar con Cargar elevado, rail ≥ 900 px, toast, hoja, festejo).
- `fonts/`: Nunito (única familia, redondeada; montos con `tabular-nums`). Autohospedada.
- `icons.svg`: sprite de Lucide generado con `npm run iconos` (`scripts/iconos.mjs`). Emojis decorativos con moderación (🔥 rachas, 🐷 meta, 🎉 festejo).
- `comun.js`: lógica compartida, todo derivado de los datos: semanas buenas, hitos por hábito, racha de registro de gastos, camino de ahorro, resumen semanal, indicador común, ojito (`finanzas-ocultar-v1`). Tests en `comun.test.ts`.
- Festejos (chispas `Comun.chispas`, festejo con rebote) solo al cumplir: tildar un hábito, tachar un ahorro, hitos. Nunca por cargar gastos.

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
- Pantallas (`#/ruta`): inicio (gasto del mes como tarjeta protagonista, hábitos de hoy, últimos gastos, caja plegada, próximo mes del plan; la meta de ahorro no va acá, vive en Plan), diario, plan (aro = ahorrado real; proyección aparte), mes (detalle), ingresos, cuotas, gastos (fijos), config, mas.
- Estilo: usa `ui/base.css` (link con `vite-ignore`); `styles.css` solo agrega lo propio. Cada bloque es una card; en Inicio el gasto del mes es una tarjeta azul. Categorías de gasto con color propio (`colorTipo` → `ct-0…7`). Montos: `fmtArs`/`fmtUsd` respetan la máscara del ojito (`setMascara`).
- Chunks perezosos con `lazyConRecarga` (recarga una vez si un deploy borró el chunk) y `ErrorBoundary` con botón Recargar.

## Sincronización con Supabase (opcional)
- `config.js` (raíz) tiene `url` y `anonKey`; vacíos = todo sigue solo en el dispositivo. La anon key es pública, la seguridad es RLS.
- `sync.js` (raíz, sin dependencias, lo cargan Hábitos y Finanzas): login email+contraseña (GoTrue por fetch), una sesión compartida (`sb-session-v1`), y un documento JSON por app en `public.app_state (user_id, app, data, updated_at)`. localStorage sigue siendo la fuente local; cada cambio se sube con debounce; al abrir/volver al foco se baja lo más nuevo (último cambio gana, por documento completo).
- Estado honesto, por app: sincronizado / pendiente (cambio local sin subir, marcado `dirty` en `<key>-sync`) / error con reintento automático (5 s, 15 s, 45 s… hasta 5 min) y "Reintentar ahora". Nunca dice "Sincronizado" si el último envío falló.
- Primera vez que se vincula un dispositivo con datos en ambos lados se pregunta cuál usar; antes de reemplazar lo local se guarda `<key>-backup-<ts>` en localStorage (quedan las últimas 3 por app).
- Esquema: `supabase/migrations/001_app_state.sql` (RLS por `auth.uid()`), deshacer con `001_app_state.down.sql`. Se corre a mano en el SQL Editor de Supabase.
- Pruebas: se hicieron contra un Supabase simulado (no está en el repo); falta una prueba contra el proyecto real.
