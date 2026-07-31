// seed/seed.js
// Ejecuta: npm run seed
// Inserta documentos de ejemplo en las 4 colecciones para poder
// empezar a probar el bot de inmediato. Ajusta/reemplaza estos
// datos por la información oficial real del municipio.

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || 'dolores_hidalgo_atencion_ciudadana';

const programasSociales = [
  {
    clave_programa: 'APOYO-ADULTO-MAYOR-2026',
    nombre: 'Apoyo Alimentario al Adulto Mayor',
    descripcion:
      'Apoyo económico bimestral para adultos mayores de 65 años en situación de vulnerabilidad.',
    dependencia_responsable: 'DIF Municipal',
    vigente: true,
    periodo_vigencia: {
      inicio: new Date('2026-01-01T00:00:00Z'),
      fin: new Date('2026-12-31T23:59:59Z'),
    },
    requisitos: [
      'Ser residente de Dolores Hidalgo con mínimo 2 años',
      'Tener 65 años o más',
      'Presentar INE vigente',
      'Comprobante de domicilio no mayor a 3 meses',
      'CURP',
    ],
    monto_apoyo: '$800 MXN bimestrales',
    fechas_registro: {
      apertura: new Date('2026-02-01T00:00:00Z'),
      cierre: new Date('2026-02-28T23:59:59Z'),
    },
    lugar_registro: 'Oficinas del DIF Municipal, Calle Hidalgo #45, Centro',
    horario_atencion: 'Lunes a Viernes, 9:00 - 15:00 hrs',
    cupo_limitado: true,
    cupo_disponible: 320,
    tags_busqueda: ['adulto mayor', 'dif', 'apoyo económico', 'tercera edad'],
  },
];

const tramitesRequisitos = [
  {
    clave_tramite: 'LIC-FUNCIONAMIENTO-COMERCIO',
    nombre: 'Licencia de Funcionamiento para Negocio',
    categoria: 'comercio',
    dependencia_responsable: 'Dirección de Comercio y Padrón Municipal',
    requisitos: [
      'Solicitud por escrito (formato disponible en ventanilla)',
      'Identificación oficial vigente',
      'Comprobante de domicilio del establecimiento',
      'RFC (persona física o moral)',
      'Uso de suelo compatible, emitido por Desarrollo Urbano',
      'Constancia de no adeudo predial',
    ],
    costo: 'Variable según giro comercial, consultar tabla de derechos',
    tiempo_respuesta_dias_habiles: 5,
    modalidad: ['presencial', 'en_linea'],
    url_tramite_en_linea: 'https://doloreshidalgo.gob.mx/tramites/licencia-comercio',
    ubicacion_fisica: 'Palacio Municipal, planta baja, ventanilla 3',
    horario_atencion: 'Lunes a Viernes, 8:30 - 15:30 hrs',
    notas: 'Renovación anual obligatoria antes del 31 de enero.',
    tags_busqueda: ['licencia', 'negocio', 'comercio', 'permiso'],
  },
];

const directorioDependencias = [
  {
    nombre_dependencia: 'DIF Municipal Dolores Hidalgo',
    clave: 'DIF',
    titular: 'Lic. [Nombre del Titular]',
    telefono: '418-182-0130',
    extension: '215',
    correo: 'dif@doloreshidalgo.gob.mx',
    direccion: 'Calle Hidalgo #45, Centro, Dolores Hidalgo, Gto.',
    horario_atencion: 'Lunes a Viernes, 9:00 - 15:00 hrs',
    servicios_que_atiende: [
      'apoyo adulto mayor',
      'atención a la niñez',
      'asistencia jurídica familiar',
    ],
    requiere_cita_previa: false,
    es_urgencia_24hrs: false,
  },
];

// reportes_ciudadanos se deja vacía: se llena dinámicamente cuando
// los ciudadanos interactúan con el bot (vía POST /api/reportes).

async function seed() {
  if (!MONGO_URI) {
    console.error('❌ Falta MONGO_URI en tu archivo .env');
    process.exit(1);
  }

  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    console.log(`Conectado a ${DB_NAME}. Insertando datos de ejemplo...`);

    await db.collection('programas_sociales').deleteMany({});
    await db.collection('programas_sociales').insertMany(programasSociales);
    console.log(`✅ ${programasSociales.length} programa(s) social(es) insertado(s)`);

    await db.collection('tramites_requisitos').deleteMany({});
    await db.collection('tramites_requisitos').insertMany(tramitesRequisitos);
    console.log(`✅ ${tramitesRequisitos.length} trámite(s) insertado(s)`);

    await db.collection('directorio_dependencias').deleteMany({});
    await db.collection('directorio_dependencias').insertMany(directorioDependencias);
    console.log(`✅ ${directorioDependencias.length} dependencia(s) insertada(s)`);

    // Asegura que exista la colección aunque esté vacía
    await db.createCollection('reportes_ciudadanos').catch(() => {});

    console.log('🎉 Seed completado con éxito.');
  } catch (err) {
    console.error('Error en el seed:', err);
  } finally {
    await client.close();
  }
}

seed();
