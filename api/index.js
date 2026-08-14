// api/index.js
// Middleware de Mocards (Juanita) — corre como función serverless en Vercel.
// No usa app.listen(); exporta la app con module.exports.

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

// Healthcheck público (sin API key)
app.get('/health', (req, res) => {
  res.json({ ok: true, status: 'up', timestamp: new Date().toISOString() });
});

app.use(checkApiKey);

// --- Capturar solicitud de cliente (Mocards) — para pasar a un asesor ---
app.post('/api/solicitudes', async (req, res) => {
  try {
    const database = await connectDB();
    const {
      psid,
      nombre,
      tipo_consulta,
      producto,
      talla,
      color,
      ocasion,
      sucursal_preferida,
      codigo_postal,
      telefono_contacto,
      resumen,
    } = req.body;

    if (!tipo_consulta || !resumen) {
      return res.status(400).json({
        ok: false,
        error: 'Faltan campos obligatorios: tipo_consulta, resumen',
      });
    }

    // Anti-duplicados: mismo psid + mismo resumen en los últimos 2 minutos.
    const dosMinutosAtras = new Date(Date.now() - 2 * 60 * 1000);
    const existente = await database.collection('solicitudes_mocards').findOne({
      psid: psid || null,
      resumen,
      fecha_creacion: { $gte: dosMinutosAtras },
    });
    if (existente) {
      return res.json({ ok: true, folio: existente.folio });
    }

    const folio = `MC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const nuevaSolicitud = {
      folio,
      canal_origen: 'messenger',
      psid: psid || null,
      nombre: nombre || null,
      tipo_consulta,
      producto: producto || null,
      talla: talla || null,
      color: color || null,
      ocasion: ocasion || null,
      sucursal_preferida: sucursal_preferida || null,
      codigo_postal: codigo_postal || null,
      telefono_contacto: telefono_contacto || null,
      resumen,
      estado: 'pendiente',
      fecha_creacion: new Date(),
    };

    await database.collection('solicitudes_mocards').insertOne(nuevaSolicitud);

    res.json({ ok: true, folio });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Error al registrar la solicitud' });
  }
});

module.exports = app;