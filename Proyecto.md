
# Documento en Markdown para Microsoft Fabric: Arquitectura y Plan de Implementación

## 1. Resumen de arquitectura y viabilidad
[cite_start]Aprovecharemos el **Microsoft Fabric Workload Development Kit (WDK)** para crear una carga de trabajo personalizada de "Documento Markdown"[cite: 1, 3]. [cite_start]Esta carga introduce un nuevo tipo de elemento (p. ej., *Markdown Document*) que aparece y se comporta como un artefacto nativo de Fabric dentro de los espacios de trabajo[cite: 4].

[cite_start]La extensibilidad de Fabric lo hace viable: podemos registrar una carga de trabajo con su propio frontend (UI) y lógica de backend, empaquetada como un NuGet y habilitada mediante el Fabric Workload Hub[cite: 5].

### Estructura de la carga de trabajo
[cite_start]El *Markdown Doc* consistirá en un servicio de backend (BE) y una UI de frontend (FE)[cite: 11]:

* **Backend (BE):** Gestiona la creación del elemento, el almacenamiento del contenido markdown y la recuperación de datos. [cite_start]Implementará endpoints CRUD (Crear, Obtener, Actualizar) que Fabric invoca durante las operaciones del elemento[cite: 12, 13]. [cite_start]Se ejecutará como servicio (vía DevGateway en desarrollo o hospedado en la nube)[cite: 14].
* **Frontend (FE):** Provee el editor/visor dentro del producto, ejecutándose en un iframe dentro de Fabric. [cite_start]Usará el SDK de Fabric (API cliente) para integrarse de forma transparente (tokens, UI, guardar)[cite: 15, 16].
* **Manifiestos:** Agregaremos un nuevo manifiesto de Item para el tipo "Markdown Document". [cite_start]Este asocia el elemento con nuestros endpoints y define sus propiedades (nombre, ícono, acciones)[cite: 19, 20].

---

## 2. Estrategia de almacenamiento y persistencia

[cite_start]Tras evaluar opciones, elegimos persistir el contenido markdown como **archivo en OneLake**, con caché mínima[cite: 23].

* **Datos en OneLake (Elegido):** Al crear el elemento, el backend creará un archivo `.md` en el almacenamiento OneLake asociado al espacio de trabajo. [cite_start]Esto asegura que los datos residan en el inquilino del cliente bajo la gobernanza de Fabric[cite: 25, 26].
* [cite_start]**Acceso:** El acceso usará la API de Azure Storage mediante un token *on-behalf-of* emitido para el usuario[cite: 29].
* [cite_start]**Carpeta/Integración:** Probablemente usemos una carpeta dedicada o un *Lakehouse* en el espacio llamado "MarkdownDocs Storage" para guardar cada documento[cite: 33, 34].
* **Opciones descartadas:**
    * [cite_start]*Metadatos del elemento:* Descartado porque actualizar texto grande en metadatos es engorroso y limitado[cite: 30, 31].
    * [cite_start]*Almacén externo:* Descartado para evitar configuraciones complejas de conectores y autenticación[cite: 40, 41].

---

## 3. Diseño de UI mínima (Crear, Editar, Ver)

[cite_start]Implementaremos un editor y visor web mínimos embebidos en el portal de Fabric[cite: 52].

### Flujo de creación
1.  [cite_start]**Nuevo elemento:** El usuario selecciona "Nuevo > Markdown Document" y proporciona un nombre[cite: 54, 56].
2.  [cite_start]**Registro:** Tras crear, Fabric registra el elemento y abre nuestro Editor Markdown[cite: 59].

### UI del Editor
* [cite_start]**Barra de acciones:** Botón "Guardar" y un alternador (toggle) entre "Editar" y "Vista previa"[cite: 63].
* [cite_start]**Modo Edición:** Un área de texto (*textarea*) simple para escribir Markdown (tipografía monoespaciada)[cite: 65].
* [cite_start]**Modo Vista Previa:** Renderiza el markdown a HTML en solo lectura usando una librería JS (ej. `markdown-it`)[cite: 67, 68].
* [cite_start]**Modo Solo Lectura:** Si un usuario tiene permisos de solo lectura (Viewer), la UI deshabilita el guardado y muestra solo el contenido renderizado[cite: 73, 74].

### Persistencia y Búsqueda
* [cite_start]**Guardado:** Al guardar, el FE llama al backend para sobrescribir el archivo en OneLake[cite: 76, 77].
* [cite_start]**Carga:** Al reabrir, el backend recupera el contenido actualizado desde OneLake[cite: 81].
* [cite_start]**Búsqueda:** El elemento será buscable por nombre y descripción en la barra de Fabric[cite: 84].

---

## 4. Comportamiento de permisos y seguridad

[cite_start]Nuestro elemento se adhiere al **RBAC estándar** de los espacios de trabajo[cite: 94]:

