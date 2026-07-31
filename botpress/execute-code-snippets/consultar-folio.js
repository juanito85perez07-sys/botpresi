// Card: Execute Code — "Consultar estatus de un folio"
// Variable de entrada esperada: workflow.folioConsulta (ej. "RC-2026-004521")

try {
  const response = await axios.get(
    `${env.MIDDLEWARE_URL}/api/reportes/${encodeURIComponent(workflow.folioConsulta)}`,
    {
      headers: { 'x-api-key': env.MIDDLEWARE_API_KEY },
      timeout: 8000,
    }
  );

  if (response.data.ok) {
    const r = response.data.reporte;
    workflow.folioEncontrado = true;
    workflow.contextoParaLLM = `
Folio: ${r.folio}
Estado actual: ${r.estado}
Categoría: ${r.categoria}
Descripción: ${r.descripcion}
Creado el: ${new Date(r.fecha_creacion).toLocaleDateString('es-MX')}
    `.trim();
  }
} catch (error) {
  if (error.response && error.response.status === 404) {
    workflow.folioEncontrado = false;
    workflow.contextoParaLLM = 'No se encontró ningún reporte con ese folio.';
  } else {
    console.error('Error consultando folio:', error.message);
    workflow.folioEncontrado = false;
    workflow.errorConsulta = true;
    workflow.contextoParaLLM = 'Ocurrió un error técnico al consultar el folio.';
  }
}
