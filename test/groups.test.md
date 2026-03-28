# Módulo de Grupos — Plan de Testing Manual

> Pichichi v1 — Mundial 2026.
> Plataformas: iOS (Expo Go) + Android (Expo Go).
> Marcar cada test como PASS / FAIL / SKIP con fecha.

---

## Requisitos previos

- **Backend** corriendo: `docker compose up -d postgres && cd apps/api && pnpm dev`
- **Mobile** corriendo: `cd apps/mobile && EXPO_USE_EXPO_GO=true npx expo start -c --go`
- **Dos dispositivos** (o dispositivo + simulador) para los tests cross-device
- **Dos cuentas de usuario** (Usuario A = admin, Usuario B = miembro)
- Usuario A en **plan FREE** (default): 3 grupos creados, 5 membresías, máx 10 miembros/grupo, 2 torneos/grupo

---

## 1. Pantalla de Lista de Grupos

### 1.1 Estado vacío

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 1.1.1 | Usuario nuevo abre la pestaña de grupos | Muestra estado vacío: ícono de grupo, "No tenés grupos todavía", "Creá un grupo para jugar con amigos o unite con un código de invitación" | |
| 1.1.2 | Tocar "Crear grupo" en el estado vacío | Abre modal de crear grupo | |
| 1.1.3 | Tocar "¿Tenés un código? Unirme" en el estado vacío | Abre modal de unirse a grupo | |
| 1.1.4 | Pull-to-refresh en estado vacío | Muestra spinner, sigue en estado vacío si no hay grupos | |

### 1.2 Estado con grupos

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 1.2.1 | Usuario con 1+ grupos abre la pestaña | Muestra lista de cards con nombre, preview de descripción, cantidad de miembros | |
| 1.2.2 | Tocar una card de grupo | Navega al detalle del grupo | |
| 1.2.3 | Pull-to-refresh en la lista | Muestra spinner, refresca la lista desde el servidor | |
| 1.2.4 | Tocar botón "+" en el header | Abre modal de crear grupo | |
| 1.2.5 | Tocar botón "#" en el header | Abre modal de unirse a grupo | |

### 1.3 Límites de plan en la lista

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 1.3.1 | Usuario creó 3 grupos (límite FREE) — tocar "+" | Muestra alert "Límite alcanzado" con mensaje del plan. Botón "+" aparece dimmed | |
| 1.3.2 | Usuario es miembro de 5 grupos (límite FREE) pero creó solo 1 — tocar "+" | "+" NO está dimmed, puede crear más (el límite de membresías es separado del de creación) | |

### 1.4 Estado de error

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 1.4.1 | La lista falla al cargar (ej: backend caído) | Muestra ícono de warning, "Error al cargar grupos", "Deslizá hacia abajo para reintentar", y botón "Reintentar" | |
| 1.4.2 | Tocar botón "Reintentar" | Reintenta el fetch | |
| 1.4.3 | Pull-to-refresh en estado de error | Reintenta el fetch | |

---

## 2. Crear Grupo

### 2.1 UI del Modal

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 2.1.1 | Abrir modal de crear grupo | Muestra campos: Nombre (obligatorio), Descripción (opcional), Stepper de máx miembros. Input de nombre tiene foco | |
| 2.1.2 | Campo nombre — escribir 100+ caracteres | Se detiene en 100 caracteres. Contador muestra "100/100" | |
| 2.1.3 | Campo descripción — escribir 500+ caracteres | Se detiene en 500 caracteres. Contador muestra "500/500" | |
| 2.1.4 | Stepper de máx miembros — valor inicial | Muestra el límite del plan como máximo (10 para FREE). Valor default visible | |
| 2.1.5 | Stepper de máx miembros — tocar por debajo de 2 | No puede bajar de 2 | |
| 2.1.6 | Stepper de máx miembros — tocar por encima del límite | No puede superar el límite del plan (10 para FREE) | |
| 2.1.7 | Enviar con nombre vacío | Botón de enviar deshabilitado o muestra error de validación | |
| 2.1.8 | Enviar con nombre = solo espacios | Se trimea → tratado como vacío → bloqueado | |

