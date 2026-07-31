// api/index.js
// Middleware que conecta Botpress con MongoDB Atlas.
// Reemplaza a la Atlas Data API (descontinuada el 30/sept/2025).
//
// ADAPTADO PARA VERCEL:
// - Este archivo vive en la carpeta api/, que Vercel detecta automáticamente
//   como función serverless.
// - Ya NO usamos app.listen() al final; en su lugar exportamos la app
//   (module.exports = app) y Vercel se encarga de invocarla en cada request.
// - La conexión a Mongo sigue cacheándose en las variables `client`/`db`
//   para reutilizarse entre invocaciones "calientes".

require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || 'dolores_hidalgo_atencion_ciudadana';
const API_KEY = process.env.MIDDLEWARE_API_KEY;

let client;
let db;

async function connectDB() {
  if (db) return db;
  client = new MongoClient(MONGO_URI, { maxPoolSize: 10 });
  await client.connect();
  db = client.db(DB_NAME);
  console.log('✅ Conectado a MongoDB Atlas -', DB_NAME);
  return db;
}

// --- Autenticación simple entre Botpress y este backend ---
function checkApiKey(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!API_KEY) {
    console.warn('⚠️  MIDDLEWARE_API_KEY no está configurada');
  }
  if (key !== API_KEY) {
    return res.status(401).json({ ok: false, error: 'No autorizado' });
  }
  next();
}

// Healthcheck público (sin API key) para verificar que el server está vivo
app.get('/health', (req, res) => {
  res.json({ ok: true, status: 'up', timestamp: new Date().toISOString() });
});

app.use(checkApiKey);

// --- Endpoint: buscar programas sociales ---
app.get('/api/programas', async (req, res) => {
  try {
    const database = await connectDB();
    const { q } = req.query;

    const filtro = q
      ? {
          vigente: true,
          $or: [
            { nombre: { $regex: q, $options: 'i' } },
            { tags_busqueda: { $regex: q, $options: 'i' } },
          ],
        }
      : { vigente: true };

    const resultados = await database
      .collection('programas_sociales')
      .find(filtro)
      .limit(5)
      .toArray();

    res.json({ ok: true, resultados });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Error al consultar programas sociales' });
  }
});

// --- Endpoint: buscar requisitos de trámite ---
app.get('/api/tramites', async (req, res) => {
  try {
    const database = await connectDB();
    const { q } = req.query;

    const filtro = q
      ? {
          $or: [
            { nombre: { $regex: q, $options: 'i' } },
            { tags_busqueda: { $regex: q, $options: 'i' } },
          ],
        }
      : {};

    const resultados = await database
      .collection('tramites_requisitos')
      .find(filtro)
      .limit(5)
      .toArray();

    res.json({ ok: true, resultados });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Error al consultar trámites' });
  }
});

// --- Endpoint: crear un reporte ciudadano (queja / reporte de servicio) ---
app.post('/api/reportes', async (req, res) => {
  try {
    const database = await connectDB();
    const { psid, tipo_reporte, categoria, descripcion, ubicacion_referencia } = req.body;

    if (!tipo_reporte || !categoria || !descripcion) {
      return res.status(400).json({
        ok: false,
        error: 'Faltan campos obligatorios: tipo_reporte, categoria, descripcion',
      });
    }

    const folio = `RC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const nuevoReporte = {
      folio,
      canal_origen: 'messenger',
      usuario: { messenger_psid: psid || null },
      tipo_reporte,
      categoria,
      descripcion,
      ubicacion_referencia: ubicacion_referencia || null,
      estado: 'recibido',
      requiere_escalamiento_humano: false,
      fecha_creacion: new Date(),
      fecha_ultima_actualizacion: new Date(),
      historial_estados: [
        { estado: 'recibido', fecha: new Date(), comentario: 'Reporte generado vía bot.' },
      ],
    };

    await database.collection('reportes_ciudadanos').insertOne(nuevoReporte);

    res.json({ ok: true, folio });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Error al crear el reporte' });
  }
});

// --- Endpoint: consultar estatus de un folio ---
app.get('/api/reportes/:folio', async (req, res) => {
  try {
    const database = await connectDB();
    const reporte = await database
      .collection('reportes_ciudadanos')
      .findOne({ folio: req.params.folio });

    if (!reporte) {
      return res.status(404).json({ ok: false, error: 'Folio no encontrado' });
    }
    res.json({ ok: true, reporte });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Error al consultar folio' });
  }
});

// --- Endpoint: directorio de dependencias ---
app.get('/api/dependencias', async (req, res) => {
  try {
    const database = await connectDB();
    const { q } = req.query;

    const filtro = q
      ? {
          $or: [
            { nombre_dependencia: { $regex: q, $options: 'i' } },
            { servicios_que_atiende: { $regex: q, $options: 'i' } },
          ],
        }
      : {};

    const resultados = await database
      .collection('directorio_dependencias')
      .find(filtro)
      .limit(5)
      .toArray();

    res.json({ ok: true, resultados });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Error al consultar directorio' });
  }
});

// IMPORTANTE: ya no usamos app.listen(). Vercel invoca esta app directamente.
module.exports = app;
