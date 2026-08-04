// seed/seed-faq.js
// Ejecuta: node seed/seed-faq.js
// Siembra SOLO la colección preguntas_frecuentes.
//
// Fuentes verificadas por búsqueda web (agosto 2026): periodicocorreo.com.mx
// y doloreshidalgo.gob.mx/oficial. Los campos marcados "VERIFICAR" son datos
// que NO pude confirmar con certeza — complétalos con el Ayuntamiento antes
// de publicar

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || 'dolores_hidalgo_atencion_ciudadana';

const preguntasFrecuentes = [
  {
    tema: 'predial',
    pregunta: '¿Cómo pago el impuesto predial?',
    respuesta: 'Puedes pagarlo en línea en doloreshidalgo.gob.mx/predial/ — selecciona "Pagar", ingresa tu Cuenta Predial (10 dígitos, la encuentras en tu recibo) e indica si tu predio es urbano o rústico. También puedes pagarlo de forma presencial en la Presidencia Municipal, Av. de los Héroes #77, Col. San Cristóbal.',
    tags_busqueda: ['predial', 'impuesto', 'pago', 'propiedad', 'terreno', 'casa'],
  },
  {
    tema: 'tesoreria',
    pregunta: '¿Cómo contacto a la Tesorería Municipal?',
    respuesta: 'Puedes escribir a tesoreria@doloreshidalgo.gob.mx. La Tesorería se encarga de pagos, ingresos y egresos municipales (predial, licencias, derechos, etc.).',
    tags_busqueda: ['tesoreria', 'pagos', 'impuestos', 'finanzas municipales'],
  },
  {
    tema: 'ubicacion_presidencia',
    pregunta: '¿Dónde está la Presidencia Municipal?',
    respuesta: 'La Presidencia Municipal se ubica en Av. de los Héroes #77, Col. San Cristóbal, Dolores Hidalgo. Ahí también puedes hacer pagos presenciales como el predial.',
    tags_busqueda: ['presidencia municipal', 'palacio municipal', 'ubicacion', 'direccion', 'donde queda'],
  },
  {
    tema: 'horario_general',
    pregunta: '¿Cuál es el horario de atención de las oficinas municipales?',
    respuesta: null, // VERIFICAR: no encontré un horario general oficial confirmado — confírmalo con el Ayuntamiento
    tags_busqueda: ['horario', 'horas de atencion', 'a que hora abren'],
  },
];

async function seedFaq() {
  if (!MONGO_URI) {
    console.error('❌ Falta MONGO_URI en tu archivo .env');
    process.exit(1);
  }

  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);

    await db.collection('preguntas_frecuentes').deleteMany({});
    await db.collection('preguntas_frecuentes').insertMany(preguntasFrecuentes);

    console.log(`✅ ${preguntasFrecuentes.length} preguntas frecuentes insertadas`);
    console.log('\n⚠️  El horario_general quedó con respuesta null — complétalo antes de');
    console.log('   publicar, o el bot dirá honestamente que no lo tiene (lo cual está bien,');
    console.log('   pero es mejor tener el dato real).');
  } catch (err) {
    console.error('Error en el seed:', err);
  } finally {
    await client.close();
  }
}

seedFaq();