### 2.2 Creación exitosa

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 2.2.1 | Llenar nombre + enviar | Modal se cierra, navega al detalle del nuevo grupo, grupo aparece en la lista | |
| 2.2.2 | Llenar nombre + descripción + maxMembers + enviar | Igual que arriba, todos los campos guardados correctamente | |
| 2.2.3 | Verificar que se generó código de invitación | El detalle del grupo muestra código de 8 caracteres (vista admin) | |
| 2.2.4 | Creador aparece como ADMIN en la lista de miembros | Sección de miembros muestra al creador con badge "Admin" | |
| 2.2.5 | Volver a la lista de grupos | Nuevo grupo aparece al tope de la lista | |

### 2.3 Errores de creación

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 2.3.1 | Crear 4to grupo en plan FREE | Alert "Límite alcanzado" con mensaje del backend | |
| 2.3.2 | Backend caído durante la creación | Alert "No se pudo crear el grupo. Intentá de nuevo." | |

---

## 3. Unirse a Grupo

### 3.1 UI del Modal

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 3.1.1 | Abrir modal de unirse | Muestra input de código (8 chars), placeholder "ABCD1234", ayuda "8 caracteres, letras y números" | |
| 3.1.2 | Escribir letras minúsculas | Se convierten automáticamente a mayúsculas | |
| 3.1.3 | Escribir espacios | Se eliminan automáticamente | |
| 3.1.4 | Escribir más de 8 caracteres | Se detiene en 8 | |
| 3.1.5 | Enviar con código vacío | Botón de enviar deshabilitado | |

### 3.2 Unión exitosa

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 3.2.1 | Ingresar código válido + enviar | Modal se cierra, navega al detalle del grupo, usuario aparece como "Miembro" | |
| 3.2.2 | Volver a la lista de grupos | Grupo unido aparece al tope de la lista | |
| 3.2.3 | Verificar que el usuario unido NO ve el código de invitación | Card de código de invitación NO visible (solo para admin) | |

### 3.3 Errores al unirse

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 3.3.1 | Ingresar código inválido (inexistente) | Alert "Código inválido" + "Verificá que esté bien escrito" | |
| 3.3.2 | Ingresar código de un grupo donde ya estás | Alert "Ya sos miembro" | |
| 3.3.3 | Ingresar código de un grupo lleno (maxMembers alcanzado) | Alert "Grupo lleno" | |
| 3.3.4 | Usuario tiene 5 membresías (límite FREE) — intentar unirse a otro | Error sobre límite de membresías (403) | |
| 3.3.5 | Ingresar código de un grupo archivado (inactivo) | Alert "Código inválido" (grupos inactivos se filtran) | |

### 3.4 Re-unión después de salir

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 3.4.1 | Usuario A sale del grupo, después se re-une con código | Membresía reactivada. Rol es MIEMBRO (incluso si antes era ADMIN) | |

---

## 4. Pantalla de Detalle de Grupo

### 4.1 Estado de carga

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 4.1.1 | Navegar al detalle del grupo | Muestra LoadingScreen mientras carga | |

### 4.2 Info del grupo (vista Admin)

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 4.2.1 | Admin abre el detalle | Muestra: card de código de invitación, card de info, sección de miembros, sección de torneos | |
| 4.2.2 | Info del grupo muestra cantidad de miembros | "Miembros: N / maxMembers" | |
| 4.2.3 | Botón "Editar" visible | Solo visible para admin | |
| 4.2.4 | Botón "Eliminar grupo" visible | Solo visible para admin, estilo destructivo | |
| 4.2.5 | Botón "Salir del grupo" visible | Visible para todos los miembros | |

### 4.3 Info del grupo (vista Miembro)

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 4.3.1 | Miembro regular abre el detalle | No hay card de código, no hay botón "Editar", no hay botón "Eliminar grupo" | |
| 4.3.2 | Botón "Salir del grupo" visible | Sí, visible para miembros | |
| 4.3.3 | Cantidad de miembros visible | Sí | |

