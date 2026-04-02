# Módulo de Torneos — Plan de Testing Manual

> Pichichi v1 — Mundial 2026.
> Plataformas: iOS (Expo Go) + Android (Expo Go).
> Marcar cada test como PASS / FAIL / SKIP con fecha.

---

## Requisitos previos

- **Backend** corriendo: `docker compose up -d postgres && cd apps/api && pnpm dev`
- **Mobile** corriendo: `cd apps/mobile && EXPO_USE_EXPO_GO=true npx expo start -c --go`
- **Torneos importados**: `cd apps/api && npm run import-tournament -- --league 1 --season 2026` (ver `docs/GUIA-ADMIN.md`)
- **Dos cuentas de usuario** (Usuario A = admin de grupo, Usuario B = miembro de grupo)
- **Un grupo creado** con al menos un torneo asociado (para tests de integración grupo–torneo)
- Usuario A en **plan FREE** (default): 2 torneos/grupo

---

## 1. Pantalla de Lista de Torneos

### 1.1 Estado vacío

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 1.1.1 | Sin torneos en la DB — abrir pestaña Torneos | Muestra estado vacío: ícono de trofeo verde, "No hay torneos disponibles", "Los torneos aparecerán acá cuando estén disponibles. ¡Volvé pronto!" | |
| 1.1.2 | Pull-to-refresh en estado vacío | Muestra spinner verde, sigue en estado vacío si no hay torneos | |

### 1.2 Estado con torneos

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 1.2.1 | Con torneos seedeados — abrir pestaña Torneos | Muestra header "Torneos" con subtítulo "Competiciones disponibles" y lista de cards | |
| 1.2.2 | Card de torneo muestra info correcta | Cada card muestra: ícono de trofeo verde, nombre del torneo, tipo (ej: "Copa del Mundo"), estado, rango de fechas (ej: "11 Jun - 19 Jul 2026"), cantidad de equipos | |
| 1.2.3 | Tocar una card de torneo | Navega al detalle del torneo (por slug) | |
| 1.2.4 | Pull-to-refresh en la lista | Muestra spinner verde, refresca la lista desde el servidor | |
| 1.2.5 | Torneos ordenados por startDate ascendente | El torneo con fecha de inicio más próxima aparece primero | |

### 1.3 Traducciones de estado en la lista

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 1.3.1 | Torneo UPCOMING | Muestra "Próximamente" | |
| 1.3.2 | Torneo IN_PROGRESS | Muestra "En curso" | |
| 1.3.3 | Torneo FINISHED | Muestra "Finalizado" | |
| 1.3.4 | Torneo DRAFT | Muestra "Borrador" | |
| 1.3.5 | Torneo CANCELLED | Muestra "Cancelado" | |

### 1.4 Traducciones de tipo en la lista

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 1.4.1 | Tipo WORLD_CUP | Muestra "Copa del Mundo" | |
| 1.4.2 | Tipo COPA_AMERICA | Muestra "Copa América" | |
| 1.4.3 | Tipo EURO | Muestra "Eurocopa" | |
| 1.4.4 | Tipo CHAMPIONS_LEAGUE | Muestra "Champions League" | |
| 1.4.5 | Tipo CUSTOM | Muestra "Personalizado" | |

### 1.5 Formato de fechas en la card

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 1.5.1 | Rango de fechas del torneo | Formato "DD Mon - DD Mon YYYY" (ej: "11 Jun - 19 Jul 2026") | |
| 1.5.2 | Cantidad de equipos | Muestra "N equipos" (plural) o "1 equipo" (singular) | |

### 1.6 Estado de error

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 1.6.1 | La lista falla al cargar (ej: backend caído) | Muestra ícono ⚠, "Error al cargar torneos", "No se pudieron cargar los torneos. Deslizá hacia abajo para reintentar.", botón "Reintentar" | |
| 1.6.2 | Tocar botón "Reintentar" | Reintenta el fetch | |
| 1.6.3 | Pull-to-refresh en estado de error | Reintenta el fetch | |

---

## 2. Pantalla de Detalle de Torneo

### 2.1 Estado de carga

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 2.1.1 | Navegar al detalle del torneo | Muestra LoadingScreen mientras carga | |

