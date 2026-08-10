// --- Capturar solicitud de cliente (Mocards) — para pasar a un asesor ---
// No consulta inventario/precios reales (Mocards aún no tiene esa
// integración) — solo registra la consulta organizada para que un
// asesor humano la revise y responda con datos reales.
app.post('/api/solicitudes', async (req, res) => {
  try {
    const database = await connectDB();
    const {
      psid,
      nombre,
      tipo_consulta,   // 'precio' | 'existencia' | 'apartado' | 'envio' | 'llamada' | 'queja' | 'otro'
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