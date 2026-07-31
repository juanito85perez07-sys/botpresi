// Card: Execute Code — "Consultar programa social"
// Variable de entrada esperada: workflow.textoUsuario (texto/intención detectada)
// Configura env.MIDDLEWARE_API_KEY y env.MIDDLEWARE_URL como Secrets en Botpress.

try {
  const response = await axios.get(`${env.MIDDLEWARE_URL}/api/programas`, {
    params: { q: workflow.textoUsuario },
    headers: { 'x-api-key': env.MIDDLEWARE_API_KEY },
    timeout: 8000,
  });

  const { resultados } = response.data;

  if (!resultados || resultados.length === 0) {
    workflow.datosEncontrados = false;
    workflow.contextoParaLLM =
      'No se encontró información oficial sobre ese programa en el catálogo.';
  } else {
    workflow.datosEncontrados = true;
    workflow.contextoParaLLM = resultados
      .map(
        (p) => `
Programa: ${p.nombre}
Dependencia: ${p.dependencia_responsable}
Requisitos: ${p.requisitos.join(', ')}
Monto: ${p.monto_apoyo}
Registro: del ${new Date(p.fechas_registro.apertura).toLocaleDateString('es-MX')} al ${new Date(
          p.fechas_registro.cierre
        ).toLocaleDateString('es-MX')}
Lugar: ${p.lugar_registro}, horario: ${p.horario_atencion}
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
