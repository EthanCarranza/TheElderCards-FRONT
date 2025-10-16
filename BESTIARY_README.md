# Bestiario - Documentación

## Descripción General

Se ha implementado un componente **Bestiario** con diseño de lorebook típico de videojuegos, ubicado en el menú del Navbar justo después de "Facciones".

## Estructura del Componente

### Layout de Dos Paneles

1. **Panel Izquierdo (Índice)**

   - Lista scrolleable con todas las entradas del bestiario
   - Muestra nombre, tipo y especie de cada entrada
   - Resalta la entrada seleccionada actualmente
   - Diseño responsive adaptado a móviles y desktop

2. **Panel Derecho (Detalle)**
   - Vista completa de la entrada seleccionada
   - Incluye nombre, descripción, clasificación y estadísticas
   - Barras de progreso para visualizar stats numéricas
   - Diseño limpio y legible con gradientes y bordes

## Campos de Datos

Basado en las imágenes del Excel proporcionado, el componente soporta los siguientes campos:

### Información Básica

- `name`: Nombre de la criatura/hechizo/invocación
- `description`: Descripción detallada
- `type`: Tipo (criatura, invocación, hechizo, etc.)

### Clasificación

- `discipline`: Disciplina (basiliscos, dragones, elementales, etc.)
- `element`: Elemento (dragón, híbrido, elemental, etc.)
- `species`: Especie (ancestral, natural, artificial, etc.)
- `creatureCategory`: Categoría de criatura (mitológico, tierra, aire, etc.)
- `territory`: Territorio donde habita

### Estadísticas

- `cost`: Coste (0-10)
- `defense`: Defensa (0-10)
- `health`: Salud (0-10)
- `magic`: Magia (0-150)
- `stamina`: Vigor (0-150)
- `hunger`: Hambre (0-150)

## Datos Mockup

Se han incluido 20 entradas de ejemplo extraídas de las imágenes del Excel:

- **Criaturas**: Ave de Tormenta, Basilisco, Centauro, Dragones (Azul, Cristal, Fuego), Elementales (Agua, Fuego), Fénix, etc.
- **Invocaciones**: Invocar Lobo, Invocar Golem de Piedra
- **Hechizos**: Rayo Azul, Llama Pura

## Integración

### Archivos Modificados

1. **`Bestiary.tsx`** (nuevo)

   - Componente principal del bestiario
   - Incluye datos mockup y lógica de visualización

2. **`Navbar.tsx`**

   - Añadido enlace "Bestiario" después de "Facciones"

3. **`App.tsx`**
   - Añadida ruta `/bestiary` que renderiza el componente

## Próximos Pasos

Cuando se implemente el backend:

1. Crear endpoint para leer el Excel y cargar entradas
2. Reemplazar `mockEntries` con llamada a la API
3. Añadir paginación si el número de entradas es muy grande
4. Implementar búsqueda/filtrado por tipo, elemento, especie, etc.
5. Posible adición de imágenes para cada entrada

## Estilo Visual

- Paleta de colores: tonos ámbar/dorado para títulos y acentos
- Fondo: gradientes oscuros (gray-900, gray-800)
- Bordes: sutiles con transparencia
- Barras de estadísticas con colores según tipo:
  - Coste: ámbar
  - Defensa: azul
  - Salud: rojo
  - Magia: púrpura
  - Vigor: verde
  - Hambre: naranja

## Responsive

- En móviles: panel izquierdo arriba, derecho abajo
- En desktop: diseño de dos columnas lado a lado
- Scroll independiente en cada panel