### 4.4 Pull-to-Refresh

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 4.4.1 | Tirar hacia abajo en el detalle | Refresca datos del grupo + miembros + torneos simultáneamente | |
| 4.4.2 | Spinner durante el refresh | Usa el color verde primario | |

---

## 5. Código de Invitación (Solo Admin)

### 5.1 Visualización

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 5.1.1 | Admin ve la card del código | Muestra código de 8 chars en fuente monospace verde grande, con área tappable de fondo verde claro | |
| 5.1.2 | Texto de ayuda visible debajo del código | "Tocá para copiar" en gris tenue | |

### 5.2 Copiar al portapapeles

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 5.2.1 | Tocar el área del código | Código copiado al portapapeles. La ayuda cambia a "¡Copiado!" en verde bold | |
| 5.2.2 | Esperar 2 segundos después de copiar | La ayuda vuelve a "Tocá para copiar" | |
| 5.2.3 | Pegar el código copiado en otra app (Notas) | El texto pegado coincide exactamente con el código de 8 caracteres | |
| 5.2.4 | Tocar el código múltiples veces rápidamente | Cada toque copia, el timer del hint se reinicia. Sin crashes ni estados duplicados | |

### 5.3 Compartir

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 5.3.1 | Tocar botón "Compartir" | Abre share sheet nativo con mensaje: "Unite a mi grupo "[nombre]" en Pichichi! Código: [CÓDIGO]" | |
| 5.3.2 | Cancelar el share sheet | Vuelve al detalle del grupo, sin errores | |
| 5.3.3 | Compartir por una app específica (WhatsApp, Mensajes, etc.) | Mensaje enviado correctamente con el código de invitación | |

---

## 6. Editar Grupo (Solo Admin)

### 6.1 UI del Modal

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 6.1.1 | Tocar "Editar" | Modal abre pre-populado con nombre, descripción y maxMembers actuales | |
| 6.1.2 | Campo nombre muestra valor actual | Correcto | |
| 6.1.3 | Campo descripción muestra valor actual | Correcto (o vacío si no tiene) | |
| 6.1.4 | Stepper de máx miembros muestra valor actual | Correcto | |
| 6.1.5 | Stepper mínimo de máx miembros | No puede bajar del número actual de miembros (si hay 4 miembros, mín es 4, no 2) | |
| 6.1.6 | Stepper máximo de máx miembros | No puede superar el límite del plan (10 para FREE) | |

### 6.2 Edición exitosa

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 6.2.1 | Cambiar solo el nombre + enviar | Modal se cierra, detalle se actualiza con nuevo nombre | |
| 6.2.2 | Cambiar solo la descripción + enviar | Modal se cierra, descripción actualizada | |
| 6.2.3 | Cambiar solo maxMembers + enviar | Modal se cierra, display de cantidad de miembros se actualiza | |
| 6.2.4 | No cambiar nada + enviar | Modal se cierra silenciosamente (no hace llamada a la API) | |
| 6.2.5 | Cambiar todos los campos + enviar | Todos los campos actualizados correctamente | |
| 6.2.6 | Volver a la lista de grupos | Nombre/descripción actualizados reflejados en la card | |

### 6.3 Errores de edición

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 6.3.1 | Intentar setear maxMembers por debajo de los miembros actuales | Backend devuelve error: "No podés establecer el máximo en N porque el grupo ya tiene M miembros activos" | |
| 6.3.2 | Backend caído durante la edición | Alert "No se pudo actualizar el grupo. Intentá de nuevo." | |

---

## 7. Eliminar Grupo (Solo Admin)

### 7.1 Flujo de confirmación

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 7.1.1 | Admin es único miembro — tocar "Eliminar grupo" | Alert: "Si el grupo tiene predicciones será archivado, si no será eliminado permanentemente. ¿Estás seguro?" con "Cancelar" + "Eliminar" | |
| 7.1.2 | Admin con 3 miembros más — tocar "Eliminar grupo" | Alert: "Este grupo tiene 3 miembros más. Si lo eliminás, todos los miembros serán removidos. ¿Estás seguro?" | |
| 7.1.3 | Tocar "Cancelar" | Alert se cierra, no pasa nada | |