### 2.2 Header del torneo

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 2.2.1 | Torneo cargado | Header con gradient muestra nombre del torneo como título y tipo como subtítulo (ej: "Copa del Mundo") | |
| 2.2.2 | Botón "← Volver" visible | Botón en el header, texto blanco semitransparente | |
| 2.2.3 | Tocar "← Volver" | Navega a la pantalla anterior | |

### 2.3 Tabs de fases

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 2.3.1 | Torneo con fases — tab bar visible | Muestra barra horizontal scrollable con pills de fase | |
| 2.3.2 | Tab "Próximos" siempre primero | Primer tab es "Próximos", seleccionado por defecto | |
| 2.3.3 | Tab activo muestra estilo correcto | Fondo verde (primary), texto blanco | |
| 2.3.4 | Tab inactivo muestra estilo correcto | Sin fondo, texto gris (secondary) | |
| 2.3.5 | Tabs del Mundial 2026 | "Próximos", "Grupos", "R32", "8vos", "4tos", "Semis", "3°/Final" | |
| 2.3.6 | Tab "3°/Final" combina dos fases | Un solo tab para THIRD_PLACE + FINAL (no dos tabs separados) | |
| 2.3.7 | Scroll horizontal de tabs | Si hay muchos tabs, la barra scrollea horizontalmente | |
| 2.3.8 | Tocar un tab cambia el contenido | El contenido debajo se actualiza según la fase seleccionada | |

### 2.4 Tab "Próximos"

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 2.4.1 | Con partidos SCHEDULED | Muestra lista de MatchCards agrupados por fecha, ordenados cronológicamente | |
| 2.4.2 | Section headers con formato español | "Miércoles 11 de Junio", "Jueves 12 de Junio", etc. | |
| 2.4.3 | MatchCard muestra showPhaseInfo | La info de fase/grupo se muestra en cada card | |
| 2.4.4 | Sin partidos SCHEDULED | Estado vacío: ícono de trofeo, "No hay partidos próximos", "Los próximos partidos aparecerán acá cuando estén programados." | |
| 2.4.5 | Pull-to-refresh | Refresca datos del torneo + partidos simultáneamente | |
| 2.4.6 | Loading de contenido | Muestra "Cargando partidos..." centrado | |

### 2.5 Tab "Grupos" (Fase de Grupos)

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 2.5.1 | Seleccionar tab "Grupos" | Muestra barra de sub-filtro con chips: "Todos", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L" | |
| 2.5.2 | Chip "Todos" seleccionado por defecto | "Todos" resaltado con fondo verde claro y texto verde | |
| 2.5.3 | Chip inactivo | Sin fondo, texto gris tenue | |
| 2.5.4 | Tocar chip "A" | Filtra partidos al Grupo A solamente | |
| 2.5.5 | Tocar chip "Todos" después de filtrar | Muestra todos los partidos de fase de grupos | |
| 2.5.6 | Grupo sin partidos (ej: "L" en un torneo de 8 grupos) | Estado vacío: "No hay partidos en el Grupo L." | |
| 2.5.7 | Sin partidos en fase de grupos | Estado vacío: "No hay partidos en la fase de grupos." | |
| 2.5.8 | MatchCard en fase de grupos | Muestra "Grupo X · Fase de Grupos" en la línea de info de fase | |
| 2.5.9 | Scroll horizontal de chips | La barra de sub-filtro scrollea horizontalmente | |
| 2.5.10 | Pull-to-refresh en fase de grupos | Refresca datos del torneo + partidos de grupo | |

### 2.6 Tabs de Knockout (R32, 8vos, 4tos, Semis)

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 2.6.1 | Seleccionar un tab de knockout (ej: "8vos") | Muestra partidos de esa fase agrupados por fecha | |
| 2.6.2 | MatchCard NO muestra showPhaseInfo | En tabs de knockout, la info de fase no se repite (ya está claro por el tab) | |
| 2.6.3 | Sin partidos en una fase de knockout | Estado vacío: "No hay partidos de Octavos" (o la fase correspondiente), "Los partidos aparecerán cuando se definan los cruces." | |
| 2.6.4 | Partidos con placeholder en vez de equipo | Si los cruces no están definidos, muestra texto en itálica con el placeholder (ej: "Ganador Grupo A") o "TBD" | |
| 2.6.5 | Pull-to-refresh en knockout | Refresca datos del torneo + partidos de la fase | |

