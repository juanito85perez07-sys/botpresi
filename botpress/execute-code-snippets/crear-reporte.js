// Card: Execute Code — "Crear reporte ciudadano (queja o reporte de servicio)"
// Variables de entrada esperadas:
//   workflow.tipoReporte      -> "queja" | "reporte_servicio" | "sugerencia"
//   workflow.categoria        -> ej. "servicios_publicos", "seguridad", etc.
//   workflow.descripcionCiudadano
//   workflow.ubicacionReferencia (opcional)
//   user.id o event.target    -> PSID de Messenger (ajusta según tu variable real)

try {
  const response = await axios.post(
    `${env.MIDDLEWARE_URL}/api/reportes`,
    {
      psid: event.target, // ajusta si tu variable de PSID tiene otro nombre
      tipo_reporte: workflow.tipoReporte,
      categoria: workflow.categoria,
      descripcion: workflow.descripcionCiudadano,
      ubicacion_referencia: workflow.ubicacionReferencia || null,
    },
    {
      headers: { 'x-api-key': env.MIDDLEWARE_API_KEY },
      timeout: 8000,
    }
  );

  if (response.data.ok) {
    workflow.folioGenerado = response.data.folio;
    workflow.reporteCreadoConExito = true;
  } else {
    workflow.reporteCreadoConExito = false;
  }
} catch (error) {
  console.error('Error creando reporte:', error.message);
  workflow.reporteCreadoConExito = false;
  workflow.errorConsulta = true;
}
