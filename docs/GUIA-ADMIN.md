# Guía de Administración — Pichichi

> Guía práctica para administrar la aplicación Pichichi.

## Tabla de Contenidos

- [Importar Torneos](#importar-torneos)
  - [Requisitos Previos](#requisitos-previos)
  - [Buscar Torneos Disponibles](#buscar-torneos-disponibles)
  - [Importar un Torneo](#importar-un-torneo)
  - [IDs de Torneos Conocidos](#ids-de-torneos-conocidos)
  - [Opciones del CLI](#opciones-del-cli)
  - [Re-ejecutar el Script](#re-ejecutar-el-script)
  - [Límites de la API](#límites-de-la-api)
  - [Solución de Problemas](#solución-de-problemas)
- [Limpiar Base de Datos](#limpiar-base-de-datos)
- [Activar/Desactivar Torneos](#activardesactivar-torneos)

---

## Importar Torneos

Herramienta CLI para importar datos de torneos (equipos, partidos, jugadores) desde API-Football a la base de datos de Pichichi. Reemplaza la creación manual de archivos seed con datos reales y actualizados.

### Requisitos Previos

1. **Obtener una API key de API-Football**
   - Registrarse en [dashboard.api-football.com](https://dashboard.api-football.com)
   - El plan gratuito (100 requests/día) es suficiente para importar torneos

2. **Configurar la key en el proyecto**
   - Agregar la key en el archivo `apps/api/.env`:

```
API_FOOTBALL_KEY=your-key-here
```

3. **Base de datos corriendo**
   - Asegurarse de que la base de datos esté levantada. Desde la raíz del monorepo:

```bash
npm run docker:up
```

### Buscar Torneos Disponibles

Antes de importar, se puede buscar el ID de un torneo por nombre:

```bash
npm run import-tournament -- --search "world cup"
npm run import-tournament -- --search "copa america"
npm run import-tournament -- --search "champions"
```

> Todos los comandos se ejecutan desde el directorio `apps/api/`.

Esto devuelve una lista con el ID, nombre y temporadas disponibles de cada torneo que coincida con la búsqueda.

### Importar un Torneo

#### Importación básica (equipos + partidos)

```bash
npm run import-tournament -- --league 1 --season 2026
```

#### Con planteles de jugadores

```bash
npm run import-tournament -- --league 1 --season 2026 --include-players
```

Importa los planteles completos de cada equipo. Usa más llamadas a la API (ver [Límites de la API](#límites-de-la-api)).

#### Preview sin cambios (dry-run)

```bash
npm run import-tournament -- --league 1 --season 2026 --dry-run
```

Muestra lo que se importaría sin escribir nada en la base de datos. Útil para verificar antes de una importación real.

#### Vincular con datos existentes (link-slug)

```bash
npm run import-tournament -- --league 1 --season 2026 --link-slug world-cup-2026
```

Usar **solo en la primera ejecución** cuando ya existen datos seed en la base de datos. Esto vincula el torneo importado con el registro existente por su slug, en lugar de crear un duplicado.

#### Importación completa con todas las opciones

```bash
npm run import-tournament -- --league 1 --season 2026 --include-players --link-slug world-cup-2026
```

#### Delay personalizado entre llamadas a la API

```bash
npm run import-tournament -- --league 1 --season 2026 --delay 2000
```

El delay default es 7000ms (plan Free: máximo 10 requests/minuto). Aumentar si se reciben errores de rate limiting.

### IDs de Torneos Conocidos

| ID | Torneo | Tipo |
|----|--------|------|
| 1 | FIFA World Cup | Cup |
| 9 | Copa América | Cup |
| 4 | Euro Championship | Cup |
| 2 | UEFA Champions League | Cup |
| 3 | UEFA Europa League | Cup |
| 848 | UEFA Conference League | Cup |

Para encontrar IDs de otros torneos, usar `--search`.

### Opciones del CLI

| Flag | Requerido | Descripción |
|------|-----------|-------------|
| `--league <id>` | Sí* | ID de liga/competición en API-Football |
| `--season <year>` | Sí* | Año de la temporada (ej: 2026) |
| `--search <text>` | No | Buscar torneos por nombre (mutuamente excluyente con `--league`) |
| `--include-players` | No | También importa los planteles de jugadores de cada equipo |
| `--dry-run` | No | Previsualiza los cambios sin escribir en la base de datos |
| `--link-slug <slug>` | No | Vincula los datos importados a un torneo existente por su slug |
| `--delay <ms>` | No | Delay entre llamadas a la API en milisegundos (default: 7000) |
| `--help` | No | Muestra información de uso |

*Requerido cuando no se usa `--search`.

### Re-ejecutar el Script

El script es **idempotente** — se puede ejecutar varias veces sobre el mismo torneo sin problemas:

- **Crea** registros nuevos que aún no existen
- **Actualiza** registros existentes con datos frescos (scores, estados, etc.)
- **Nunca elimina** datos existentes

En otras palabras: si algo falla a mitad de camino, simplemente volver a ejecutar el mismo comando. No se van a duplicar datos ni perder información.

> **Nota**: Usar `--link-slug` solo en la **primera** ejecución. En ejecuciones posteriores no es necesario porque el torneo ya está vinculado.

### Límites de la API

| Plan | Requests/Día | Notas |
|------|-------------|-------|
| Free | 100 | Desarrollo y testing |
| Pro | 7,500 | Períodos de torneos activos |

**Llamadas a la API estimadas por importación:**

| Tipo de Importación | Llamadas a la API |
|---------------------|-------------------|
| Solo equipos + partidos | ~3-4 |
| Con planteles de jugadores (ej: World Cup 32 equipos) | ~52 |
| Búsqueda | 1 |

El delay default es 7000ms (plan Free: máximo 10 requests/minuto). Aumentar si se reciben errores de rate limiting.

### Solución de Problemas

| Error | Causa | Solución |
|-------|-------|----------|
| `API_FOOTBALL_KEY not found` | Variable de entorno faltante | Agregar `API_FOOTBALL_KEY=your-key` en `apps/api/.env` |
| `401 Unauthorized` | API key inválida o expirada | Verificar la key en [dashboard.api-football.com](https://dashboard.api-football.com) |
| Errores de rate limit | Demasiados requests | Esperar al reset diario, o aumentar el valor de `--delay` |
| `No tournament found` | ID de liga o temporada incorrectos | Usar `--search` para encontrar el ID correcto |
| Errores de conexión a la DB | Base de datos no está corriendo | Ejecutar `npm run docker:up` desde la raíz del monorepo |

---

## Limpiar Base de Datos

Para borrar todos los datos de torneos (equipos, partidos, jugadores, predicciones) sin afectar los usuarios ni los grupos:

```bash
npm run clean-db
```

Para saltar la confirmación:

```bash
npm run clean-db -- --force
```

> ⚠️ Esto borra todas las predicciones y bonus predictions asociadas a los torneos. Los usuarios y grupos no se ven afectados.

El orden de borrado respeta las restricciones de claves foráneas:

1. Bonus predictions
2. Predictions
3. Tournament players
4. Players
5. Matches
6. Tournament bonus types
7. Tournament phases
8. Group-tournament links
9. Tournament teams
10. Teams
11. Tournaments

---

## Activar/Desactivar Torneos

Herramienta CLI para activar o desactivar un torneo moviendo las fechas de todos sus partidos. Útil para testing: simular un torneo que "arranca mañana" o uno que "ya terminó".

### Activar un Torneo

Mueve todos los partidos al futuro (el primer partido queda a NOW + 1 día), resetea los scores y pone el torneo en estado `UPCOMING`:

```bash
npm run toggle-tournament -- --slug world-cup-2022 --activate
```

**Lo que hace:**
1. Calcula el offset para que el primer partido sea mañana
2. Mueve **todos** los partidos por el mismo offset (preserva el espaciado relativo)
3. Resetea todos los partidos: `status = SCHEDULED`, scores = null
4. Actualiza el torneo: `status = UPCOMING`, ajusta `startDate` y `endDate`

### Desactivar un Torneo

Mueve todos los partidos al pasado (el último partido queda a NOW - 1 día), pone scores dummy (0-0) y marca todo como `FINISHED`:

```bash
npm run toggle-tournament -- --slug world-cup-2022 --deactivate
```

**Lo que hace:**
1. Calcula el offset para que el último partido sea ayer
2. Mueve **todos** los partidos por el mismo offset
3. Pone todos los partidos en: `status = FINISHED`, `homeScore = 0`, `awayScore = 0`
4. Actualiza el torneo: `status = FINISHED`, ajusta `startDate` y `endDate`

### Saltar Confirmación

```bash
npm run toggle-tournament -- --slug world-cup-2022 --activate --force
```

### Opciones del CLI

| Flag | Requerido | Descripción |
|------|-----------|-------------|
| `--slug <slug>` | Sí | Slug del torneo |
| `--activate` | Sí* | Mover partidos al futuro, resetear scores |
| `--deactivate` | Sí* | Mover partidos al pasado, poner scores dummy |
| `--force` | No | Saltar confirmación interactiva |
| `--help` | No | Muestra información de uso |

*Usar `--activate` o `--deactivate`, no ambos.

> **Nota**: Esta operación usa transacciones — si algo falla, no quedan datos a medio actualizar. Se puede ejecutar múltiples veces sin problema.

---

<!-- Futuras secciones -->
<!-- - Crear Grupos -->
<!-- - Gestionar Usuarios -->
<!-- - Configurar Notificaciones -->
<!-- - Resolución de Predicciones Bonus -->
