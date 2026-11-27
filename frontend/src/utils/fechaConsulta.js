export const FECHA_MINIMA_CONSULTA = '2025-01-01'
export const FECHA_MAXIMA_CONSULTA = '2028-12-31'

export function obtenerRangoFechasConsulta() {
  return {
    minima: FECHA_MINIMA_CONSULTA,
    maxima: FECHA_MAXIMA_CONSULTA
  }
}

export function fechaConsultaValida(valor) {
  if (!valor) return true

  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return false
  }

  const [anio, mes, dia] = valor.split('-').map(Number)

  const fecha = new Date(0)
  fecha.setFullYear(anio, mes - 1, dia)
  fecha.setHours(0, 0, 0, 0)

  const fechaExiste =
    fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia

  return fechaExiste && valor >= FECHA_MINIMA_CONSULTA && valor <= FECHA_MAXIMA_CONSULTA
}

export function obtenerMensajeFechaInvalida() {
  return 'La fecha debe estar entre el 01/01/2025 y el 31/12/2028.'
}