### 7.2 Eliminación exitosa

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 7.2.1 | Confirmar eliminar grupo SIN predicciones | Grupo borrado (hard delete). Navega a lista de grupos. Grupo ya no está en la lista | |
| 7.2.2 | Confirmar eliminar grupo CON predicciones | Grupo archivado (soft delete). Navega a lista de grupos. Grupo ya no visible | |
| 7.2.3 | Sin flash verde de error durante la navegación | Se muestra LoadingScreen durante la transición (isGroupRemoved = true) | |
| 7.2.4 | Sin errores 404 en consola después de eliminar | No hay intentos de refetch para el grupo eliminado | |

### 7.3 Manejo de errores al eliminar

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 7.3.1 | Backend caído durante la eliminación | Alert con mensaje de error, se queda en el detalle del grupo | |
| 7.3.2 | Grupo ya fue eliminado por otro admin (condición de carrera) | Alert "Grupo no disponible" — "Este grupo fue eliminado o ya no tenés acceso." → navega a la lista | |

---

## 8. Salir del Grupo

### 8.1 Miembro regular saliendo

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 8.1.1 | Miembro regular toca "Salir del grupo" | Alert: "¿Estás seguro de que querés salir de este grupo?" con "Cancelar" + "Salir" | |
| 8.1.2 | Confirmar salir | Navega a lista de grupos. Grupo ya no está en la lista | |
| 8.1.3 | Tocar "Cancelar" | Alert se cierra, no pasa nada | |
| 8.1.4 | Sin flash verde de error durante la navegación | Se muestra LoadingScreen durante la transición | |

### 8.2 Admin saliendo (hay otros miembros)

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 8.2.1 | Admin toca "Salir del grupo" (hay otros miembros) | Alert: "Sos administrador de este grupo. Si te vas, se asignará otro admin automáticamente. ¿Estás seguro?" | |
| 8.2.2 | Confirmar salir | Navega a lista de grupos. Otro miembro auto-promovido a admin (el más antiguo por joinedAt) | |
| 8.2.3 | Verificar nuevo admin — loguearse como el usuario promovido | Usuario ahora ve código de invitación, botón editar, botón eliminar en el detalle | |

### 8.3 Último miembro saliendo

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 8.3.1 | Último miembro toca "Salir del grupo" | Alert: "Sos el último miembro del grupo. Si te vas, el grupo se eliminará. ¿Estás seguro?" | |
| 8.3.2 | Confirmar salir (grupo SIN predicciones) | Grupo borrado (hard delete). Navega a lista de grupos | |
| 8.3.3 | Confirmar salir (grupo CON predicciones) | Grupo archivado. Navega a lista de grupos | |

### 8.4 Manejo de errores al salir

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 8.4.1 | Backend caído al intentar salir | Alert con mensaje de error, se queda en el detalle | |
| 8.4.2 | Grupo ya eliminado mientras intentás salir | Alert "Grupo no disponible" → navega a la lista | |

---

## 9. Expulsar Miembro (Solo Admin)

### 9.1 UI

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 9.1.1 | Admin ve la lista de miembros | Cards de otros miembros son tappables. La card del propio admin NO es tappable | |
| 9.1.2 | Miembro no-admin ve la lista de miembros | Ninguna card es tappable (no hay acción de expulsar) | |

### 9.2 Flujo de expulsión

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 9.2.1 | Admin toca la card de un miembro | Alert con el nombre del miembro: "¿Querés expulsar a este miembro del grupo?" con "Cancelar" + "Expulsar" | |
| 9.2.2 | Confirmar expulsión | Alert "Listo" — "[nombre] fue expulsado del grupo." Miembro desaparece de la lista, cantidad disminuye | |
| 9.2.3 | Tocar "Cancelar" | Alert se cierra, no pasa nada | |

