// api/index.js
// Middleware que conecta Botpress con MongoDB Atlas.
// Reemplaza a la Atlas Data API (descontinuada el 30/sept/2025).
//
// Corre como función serverless en Vercel. No usa app.listen(); exporta
// la app con module.exports.

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

app.get('/health', (req, res) => {
  res.json({ ok: true, status: 'up', timestamp: new Date().toISOString() });
});

app.use(checkApiKey);

// --- Programas sociales ---
app.get('/api/programas', async (req, res) => {
  try {
    const database = await connectDB();
    const { q } = req.query;
    const filtro = q
      ? { vigente: true, $or: [{ nombre: { $regex: q, $options: 'i' } }, { tags_busqueda: { $regex: q, $options: 'i' } }] }
      : { vigente: true };
    const resultados = await database.collection('programas_sociales').find(filtro).limit(5).toArray();
    res.json({ ok: true, resultados });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Error al consultar programas sociales' });
  }
});

// --- Trámites ---
app.get('/api/tramites', async (req, res) => {
  try {
    const database = await connectDB();
    const { q } = req.query;
    const filtro = q
      ? { $or: [{ nombre: { $regex: q, $options: 'i' } }, { tags_busqueda: { $regex: q, $options: 'i' } }] }
      : {};
    const resultados = await database.collection('tramites_requisitos').find(filtro).limit(5).toArray();
    res.json({ ok: true, resultados });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Error al consultar trámites' });
  }
});

// --- Crear reporte (con prioridad automática para casos sensibles) ---
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

    const categoriasSensibles = ['violencia', 'violencia_genero', 'seguridad', 'accidente'];
    const esSensible = categoriasSensibles.includes(categoria);

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
      prioridad: esSensible ? 'alta' : 'media',
      requiere_escalamiento_humano: esSensible,
      fecha_creacion: new Date(),
      fecha_ultima_actualizacion: new Date(),
      historial_estados: [
        { estado: 'recibido', fecha: new Date(), comentario: 'Reporte generado vía bot.' },
      ],
    };

    await database.collection('reportes_ciudadanos').insertOne(nuevoReporte);

    res.json({ ok: true, folio, prioridad: nuevoReporte.prioridad });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Error al crear el reporte' });
  }
});

// --- Consultar folio ---
app.get('/api/reportes/:folio', async (req, res) => {
  try {
    const database = await connectDB();
    const reporte = await database.collection('reportes_ciudadanos').findOne({ folio: req.params.folio });
    if (!reporte) {
      return res.status(404).json({ ok: false, error: 'Folio no encontrado' });
    }
    res.json({ ok: true, reporte });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Error al consultar folio' });
  }
});

// --- Directorio de dependencias ---
app.get('/api/dependencias', async (req, res) => {
  try {
    const database = await connectDB();
    const { q } = req.query;
    const filtro = q
      ? { $or: [{ nombre_dependencia: { $regex: q, $options: 'i' } }, { servicios_que_atiende: { $regex: q, $options: 'i' } }] }
      : {};
    const resultados = await database.collection('directorio_dependencias').find(filtro).limit(5).toArray();
    res.json({ ok: true, resultados });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Error al consultar directorio' });
  }
});

// --- Guardar contacto (WhatsApp o correo) ---
app.post('/api/contactos', async (req, res) => {
  try {
    const database = await connectDB();
    const { psid, nombre, tipo_contacto, valor_contacto, motivo } = req.body;
    if (!valor_contacto) {
      return res.status(400).json({ ok: false, error: 'Falta el dato de contacto (correo o número de WhatsApp)' });
    }
    const nuevoContacto = {
      psid: psid || null,
      nombre: nombre || null,
      tipo_contacto: tipo_contacto || 'no_especificado',
      valor_contacto,
      motivo: motivo || null,
      fecha_registro: new Date(),
      atendido: false,
    };
    await database.collection('contactos_ciudadanos').insertOne(nuevoContacto);
    res.json({ ok: true, mensaje: 'Contacto guardado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Error al guardar el contacto' });
  }
});

// --- Directorio de emergencia y seguridad ---
app.get('/api/emergencias', async (req, res) => {
  try {
    const database = await connectDB();
    const { categoria } = req.query;
    const filtro = categoria ? { categoria } : {};
    const resultados = await database.collection('contactos_emergencia').find(filtro).toArray();
    res.json({ ok: true, resultados });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Error al consultar contactos de emergencia' });
  }
});

// --- Preguntas frecuentes generales ---
// Para todo lo que no encaje en programas/trámites/reportes/emergencias:
// predial, ubicaciones, horarios, información general del municipio.
app.get('/api/faq', async (req, res) => {
  try {
    const database = await connectDB();
    const { q } = req.query;
    const filtro = q
      ? {
          $or: [
            { pregunta: { $regex: q, $options: 'i' } },
            { tema: { $regex: q, $options: 'i' } },
            { tags_busqueda: { $regex: q, $options: 'i' } },
          ],
        }
      : {};
    const resultados = await database.collection('preguntas_frecuentes').find(filtro).limit(3).toArray();
    res.json({ ok: true, resultados });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Error al consultar preguntas frecuentes' });
  }
});

module.exports = app;