* **Roles del espacio:**
    * [cite_start]*Contributors/Admins:* Pueden crear, abrir y editar (permisos de escritura en OneLake)[cite: 97, 98].
    * [cite_start]*Viewers:* Pueden ver la existencia del elemento y abrirlo en modo lectura (si se concede acceso de lectura al item/OneLake)[cite: 99, 102].
* **Seguridad de datos:** Al usar OneLake, el archivo hereda los permisos del espacio/elemento. [cite_start]Solo usuarios con derechos apropiados pueden obtener un token para leer/escribir el archivo[cite: 110, 111].
* **Autenticación:** La solución utiliza Microsoft Entra ID. [cite_start]Requiere consentimiento inicial (Admin o usuario) para el alcance `Fabric.Extend`[cite: 125, 126].

---

## 5. Funciones aplazadas y riesgos

### Limitaciones en v1 (Aplazadas)
* **Integración con Git:** No soportada nativamente para elementos personalizados en vista previa. [cite_start]El contenido vive en OneLake y no se serializa al repo automáticamente[cite: 137, 140].
* **Colaboración en tiempo real:** No habrá co-autoría en vivo. [cite_start]"Last write wins" (el último en guardar sobrescribe)[cite: 165, 166].
* [cite_start]**Imágenes/Adjuntos:** No se implementará carga de archivos en la primera iteración (solo imágenes vía URL externa)[cite: 172, 173].

### Riesgos Principales y Mitigación
1.  **Inestabilidad del WDK:** Al estar en *preview*, puede haber cambios. [cite_start]*Mitigación:* Mantenerse actualizado con la documentación y probar en entornos no críticos[cite: 184, 185].
2.  **Pérdida de datos:** Sobrescritura accidental. [cite_start]*Mitigación:* Depender del versionado de archivos de OneLake (si está disponible) y advertir antes de eliminar[cite: 191, 193].
3.  **Concurrencia:** Dos editores guardando a la vez. [cite_start]*Mitigación:* Comprobar marca de tiempo (*Last Modified*) antes de guardar para evitar sobrescritura silenciosa[cite: 196, 198].

---

## 6. Plan de implementación (Paso a paso)

### Fase 1: Preparación del entorno
1.  [cite_start]Habilitar **Workload Development** en el tenant de Fabric (Developer Mode)[cite: 228].
2.  [cite_start]Registrar una aplicación en **Microsoft Entra ID** (Azure AD) y configurar `Redirect URI` y `App ID URI`[cite: 231, 232].
3.  [cite_start]Instalar prerrequisitos: .NET SDK y Node.js[cite: 235].
4.  [cite_start]Descargar el ejemplo del WDK de Microsoft como base[cite: 238].

### Fase 2: Andamiaje y Manifiestos
1.  [cite_start]Limpiar el ejemplo y renombrar la carga a `Org.MarkdownDoc`[cite: 240, 241].
2.  [cite_start]Configurar `WorkloadManifest.xml` con los datos de la app AAD[cite: 243].
3.  Crear `Item.xml` e `Item.json`:
    * Definir el tipo de elemento `MarkdownDoc`.
    * [cite_start]Asignar un ícono ($32 \times 32$) y definir acciones[cite: 247, 251].

### Fase 3: Desarrollo Frontend (FE)
1.  Implementar una SPA simple (React/JS).
2.  [cite_start]Crear el editor: `<textarea>` para edición y `markdown-it` para vista previa[cite: 258, 261].
3.  [cite_start]Integrar el SDK de Fabric para manejar llamadas `GetItem` y `Save`[cite: 257, 259].

### Fase 4: Desarrollo Backend (BE)
1.  [cite_start]Implementar `CreateItem`: Crear archivo `.md` vacío en OneLake (o Lakehouse designado)[cite: 267, 281].
2.  [cite_start]Implementar `GetItemPayload`: Leer el archivo desde OneLake y devolver texto al FE[cite: 268, 290].
3.  [cite_start]Implementar `UpdateItem`: Recibir texto y sobrescribir el archivo en OneLake[cite: 269, 293].
4.  [cite_start]Configurar autenticación OBO para Azure Storage[cite: 273].

### Fase 5: Ejecución y Pruebas
1.  [cite_start]Empaquetar la carga (NuGet) y actualizar `workload-dev-mode.json`[cite: 296, 297].
2.  [cite_start]Ejecutar **DevGateway**, Backend y Frontend (las "tres ventanas")[cite: 301, 302].
3.  **Prueba funcional:**
    * Crear "Markdown Document" en un espacio de prueba.
    * Escribir, previsualizar y guardar.
    * Verificar persistencia cerrando y reabriendo.
    * [cite_start]Verificar creación del archivo físico en OneLake Explorer[cite: 304, 311, 318].

---

## Referencias
* [cite_start][1] Microsoft Fabric Workload Development Kit overview [cite: 355]
* [cite_start][2] Add a Microsoft Fabric workload [cite: 356]
* [cite_start][3] Item lifecycle [cite: 358]
* [cite_start][4] Fabric Workload Hub validation guidelines [cite: 360]
* [cite_start][5] OneLake security overview [cite: 373]