### 9.3 Errores al expulsar

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 9.3.1 | Backend caído durante la expulsión | Alert "No se pudo expulsar al miembro. Intentá de nuevo." | |
| 9.3.2 | Intentar expulsarse a sí mismo vía API (bypaseando la UI) | Backend devuelve 400: "Cannot remove yourself. Use the leave endpoint instead" | |

---

## 10. Visualización de Lista de Miembros

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 10.1 | Lista muestra todos los miembros activos | Cada miembro muestra: círculo avatar (primera letra), nombre, @username, badge de rol | |
| 10.2 | Usuario actual tiene sufijo "(Vos)" | Nombre muestra "Juan (Vos)" | |
| 10.3 | Badge de admin se muestra correctamente | Fondo verde, texto "Admin" | |
| 10.4 | Badge de miembro se muestra correctamente | Fondo gris, texto "Miembro" | |
| 10.5 | Miembros ordenados correctamente | Admins primero, después por fecha de ingreso ascendente | |
| 10.6 | Título de sección muestra cantidad | "Miembros (N)" coincide con la cantidad real | |

---

## 11. Sección de Torneos

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 11.1 | Grupo sin torneos | Muestra estado vacío: ícono de trofeo tenue + "No hay torneos asociados" | |
| 11.2 | Grupo con torneos | Muestra cards de torneo con: ícono de trofeo, nombre, badge de tipo, estado | |
| 11.3 | Traducciones de estado | IN_PROGRESS → "En curso", UPCOMING → "Próximamente", FINISHED → "Finalizado" | |
| 11.4 | Visualización de tipo de torneo | Underscores reemplazados con espacios (ej: "COPA_AMERICA" → "COPA AMERICA") | |

---

## 12. Escenarios Cross-Device

> Requiere dos dispositivos/sesiones: Usuario A (admin) y Usuario B (miembro).

### 12.1 Grupo eliminado mientras el miembro lo está viendo

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 12.1.1 | Usuario B tiene el detalle abierto. Usuario A elimina el grupo. Usuario B hace pull-to-refresh | Alert "Grupo no disponible" — "Este grupo fue eliminado o ya no tenés acceso." → navega a lista de grupos | |
| 12.1.2 | El alert se dispara solo UNA vez | No hay alerts duplicados. El ref `hasNavigatedFor404` previene re-disparos | |
| 12.1.3 | La lista de grupos ya no muestra el grupo eliminado | Grupo removido del cache después de la invalidación | |

### 12.2 Miembro expulsado mientras está viendo el grupo

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 12.2.1 | Usuario B tiene el detalle abierto. Usuario A expulsa a B. Usuario B hace pull-to-refresh | Alert "Grupo no disponible" — "Ya no sos miembro de este grupo." → navega a lista de grupos | |

### 12.3 Miembro intenta salir de un grupo ya eliminado

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 12.3.1 | Usuario B toca "Salir" pero el grupo ya fue eliminado por Usuario A | Alert "Grupo no disponible" → navega a lista de grupos. Sin crash | |

### 12.4 Datos stale después de esperar

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 12.4.1 | Usuario B abre el detalle, bloquea el teléfono 5+ minutos (staleTime expira), desbloquea | Los datos se refetchean automáticamente. Si el grupo fue eliminado, el handler de 404 se activa | |

---

## 13. Smart Retry y Manejo de Errores

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 13.1 | Forzar una respuesta 404 (ej: navegar a un group ID inexistente) | Sin intentos de retry. Error mostrado inmediatamente | |
| 13.2 | Forzar una respuesta 403 (ej: acceder a un grupo del que no sos miembro) | Sin intentos de retry. Error mostrado inmediatamente | |
| 13.3 | Forzar una respuesta 500 (ej: crash del backend) | Reintenta hasta 3 veces con backoff exponencial | |
| 13.4 | Red desconectada durante un fetch | Reintenta cuando se restaura la conexión | |

---

