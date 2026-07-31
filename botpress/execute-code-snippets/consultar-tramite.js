// Card: Execute Code — "Consultar requisitos de trámite"
// Variable de entrada esperada: workflow.textoUsuario

try {
  const response = await axios.get(`${env.MIDDLEWARE_URL}/api/tramites`, {
    params: { q: workflow.textoUsuario },
    headers: { 'x-api-key': env.MIDDLEWARE_API_KEY },
    timeout: 8000,
  });

  const { resultados } = response.data;

  if (!resultados || resultados.length === 0) {
    workflow.datosEncontrados = false;
    workflow.contextoParaLLM =
      'No se encontró información oficial sobre ese trámite en el catálogo.';
  } else {
    workflow.datosEncontrados = true;
    workflow.contextoParaLLM = resultados
      .map(
        (t) => `
Trámite: ${t.nombre}
Dependencia: ${t.dependencia_responsable}
Requisitos: ${t.requisitos.join(', ')}
Costo: ${t.costo}
Tiempo de respuesta: ${t.tiempo_respuesta_dias_habiles} días hábiles
Modalidad: ${t.modalidad.join(', ')}
Ubicación: ${t.ubicacion_fisica}, horario: ${t.horario_atencion}
${t.url_tramite_en_linea ? `Trámite en línea: ${t.url_tramite_en_linea}` : ''}
      `.trim()
      )
      .join('\n---\n');
  }
} catch (error) {
  console.error('Error consultando middleware:', error.message);
  workflow.datosEncontrados = false;
  workflow.errorConsulta = true;
  workflow.contextoParaLLM = 'Ocurrió un error técnico al consultar la base de datos oficial.';
}