### 2.7 Tab "3°/Final"

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 2.7.1 | Tab "3°/Final" seleccionado | Muestra partidos de THIRD_PLACE y FINAL combinados, agrupados por fecha | |
| 2.7.2 | MatchCard muestra showPhaseInfo | Sí, para distinguir "3er Puesto" de "Final" | |
| 2.7.3 | Sin partidos | Estado vacío: "No hay partidos de 3° Puesto / Final", "Los partidos aparecerán cuando se definan los cruces." | |
| 2.7.4 | Pull-to-refresh | Refresca datos de ambas fases (THIRD_PLACE + FINAL) | |

### 2.8 Estado de error del detalle

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 2.8.1 | Slug inexistente | Muestra header "Torneo" con "← Volver", mensaje "No se pudo cargar el torneo.", botón "Volver" | |
| 2.8.2 | Backend caído durante la carga | Mismo comportamiento que slug inexistente | |
| 2.8.3 | Tocar botón "Volver" en error | Navega hacia atrás | |

---

## 3. MatchCard — Estados Visuales

### 3.1 Estado SCHEDULED (Programado)

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 3.1.1 | Card de partido SCHEDULED | Muestra equipos con avatares (círculos con inicial del shortName), "vs" al centro, fecha/hora, venue | |
| 3.1.2 | Formato de fecha | "Mié 11 Jun · 16:00" (día abreviado, fecha, mes abreviado, separador ·, hora) | |
| 3.1.3 | Venue visible | Muestra venue + ciudad si están disponibles (ej: "Estadio Azteca, Ciudad de México") | |
| 3.1.4 | Indicador de predicción — sin predicción | Muestra "Sin predicción" en gris tenue | |
| 3.1.5 | Indicador de predicción — con predicción | Muestra "✓ Predicho" en verde | |
| 3.1.6 | Info de fase visible (cuando showPhaseInfo=true) | Muestra fase en uppercase con letter spacing (ej: "GRUPO A · FASE DE GRUPOS") | |

### 3.2 Estado LIVE (En vivo)

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 3.2.1 | Card de partido LIVE | Muestra badge "EN VIVO" con punto verde pulsante + texto verde bold | |
| 3.2.2 | Score visible | Muestra puntuación en números grandes (fontSize 22, bold), separados por dash | |
| 3.2.3 | Equipos con avatares | Ambos equipos con sus avatares y nombres | |
| 3.2.4 | Indicador de predicción visible | Sí, muestra "Sin predicción" o "✓ Predicho" | |

### 3.3 Estado FINISHED (Finalizado)

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 3.3.1 | Card de partido FINISHED | Muestra score final en números grandes, sin badge "EN VIVO" | |
| 3.3.2 | Partido con tiempo extra | Muestra "(ET)" debajo del score | |
| 3.3.3 | Partido con penales | Muestra "(X - Y pen.)" debajo del score, en vez de "(ET)" | |
| 3.3.4 | Sin indicador de predicción | Los partidos FINISHED no muestran "Sin predicción" ni "✓ Predicho" | |

### 3.4 Estado POSTPONED (Aplazado)

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 3.4.1 | Card de partido POSTPONED | Contenido con opacidad reducida (0.55) | |
| 3.4.2 | Badge de estado | Muestra badge "APLAZADO" en uppercase, fondo gris, en el centro (en vez de score o "vs") | |
| 3.4.3 | Sin indicador de predicción | No muestra indicador de predicción | |

### 3.5 Estado CANCELLED (Cancelado)

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 3.5.1 | Card de partido CANCELLED | Contenido con opacidad reducida (0.55) | |
| 3.5.2 | Badge de estado | Muestra badge "CANCELADO" en uppercase, fondo gris, en el centro | |
| 3.5.3 | Sin indicador de predicción | No muestra indicador de predicción | |

