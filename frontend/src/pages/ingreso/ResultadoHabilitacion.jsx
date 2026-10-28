import { useEffect, useState } from 'react';
import { consultarHabilitacion, consultarIngresoRegistrado, registrarIngresoExamen, registrarIngreso } from '../../services/validacionHabilitacionService';
import './ValidarHabilitacion.css';

function ResultadoHabilitacion({ idExamen, idEstudiante, nombreExamen, nombreEstudiante }) {
  const [consulta, setConsulta] = useState(null);
  const [intento, setIntento] = useState(0);
  const [estadoIngreso, setEstadoIngreso] = useState(null);
  const [guardandoIngreso, setGuardandoIngreso] = useState(false);
  const consultaActual = consulta?.intento === intento && Number(consulta?.idExamen) === Number(idExamen) && Number(consulta?.idEstudiante) === Number(idEstudiante);
  const resultado = consultaActual ? consulta.resultado : null;
  const error = consultaActual ? consulta.error : '';
  const cargando = !consultaActual;

  useEffect(() => {
    let activo = true;
    async function validar() {
      try {
        const datos = await consultarHabilitacion(Number(idExamen), Number(idEstudiante));
        if (!activo) return;
        const estadosValidos = ['HABILITADO', 'INHABILITADO', 'SIN_ESTADO', 'NO_ASOCIADO'];
        if (Number(datos?.idExamen) !== Number(idExamen) || Number(datos?.idEstudiante) !== Number(idEstudiante) || !estadosValidos.includes(datos?.estado) || typeof datos?.puedeContinuar !== 'boolean' || (datos.estado !== 'HABILITADO' && datos.puedeContinuar)) {
          setConsulta({ intento, idExamen, idEstudiante, resultado: null, error: 'El servidor devolvió una validación incompleta o inconsistente.' });
          return;
        }
        setConsulta({ intento, idExamen, idEstudiante, resultado: datos, error: '' });
      } catch (err) {
        if (!activo) return;
        setConsulta({ intento, idExamen, idEstudiante, resultado: null, error: err.response?.data?.mensaje || err.response?.data?.message || 'No se pudo completar la validación. Verifique la conexión.' });
      }
    }
    validar();
    return () => { activo = false; };
  }, [idExamen, idEstudiante, intento]);

  const habilitado = resultado?.estado === 'HABILITADO' && resultado?.puedeContinuar === true;
  const claveIngreso = idExamen + ':' + idEstudiante + ':' + intento;
  const ingresoActual = estadoIngreso?.clave === claveIngreso ? estadoIngreso : null;

  useEffect(() => {
    if (!habilitado) {
      setEstadoIngreso((prev) => (prev?.clave !== claveIngreso ? prev : null));
      return;
    }
    let activo = true;
    consultarIngresoRegistrado(Number(idExamen), Number(idEstudiante))
      .then((datos) => {
        if (activo) {
          setEstadoIngreso({
            clave: claveIngreso,
            registrado: datos?.ingresoRegistrado === true,
            datos,
            error: '',
          });
        }
      })
      .catch((err) => {
        if (activo) {
          setEstadoIngreso({
            clave: claveIngreso,
            registrado: false,
            datos: null,
            error: err.response?.data?.mensaje || err.response?.data?.message || 'No se pudo verificar si el estudiante ya ingresó.',
          });
        }
      });
    return () => { activo = false; };
  }, [habilitado, idExamen, idEstudiante, intento, claveIngreso]);

  const registrarAsistencia = async () => {
    if (!habilitado || guardandoIngreso || !ingresoActual || ingresoActual.registrado || ingresoActual.error) return;
    setGuardandoIngreso(true);
    try {
      const datos = await registrarIngresoExamen(Number(idExamen), Number(idEstudiante));
      setEstadoIngreso({ clave: claveIngreso, registrado: true, datos, error: '' });
    } catch (err) {
      const duplicado = err.response?.status === 409;
      setEstadoIngreso({
        clave: claveIngreso,
        registrado: duplicado,
        datos: null,
        error: duplicado ? 'Este estudiante ya tiene un ingreso registrado para este examen.' : (err.response?.data?.mensaje || err.response?.data?.message || 'No se pudo registrar el ingreso. Verifique la conexión.'),
      });
    } finally {
      setGuardandoIngreso(false);
    }
  };

  const confirmarIngresoManual = async () => {
    if (!habilitado || guardandoIngreso || (ingresoActual && ingresoActual.registrado) || (ingresoActual && ingresoActual.error)) return;
    setGuardandoIngreso(true);
    try {
      await registrarIngreso(Number(idExamen), Number(idEstudiante));
      setEstadoIngreso({ clave: claveIngreso, registrado: true, datos: null, error: '' });
    } catch (err) {
      const duplicado = err.response?.status === 409;
      setEstadoIngreso({
        clave: claveIngreso,
        registrado: duplicado,
        datos: null,
        error: duplicado ? 'Este estudiante ya tiene un ingreso registrado para este examen.' : (err.response?.data?.mensaje || err.response?.data?.message || 'No se pudo registrar el ingreso.'),
      });
    } finally {
      setGuardandoIngreso(false);
    }
  };

  return (
    <div className='validacion-integrada'>
      <section className='validacion-panel'>
        <h2>Validación de habilitación</h2>
        <p>Comprobación de habilitación del estudiante identificado para el examen seleccionado.</p>
        <button type='button' className='validacion-boton' disabled={cargando} onClick={() => setIntento((actual) => actual + 1)}>
          {cargando ? 'Validando...' : 'Volver a validar'}
        </button>
      </section>

      {cargando && (
        <section className='validacion-resultado' role='status'>
          <h2>Validando habilitación...</h2>
          <p>Consultando el estado del estudiante.</p>
        </section>
      )}

      {!cargando && error && (
        <section className='validacion-resultado validacion-error' role='alert'>
          <h2>Validación no completada</h2>
          <p>{error}</p>
          <strong>Ingreso no autorizado.</strong>
        </section>
      )}

      {!cargando && resultado && (
        <section className={'validacion-resultado ' + (habilitado ? 'validacion-habilitado' : 'validacion-bloqueado')} aria-live='polite'>
          <h2>{habilitado ? 'Estudiante habilitado' : resultado.estado === 'INHABILITADO' ? 'Estudiante inhabilitado' : 'Ingreso no autorizado'}</h2>
          <div className='validacion-detalles'>
            <p><strong>Examen:</strong> {nombreExamen || idExamen}</p>
            <p><strong>Estudiante:</strong> {nombreEstudiante || idEstudiante}</p>
            <p><strong>Estado:</strong> {resultado.estado}</p>
          </div>
          <p>{resultado.mensaje}</p>
          {resultado.estado === 'INHABILITADO' && (
            <div className='validacion-motivo'>
              <h3>Motivo de inhabilitación</h3>
              <p><strong>{resultado.tituloMotivo || 'Sin título registrado'}</strong></p>
              <p>{resultado.motivo || 'Sin detalle registrado'}</p>
            </div>
          )}
          <div className='validacion-decision'>
            {habilitado ? (ingresoActual?.registrado ? 'Ingreso ya registrado para este examen.' : 'Habilitación confirmada. Puede registrar el ingreso.') : 'No se permite continuar con el ingreso.'}
          </div>
        </section>
      )}

      {!cargando && habilitado && (
        <section className='validacion-panel' aria-live='polite'>
          <h2>Registro de asistencia - HU22</h2>
          {!ingresoActual ? (
            <p>Comprobando si el estudiante ya tiene un ingreso registrado...</p>
          ) : ingresoActual.registrado ? (
            <div className='ingreso-ya-registrado' role='status'>
              <strong>Ingreso ya registrado.</strong>
              <p>{ingresoActual.error || 'Este estudiante ya tiene asistencia registrada para este examen. No se puede registrar otra vez.'}</p>
              {ingresoActual.datos?.fechaHoraIngreso && <p>Fecha y hora: {new Date(ingresoActual.datos.fechaHoraIngreso).toLocaleString()}</p>}
            </div>
          ) : (
            <>
              {ingresoActual.error && <p role='alert' className='ingreso-ya-registrado'>{ingresoActual.error}</p>}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button type='button' className='validacion-boton' disabled={guardandoIngreso || Boolean(ingresoActual.error)} onClick={registrarAsistencia}>
                  {guardandoIngreso ? 'Registrando...' : 'Registrar ingreso / asistencia'}
                </button>
                <button type='button' className='validacion-boton' disabled={guardandoIngreso || Boolean(ingresoActual.error)} onClick={confirmarIngresoManual}>
                  {guardandoIngreso ? 'Registrando...' : 'Registrar ingreso'}
                </button>
              </div>
              <p className='validacion-ayuda'>La habilitación and the permiso del docente se vuelven a comprobar en el servidor.</p>
            </>
          )}
        </section>
      )}
    </div>
  );
}

export default ResultadoHabilitacion;