## 14. Consistencia de Cache

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 14.1 | Crear grupo → volver a la lista | Nuevo grupo aparece al tope (update optimista) | |
| 14.2 | Unirse a grupo → volver a la lista | Grupo unido aparece al tope (update optimista) | |
| 14.3 | Editar nombre del grupo → volver a la lista | Nombre actualizado reflejado en la card | |
| 14.4 | Eliminar grupo → lista de grupos | Grupo eliminado removido de la lista | |
| 14.5 | Salir del grupo → lista de grupos | Grupo abandonado removido de la lista | |
| 14.6 | Expulsar miembro → lista de miembros | Miembro expulsado desaparece, cantidad disminuye | |

---

## 15. Casos Borde

| # | Test | Resultado esperado | Estado |
|---|------|--------------------|--------|
| 15.1 | Crear grupo con nombre de exactamente 100 chars | Funciona. Nombre completo mostrado (puede truncarse en la card de lista) | |
| 15.2 | Crear grupo con caracteres especiales en el nombre (emojis, acentos) | Funciona. Caracteres preservados | |
| 15.3 | Unirse al mismo grupo dos veces (condición de carrera — doble tap en enviar) | Primer request funciona, segundo da 409 "already a member". Solo un alert mostrado | |
| 15.4 | Eliminar grupo mientras un pull-to-refresh está en vuelo | Sin crash. LoadingScreen mostrada, navega limpiamente | |
| 15.5 | Salir del grupo mientras un pull-to-refresh está en vuelo | Sin crash. Igual que arriba | |
| 15.6 | Tap rápido en la confirmación de "Eliminar" | Solo un request de delete se dispara (guard de isPending) | |
| 15.7 | Tap rápido en la confirmación de "Salir" | Solo un request de leave se dispara (guard de isPending) | |
| 15.8 | Abrir detalle de grupo con UUID inválido en la URL | Backend devuelve 400 (ParseUUIDPipe). Estado de error mostrado | |
| 15.9 | Descripción de grupo muy larga (500 chars) en la vista de detalle | Texto se muestra correctamente, no se desborda | |
| 15.10 | Grupo con maxMembers = 2, ambos slots ocupados — tercer usuario intenta unirse | Error "Grupo lleno" | |

---

## 16. Discrepancias Conocidas (para tener en cuenta)

| # | Item | Detalle |
|---|------|---------|
| 16.1 | DTO de creación `@Max(100)` vs DTO de update `@Max(500)` para maxMembers | Creación limita a 100, update permite 500. Ambos capados por el plan en el service (10 FREE / 50 PREMIUM). No impacta al usuario pero vale la pena saberlo |
| 16.2 | Re-unirse después de salir = rol MIEMBRO | Incluso si antes eras ADMIN, re-unirte te pone como MIEMBRO. Es intencional |
| 16.3 | Admin puede expulsar a otros admins | No hay chequeo de rol sobre el target. Podría ser problemático si se agrega soporte multi-admin |
| 16.4 | `userPoints` siempre en 0 | Placeholder para el futuro leaderboard |
| 16.5 | Delete devuelve 200 (no 204) | Tiene body `{ action: 'deleted' \| 'archived' }`. La mobile no diferencia en la UI |

---

## Resumen

| Sección | Tests | Prioridad |
|---------|:-----:|-----------|
| 1. Lista de Grupos | 9 | ALTA |
| 2. Crear Grupo | 13 | ALTA |
| 3. Unirse a Grupo | 10 | ALTA |
| 4. Detalle de Grupo | 9 | ALTA |
| 5. Código de Invitación | 9 | ALTA |
| 6. Editar Grupo | 11 | MEDIA |
| 7. Eliminar Grupo | 7 | ALTA |
| 8. Salir del Grupo | 11 | ALTA |
| 9. Expulsar Miembro | 6 | MEDIA |
| 10. Lista de Miembros | 6 | MEDIA |
| 11. Torneos | 4 | BAJA |
| 12. Cross-Device | 4 | ALTA |
| 13. Smart Retry | 4 | MEDIA |
| 14. Consistencia de Cache | 6 | ALTA |
| 15. Casos Borde | 10 | MEDIA |
| 16. Discrepancias Conocidas | 5 | INFO |
| **TOTAL** | **124** | |
