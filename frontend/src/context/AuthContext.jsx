import { useCallback, useEffect, useRef, useState } from 'react'
import { AuthContext } from './authContext'
import { obtenerPermisosActuales } from '../services/authService'

const CLAVE_SESION = 'exampass_sesion'
const CLAVE_SALIDA = 'exampass_ultima_salida'

function limpiarSesionPersistenteAnterior() {
  localStorage.removeItem(CLAVE_SESION)
  localStorage.removeItem('token')
  localStorage.removeItem('usuario')
  localStorage.removeItem('ultimaActividad')
}

function leerSesionDePestana() {
  try {
    const valor = sessionStorage.getItem(CLAVE_SESION)
    if (valor) {
      const datos = JSON.parse(valor)
      if (datos?.token && datos?.usuario?.idUsuario) return datos
    }
  } catch (error) {
    console.warn('No se pudo recuperar la sesión de esta pestaña:', error)
    sessionStorage.removeItem(CLAVE_SESION)
  }
  return null
}

function leerSesionInicial() {
  limpiarSesionPersistenteAnterior()
  const ultimaSalida = Number(sessionStorage.getItem(CLAVE_SALIDA))
  const tipoNavegacion = performance.getEntriesByType('navigation')[0]?.type
  if (ultimaSalida && tipoNavegacion !== 'reload') {
    sessionStorage.removeItem('usuario')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('ultimaActividad')
    sessionStorage.removeItem(CLAVE_SESION)
  }
  sessionStorage.removeItem(CLAVE_SALIDA)

  const sesionDePestana = leerSesionDePestana()
  if (sesionDePestana) return sesionDePestana

  try {
    const token = sessionStorage.getItem('token')
    const dato = sessionStorage.getItem('usuario')
    const usuario = dato ? JSON.parse(dato) : null
    if (token && usuario?.idUsuario) {
      const sesion = { usuario, token }
      sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion))
      return sesion
    }
  } catch {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('usuario')
  }
  return { usuario: null, token: null }
}

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(leerSesionInicial)
  const [cargando, setCargando] = useState(
    () => typeof BroadcastChannel !== 'undefined' && !sessionStorage.getItem(CLAVE_SESION)
  )
  const [permisosActualizados, setPermisosActualizados] = useState(false)
  const canalRef = useRef(null)
  const sesionRef = useRef(sesion)
  const { usuario, token } = sesion

  const guardarSesionEnPestana = useCallback((nuevaSesion) => {
    sessionStorage.setItem('usuario', JSON.stringify(nuevaSesion.usuario))
    sessionStorage.setItem('token', nuevaSesion.token)
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify(nuevaSesion))
    sessionStorage.setItem('ultimaActividad', Date.now().toString())
    sesionRef.current = nuevaSesion
    setSesion(nuevaSesion)
    setCargando(false)
  }, [])

  const limpiarSesionEnPestana = useCallback(() => {
    sessionStorage.removeItem('usuario')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('ultimaActividad')
    sessionStorage.removeItem(CLAVE_SESION)
    sesionRef.current = { usuario: null, token: null }
    setSesion(sesionRef.current)
    setCargando(false)
  }, [])

  const iniciarSesion = useCallback(
    (datosUsuario, tokenJwt, recordar = false) => {
      const siguiente = { usuario: datosUsuario, token: tokenJwt }
      guardarSesionEnPestana(siguiente)
      canalRef.current?.postMessage({ tipo: 'SESION_ACTUALIZADA', sesion: siguiente })
      setPermisosActualizados(false)
      void recordar
    },
    [guardarSesionEnPestana]
  )

  const cerrarSesion = useCallback(() => {
    limpiarSesionEnPestana()
    canalRef.current?.postMessage({ tipo: 'CERRAR_SESION' })
    setPermisosActualizados(false)
  }, [limpiarSesionEnPestana])

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return undefined

    const canal = new BroadcastChannel('exampass_sesion')
    canalRef.current = canal
    canal.onmessage = (evento) => {
      const { tipo, sesion: sesionRecibida } = evento.data || {}

      if (tipo === 'SOLICITAR_SESION' && sesionRef.current.token) {
        canal.postMessage({ tipo: 'RESPUESTA_SESION', sesion: sesionRef.current })
      } else if (
        (tipo === 'RESPUESTA_SESION' || tipo === 'SESION_ACTUALIZADA') &&
        sesionRecibida?.token &&
        sesionRecibida?.usuario?.idUsuario &&
        (tipo === 'SESION_ACTUALIZADA' || !sesionRef.current.token)
      ) {
        guardarSesionEnPestana(sesionRecibida)
        setPermisosActualizados(false)
      } else if (tipo === 'CERRAR_SESION' && sesionRef.current.token) {
        limpiarSesionEnPestana()
        setPermisosActualizados(false)
        if (window.location.pathname !== '/login') {
          window.location.replace('/login')
        }
      }
    }

    if (!sesionRef.current.token) {
      canal.postMessage({ tipo: 'SOLICITAR_SESION' })
    }
    const tiempoEspera = setTimeout(() => setCargando(false), 600)

    return () => {
      clearTimeout(tiempoEspera)
      canal.close()
      if (canalRef.current === canal) canalRef.current = null
    }
  }, [guardarSesionEnPestana, limpiarSesionEnPestana])

  useEffect(() => {
    const marcarSalida = () => {
      sessionStorage.setItem(CLAVE_SALIDA, Date.now().toString())
    }
    const cancelarSalidaAlRestaurar = (evento) => {
      if (evento.persisted) sessionStorage.removeItem(CLAVE_SALIDA)
    }

    window.addEventListener('pagehide', marcarSalida)
    window.addEventListener('pageshow', cancelarSalidaAlRestaurar)
    return () => {
      window.removeEventListener('pagehide', marcarSalida)
      window.removeEventListener('pageshow', cancelarSalidaAlRestaurar)
    }
  }, [])

  useEffect(() => {
    if (!usuario?.idUsuario || !token) return undefined
    let vigente = true

    async function verificarPermisos() {
      try {
        const actuales = await obtenerPermisosActuales(usuario.idUsuario)
        if (!vigente) return
        const previos = usuario.permisos || []
        const cambiaron =
          JSON.stringify([...actuales].sort()) !== JSON.stringify([...previos].sort())
        if (cambiaron) setPermisosActualizados(true)
      } catch (error) {
        if (vigente) console.error('Error verificando permisos:', error)
      }
    }

    verificarPermisos()
    const intervalo = setInterval(verificarPermisos, 30000)
    return () => {
      vigente = false
      clearInterval(intervalo)
    }
  }, [usuario, token])

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        cargando,
        iniciarSesion,
        cerrarSesion,
        permisosActualizados,
        setPermisosActualizados
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
