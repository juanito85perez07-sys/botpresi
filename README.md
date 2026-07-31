# Asistente de Atención Ciudadana — Dolores Hidalgo

Bot de Facebook Messenger (Botpress) conectado a MongoDB Atlas a través de un
middleware propio en Node.js/Express, desplegado como función serverless en
**Vercel**.

## ⚠️ Nota importante de arquitectura

La **Atlas Data API de MongoDB fue descontinuada el 30 de septiembre de 2025**.
Por eso este proyecto usa un middleware propio que se conecta a MongoDB con el
driver oficial y expone una API REST simple que Botpress consume desde una
tarjeta `Execute Code` (con `axios`) o desde una herramienta HTTP.

```
Ciudadano (Messenger)
        │
        ▼
   Botpress Cloud
        │  Execute Code / HTTP Tool → axios / fetch
        ▼
   api/index.js  (función serverless en Vercel)
        │  driver oficial "mongodb"
        ▼
   MongoDB Atlas
```

## Qué cambió respecto a la versión Render/Railway

- `server.js` ahora vive en `api/index.js` — Vercel detecta automáticamente
  todo lo que está en la carpeta `api/` como una función serverless.
- Ya no se usa `app.listen()` al final del archivo; en su lugar se exporta la
  app (`module.exports = app`) y Vercel la invoca en cada request.
- Se agregó `vercel.json` para que todas las rutas (`/health`,
  `/api/programas`, `/api/tramites`, etc.) se enruten correctamente a la
  función.
- Todo lo demás — endpoints, lógica de negocio, esquema de Mongo, snippets de
  Botpress — es exactamente igual a como ya lo tenías.

## Estructura del proyecto

```
mi-proyecto-vercel/
├── api/
│   └── index.js              Servidor Express (antes server.js)
├── seed/
│   └── seed.js                Script para poblar Mongo con datos de ejemplo
├── botpress/
│   └── execute-code-snippets/ Código para pegar en Execute Code (sin cambios)
├── package.json
├── vercel.json                 Enrutamiento hacia api/index.js
├── .env.example
└── .gitignore
```

## Cómo desplegar

### 1. Sube este proyecto a GitHub
Crea un repositorio (puede ser privado) y sube todo el contenido de esta
carpeta.

### 2. Permite acceso desde cualquier IP en MongoDB Atlas
Vercel usa IPs dinámicas, así que en **Network Access** de tu cluster agrega
`0.0.0.0/0` ("Allow access from anywhere"). La seguridad real la sigue dando
tu `MIDDLEWARE_API_KEY`, no el filtrado de IP.

### 3. Conecta el repo en Vercel
1. Entra a https://vercel.com, inicia sesión con GitHub.
2. **Add New → Project** y selecciona el repositorio.
3. Vercel detecta Node.js automáticamente — no cambies nada en build settings.

### 4. Configura las variables de entorno (antes de dar Deploy)
En **Environment Variables**, agrega las mismas que ya tenías en tu `.env`:

| Nombre | Valor |
|---|---|
| `MONGO_URI` | Tu connection string de Atlas |
| `DB_NAME` | `dolores_hidalgo_atencion_ciudadana` |
| `MIDDLEWARE_API_KEY` | Tu llave secreta |

Márcalas para Production, Preview y Development.

### 5. Deploy
Click en **Deploy**. En 1-2 minutos tendrás una URL como
`https://tu-proyecto.vercel.app`.

### 6. Verifica
```
https://tu-proyecto.vercel.app/health
```
Debe responder `{"ok":true,"status":"up",...}`.

```bash
curl "https://tu-proyecto.vercel.app/api/programas?q=adulto" \
  -H "x-api-key: TU_LLAVE_AQUI"
```

### 7. Poblar la base de datos (se corre localmente, no en Vercel)
```bash
npm install
cp .env.example .env   # y rellena MONGO_URI, DB_NAME, MIDDLEWARE_API_KEY
npm run seed
```

### 8. Conecta con Botpress
Usa `https://tu-proyecto.vercel.app` como base URL en tus herramientas HTTP o
en `env.MIDDLEWARE_URL` si sigues usando Execute Code cards, con el header
`x-api-key` puesto a tu `MIDDLEWARE_API_KEY`.

## Próximos pasos (seguimos ajustando juntos)
- Prompt de sistema + árbol de decisión para desglosar intenciones múltiples.
- Reglas de negocio para escalamiento a agente humano.
- Endpoint adicional para actualizar el estado de un reporte desde un panel
  administrativo.