### 3.6 Placeholders de equipos

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 3.6.1 | Partido sin equipo definido (homeTeam = null) | Muestra el placeholder en itálica y color tenue (ej: "Ganador Grupo A") | |
| 3.6.2 | Ambos equipos sin definir (sin placeholder) | Muestra "TBD" en itálica para ambos lados | |
| 3.6.3 | Un equipo definido, otro no | Un lado con avatar + nombre normal, otro con placeholder en itálica | |

---

## 4. Sección "Mis Grupos"

### 4.1 Visibilidad

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 4.1.1 | Usuario autenticado con grupos en este torneo | Sección "Mis Grupos" visible entre el header y la tab bar | |
| 4.1.2 | Usuario autenticado sin grupos en este torneo | Sección "Mis Grupos" NO se renderiza | |
| 4.1.3 | Usuario no autenticado | Sección "Mis Grupos" NO se renderiza | |
| 4.1.4 | Sección cargando | No se renderiza mientras isLoading es true | |

### 4.2 Contenido

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 4.2.1 | Título de sección | "Mis Grupos" en bold | |
| 4.2.2 | Cards de grupo | Scroll horizontal, cada card muestra: ícono de personas, nombre del grupo (1 línea), cantidad de miembros, chevron ">" | |
| 4.2.3 | Card de grupo — texto de miembros | "N miembros" (plural) o "1 miembro" (singular) | |
| 4.2.4 | Varios grupos | Scroll horizontal sin indicador, gap entre cards | |
| 4.2.5 | Card con nombre largo | Se trunca a 1 línea (numberOfLines={1}) | |

### 4.3 Navegación desde "Mis Grupos"

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 4.3.1 | Tocar una card de grupo | Navega a `/(tabs)/tournaments/group/[id]` — detalle de grupo dentro del stack de Torneos | |
| 4.3.2 | Botón "← Volver" en el detalle del grupo | Vuelve al detalle del torneo (NO al tab de Grupos) | |
| 4.3.3 | Funcionalidad completa del grupo | El detalle de grupo re-exportado funciona igual que en el tab Grupos (miembros, torneos, acciones) | |

---

## 5. Navegación Dual-Stack

### 5.1 Torneos → Grupo (stack de Torneos)

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 5.1.1 | Torneo detail → "Mis Grupos" → tocar grupo | Navega al detalle del grupo dentro del stack de Torneos | |
| 5.1.2 | Botón "← Volver" | Vuelve al detalle del torneo | |
| 5.1.3 | Múltiples niveles de navegación | tournaments/index → tournaments/[slug] → tournaments/group/[id] — cada "Volver" retrocede un nivel | |

### 5.2 Grupos → Torneo (stack de Grupos)

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 5.2.1 | Detalle de grupo → tocar card de torneo | Navega a `/(tabs)/groups/tournament/[slug]` — detalle del torneo dentro del stack de Grupos | |
| 5.2.2 | Botón "← Volver" | Vuelve al detalle del grupo (NO al tab de Torneos) | |
| 5.2.3 | Funcionalidad completa del torneo | Tabs, filtros, MatchCards funcionan igual que en el tab Torneos | |

### 5.3 Tab bar — stack reset (popToTop)

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 5.3.1 | En tournaments/[slug] → tocar tab Torneos | Vuelve a tournaments/index (popToTop) | |
| 5.3.2 | En tournaments/group/[id] → tocar tab Torneos | Vuelve a tournaments/index (popToTop) | |
| 5.3.3 | En groups/tournament/[slug] → tocar tab Grupos | Vuelve a groups/index (popToTop) | |
| 5.3.4 | En tournaments/index (raíz) → tocar tab Torneos | No pasa nada (ya está en la raíz) | |
| 5.3.5 | Tocar otro tab (ej: Inicio) mientras estás en un detalle | Cambia al otro tab. Al volver al tab Torneos, se mantiene el stack anterior | |

---

## 6. Agregar Torneo a Grupo

### 6.1 Desde CreateGroupModal (creación de grupo)

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 6.1.1 | Modal de crear grupo muestra sección "Torneos" | Muestra lista de torneos disponibles con selección múltiple, contador "(N de M seleccionados)" | |
| 6.1.2 | Tocar un torneo | Toggle de selección visual (ícono + check verde) | |
| 6.1.3 | Cada torneo muestra tipo y estado | "Copa del Mundo · Próximamente" | |
| 6.1.4 | Crear grupo con torneos seleccionados | Grupo se crea, torneos se agregan secuencialmente. Si un torneo falla al agregarse, no bloquea la navegación | |
| 6.1.5 | Crear grupo sin seleccionar torneos | Grupo se crea sin torneos. Se pueden agregar después | |

### 6.2 Desde AddTournamentModal (grupo existente, solo admin)

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 6.2.1 | Admin toca "Agregar torneo" en detalle de grupo | Modal se abre con lista de torneos NO asociados al grupo | |
| 6.2.2 | Torneos ya asociados filtrados | Solo muestra torneos que no están en el grupo | |
| 6.2.3 | Cada torneo muestra tipo y estado | "Copa del Mundo · Próximamente" | |
| 6.2.4 | Tocar "Agregar" en un torneo | Torneo se agrega al grupo. Alert "Listo" — "Torneo agregado al grupo." Modal se cierra | |
| 6.2.5 | Todos los torneos ya están en el grupo | Estado vacío: ícono de trofeo tenue, "No hay torneos disponibles", "Todos los torneos ya están agregados a este grupo." | |
| 6.2.6 | Botón "Cancelar" | Modal se cierra, no pasa nada | |

### 6.3 Límites de plan al agregar torneo

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 6.3.1 | Grupo tiene 2 torneos (límite FREE) — intentar agregar otro | Alert "Límite alcanzado" con mensaje del plan (403) | |
| 6.3.2 | Backend caído durante la adición | Alert "Error" — "No se pudo agregar el torneo. Intentá de nuevo." | |

---

## 7. Eliminar Torneo de Grupo (Solo Admin)

### 7.1 Visibilidad del botón

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 7.1.1 | Admin ve torneo UPCOMING sin predicciones | Botón ⊗ (close-circle rojo) visible en la card del torneo | |
| 7.1.2 | Admin ve torneo DRAFT | Botón ⊗ visible | |
| 7.1.3 | Admin ve torneo IN_PROGRESS | Botón ⊗ NO visible (oculto) | |
| 7.1.4 | Admin ve torneo FINISHED | Botón ⊗ NO visible (oculto) | |
| 7.1.5 | Miembro regular ve cualquier torneo | Botón ⊗ NO visible (nunca, independientemente del estado) | |

### 7.2 Flujo de check-remove (pre-flight)

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 7.2.1 | Admin toca ⊗ en torneo UPCOMING sin predicciones | checkRemoveTournament devuelve canRemove:true, predictionsCount:0. Alert: "Eliminar torneo" — "¿Eliminar [nombre] del grupo?" con "Cancelar" + "Eliminar" | |
| 7.2.2 | Admin toca ⊗ en torneo UPCOMING con predicciones | checkRemoveTournament devuelve canRemove:true, predictionsCount:N. Alert: "Eliminar torneo" — "Se borrarán N predicciones. ¿Estás seguro?" con "Cancelar" + "Eliminar" | |
| 7.2.3 | Admin toca ⊗ pero el torneo cambió a IN_PROGRESS entre la UI y el check | checkRemoveTournament devuelve canRemove:false. Alert: "No se puede eliminar" — "El torneo está en curso o finalizado." | |
| 7.2.4 | Error durante el check (backend caído) | Alert: "Error" — "No se pudo verificar el estado del torneo." | |
| 7.2.5 | Tocar "Cancelar" en la confirmación | Alert se cierra, no pasa nada | |

### 7.3 Eliminación exitosa

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 7.3.1 | Confirmar eliminación de torneo sin predicciones | Torneo desaparece de la sección de torneos del grupo | |
| 7.3.2 | Confirmar eliminación de torneo con predicciones | Torneo desaparece. Predicciones y bonus predictions borradas en el backend | |
| 7.3.3 | Lista de torneos se actualiza | Cache de torneos del grupo se invalida y refresca | |

### 7.4 Errores de eliminación

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 7.4.1 | Backend caído durante la eliminación | Alert: "Error" — "No se pudo eliminar el torneo. Intentá de nuevo." | |
| 7.4.2 | Torneo ya eliminado (condición de carrera) | Error del backend (404) mostrado como alert | |
| 7.4.3 | Mutation pendiente — tocar ⊗ otra vez | Guard `isPending` previene doble request | |

---

## 8. Torneos en el Detalle de Grupo

### 8.1 Sección de torneos

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 8.1.1 | Grupo sin torneos | Card con ícono de trofeo tenue + "No hay torneos asociados" | |
| 8.1.2 | Grupo con torneos | Cards de torneo con: ícono de trofeo verde, nombre, badge de tipo, estado | |
| 8.1.3 | Traducciones de estado en la card | IN_PROGRESS → "En curso", UPCOMING → "Próximamente", FINISHED → "Finalizado" | |
| 8.1.4 | Formato de tipo en la card | Underscores reemplazados con espacios (ej: "COPA_AMERICA" → "COPA AMERICA") | |
| 8.1.5 | Tocar card de torneo | Navega a `/(tabs)/groups/tournament/[slug]` (dual-stack) | |
| 8.1.6 | Botón "Agregar torneo" visible para admin | Solo visible para admin debajo de la lista de torneos | |
| 8.1.7 | Botón "Agregar torneo" NO visible para miembro | No visible para miembros regulares | |

---

## 9. Agrupación de Partidos por Fecha

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 9.1 | Partidos del mismo día agrupados | Todos los partidos del mismo día calendario aparecen bajo un solo section header | |
| 9.2 | Formato del section header | "Miércoles 11 de Junio" (día completo en español + fecha + "de" + mes completo) | |
| 9.3 | Secciones ordenadas cronológicamente | Fechas más tempranas primero | |
| 9.4 | Partidos dentro de una sección ordenados | Por hora de scheduledAt ascendente, luego por matchNumber | |
| 9.5 | Sticky headers desactivados | Los section headers NO se quedan pegados al hacer scroll (stickySectionHeadersEnabled=false) | |

---

## 10. Datos en Tiempo Real (Partidos en vivo)

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 10.1 | Partido pasa de SCHEDULED a LIVE | Badge "EN VIVO" aparece al refrescar. Score visible | |
| 10.2 | Score se actualiza durante LIVE | Al refrescar, el score se actualiza (real-time via Socket.IO o pull-to-refresh) | |
| 10.3 | Partido pasa de LIVE a FINISHED | Badge "EN VIVO" desaparece. Score final se muestra | |
| 10.4 | useLiveMatches refetch interval | Los partidos LIVE se refetchean cada 30 segundos automáticamente | |

---

## 11. Smart Retry y Manejo de Errores

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 11.1 | Navegar a un slug inexistente de torneo | Sin intentos de retry. Error mostrado inmediatamente | |
| 11.2 | Forzar una respuesta 500 (crash del backend) | Reintenta hasta 3 veces con backoff exponencial | |
| 11.3 | Red desconectada durante un fetch | Reintenta cuando se restaura la conexión | |
| 11.4 | Error 400 (parámetros inválidos) | Sin intentos de retry. Error inmediato | |

---

## 12. Consistencia de Cache

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 12.1 | Agregar torneo a grupo → volver al detalle | Torneo aparece en la sección de torneos | |
| 12.2 | Eliminar torneo de grupo → sección se actualiza | Torneo desaparece de la sección | |
| 12.3 | Cambiar de tab y volver | Datos del torneo se mantienen en cache (no recarga innecesaria) | |
| 12.4 | Pull-to-refresh en detalle del torneo | Refresca datos del torneo + partidos del tab activo + "Mis Grupos" | |
| 12.5 | Navegar al mismo torneo desde dos contextos | Mismos datos de cache (query key basada en slug) | |

---

## 13. Casos Borde

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 13.1 | Torneo sin fases definidas | Tab bar no se renderiza. Sin crash | |
| 13.2 | Torneo sin partidos en ninguna fase | Cada tab muestra su respectivo estado vacío | |
| 13.3 | Partido con venue pero sin city | Muestra solo el venue (sin coma trailing) | |
| 13.4 | Partido sin venue ni city | No muestra línea de venue | |
| 13.5 | Partido con isExtraTime=true y penales | Muestra penales ("(X - Y pen.)"), NO muestra "(ET)" | |
| 13.6 | Partido con isExtraTime=true sin penales | Muestra "(ET)" debajo del score | |
| 13.7 | Nombre de equipo muy largo | Se trunca a 1 línea (flexShrink: 1) | |
| 13.8 | Torneo con solo THIRD_PLACE (sin FINAL) | Tab "3°/Final" se agrega igual, muestra solo los partidos de THIRD_PLACE | |
| 13.9 | Tab "3°/Final" — ambas fases vacías | Estado vacío del tab combinado | |
| 13.10 | Rapid tab switching | Sin crash ni estado inconsistente. Cada tab carga sus propios datos | |
| 13.11 | Abrir torneo, ir a grupo, volver al torneo | El tab seleccionado se mantiene (state local del componente) | |
| 13.12 | "Mis Grupos" con muchos grupos | Scroll horizontal fluido, cards con minWidth 160 y maxWidth 220 | |

---

## 14. Contexto Neutral vs Interactivo

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 14.1 | Ver torneo desde tab Torneos | Contexto neutral: muestra fixture y resultados. No muestra predicciones del usuario | |
| 14.2 | "Mis Grupos" como puente al contexto interactivo | Las cards de "Mis Grupos" llevan al grupo (donde se ven predicciones y leaderboard) | |
| 14.3 | Ver torneo desde tab Grupos (vía card de torneo) | Mismo componente de detalle de torneo, pero en el stack de Grupos | |

---

## 15. Discrepancias Conocidas (para tener en cuenta)

| # | Item | Detalle |
|---|------|---------|
| 15.1 | Endpoints de CRUD de torneo no expuestos en mobile | POST/PATCH/DELETE de torneos existen en el backend pero NO hay UI en la app. Los torneos vienen de seeds o automatización |
| 15.2 | Filtros de API no expuestos en la UI de lista | El backend soporta filtros `status` y `type` en GET /tournaments, pero la lista mobile no tiene UI de filtrado |
| 15.3 | Endpoint público (sin auth) para listar torneos y partidos | GET /tournaments, GET /tournaments/:slug, GET /matches no requieren autenticación. Solo las mutaciones (create, update, delete, score) la requieren |
| 15.4 | `CANCELLED` en torneos vs en partidos | Ambos modelos (Tournament y Match) tienen status CANCELLED con significados similares pero independientes. Un torneo cancelado puede tener partidos no cancelados (edge case teórico) |
| 15.5 | Tab labels difieren de PHASE_LABELS | Tab bar usa labels cortos (ej: "8vos", "4tos"), mientras que MatchCard y match-helpers usan labels completos (ej: "Octavos", "Cuartos") |
| 15.6 | checkRemoveTournament también bloquea CANCELLED | El backend bloquea eliminación de torneos CANCELLED además de IN_PROGRESS/FINISHED, pero la UI solo oculta el botón para IN_PROGRESS/FINISHED. Un torneo CANCELLED mostraría el botón pero el check devolvería canRemove:false |
| 15.7 | Tipo de torneo en grupo muestra raw value | En la sección de torneos del grupo, el tipo muestra underscores reemplazados por espacios ("COPA AMERICA") en vez del label traducido ("Copa América") como en la lista de torneos |

---

## Resumen

| Sección | Tests | Prioridad |
|---------|:-----:|-----------|
| 1. Lista de Torneos | 18 | ALTA |
| 2. Detalle de Torneo | 28 | ALTA |
| 3. MatchCard — Estados | 18 | ALTA |
| 4. "Mis Grupos" | 9 | MEDIA |
| 5. Navegación Dual-Stack | 8 | ALTA |
| 6. Agregar Torneo a Grupo | 10 | MEDIA |
| 7. Eliminar Torneo de Grupo | 12 | ALTA |
| 8. Torneos en Detalle de Grupo | 7 | MEDIA |
| 9. Agrupación por Fecha | 5 | MEDIA |
| 10. Tiempo Real | 4 | ALTA |
| 11. Smart Retry | 4 | MEDIA |
| 12. Consistencia de Cache | 5 | ALTA |
| 13. Casos Borde | 12 | MEDIA |
| 14. Contexto Neutral vs Interactivo | 3 | BAJA |
| 15. Discrepancias Conocidas | 7 | INFO |
| **TOTAL** | **150** | |
