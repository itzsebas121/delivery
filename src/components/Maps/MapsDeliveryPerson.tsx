import { useEffect, useRef, useState, useCallback, useMemo, memo } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import "./maps-delivery-person.css"
import { useAuth } from "../../context/Authcontext"
import { CarTaxiFrontIcon, Locate, Ruler, Timer, Volume2, VolumeX } from 'lucide-react'

interface Props {
  startCoordinates: string
  deliveryCoordinates: string
  orderstatus: string
}

interface Coordinates {
  lat: number
  lng: number
}

// Interfaces para voz
interface RouteStep {
  instruction: string
  distance: number
  duration: number
  maneuver: {
    type: string
    modifier?: string
  }
}

interface VoiceInstruction {
  text: string
  distance: number
  announced: boolean
  priority: number
}

// Memoized coordinate parser
const parseCoordinates = (coordStr: string): Coordinates | null => {
  const parts = coordStr.split(",")
  if (parts.length !== 2) return null
  const lat = Number.parseFloat(parts[0].trim())
  const lng = Number.parseFloat(parts[1].trim())
  if (isNaN(lat) || isNaN(lng)) return null
  return { lat, lng }
}

// Memoized bearing calculation
const getBearing = (start: Coordinates, end: Coordinates): number => {
  const startLat = (start.lat * Math.PI) / 180
  const startLng = (start.lng * Math.PI) / 180
  const endLat = (end.lat * Math.PI) / 180
  const endLng = (end.lng * Math.PI) / 180
  const y = Math.sin(endLng - startLng) * Math.cos(endLat)
  const x = Math.cos(startLat) * Math.sin(endLat) - Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng)
  let brng = Math.atan2(y, x)
  brng = (brng * 180) / Math.PI
  return (brng + 360) % 360
}

// Función para convertir instrucciones a español
const getSpanishInstruction = (step: RouteStep): string => {
  const { maneuver, distance } = step
  const distanceText =
    distance > 1000 ? `en ${Math.round(distance / 100) / 10} kilómetros` : `en ${Math.round(distance)} metros`

  switch (maneuver.type) {
    case "turn":
      if (maneuver.modifier === "left") return `Gire a la izquierda ${distanceText}`
      if (maneuver.modifier === "right") return `Gire a la derecha ${distanceText}`
      if (maneuver.modifier === "sharp left") return `Gire fuertemente a la izquierda ${distanceText}`
      if (maneuver.modifier === "sharp right") return `Gire fuertemente a la derecha ${distanceText}`
      if (maneuver.modifier === "slight left") return `Gire ligeramente a la izquierda ${distanceText}`
      if (maneuver.modifier === "slight right") return `Gire ligeramente a la derecha ${distanceText}`
      return `Gire ${distanceText}`
    case "new name":
      return `Continúe recto ${distanceText}`
    case "depart":
      return `Inicie el recorrido ${distanceText}`
    case "arrive":
      return `Ha llegado a su destino`
    case "merge":
      return `Incorpórese ${distanceText}`
    case "on ramp":
      return `Tome la rampa ${distanceText}`
    case "off ramp":
      return `Salga de la autopista ${distanceText}`
    case "fork":
      if (maneuver.modifier === "left") return `Manténgase a la izquierda ${distanceText}`
      if (maneuver.modifier === "right") return `Manténgase a la derecha ${distanceText}`
      return `Continúe por la bifurcación ${distanceText}`
    case "continue":
      return `Continúe recto ${distanceText}`
    case "roundabout":
      return `Entre en la rotonda ${distanceText}`
    case "rotary":
      return `Entre en la rotonda ${distanceText}`
    case "roundabout turn":
      return `En la rotonda, tome la salida ${distanceText}`
    default:
      return `Continúe ${distanceText}`
  }
}

const MapsDeliveryPerson = memo(({ startCoordinates, deliveryCoordinates, orderstatus }: Props) => {
  const { user } = useAuth()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const startMarkerRef = useRef<maplibregl.Marker | null>(null)
  const destinationMarkerRef = useRef<maplibregl.Marker | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const routeDataRef = useRef<any>(null)

  // Referencias para voz
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null)
  const voiceInstructionsRef = useRef<VoiceInstruction[]>([])
  const voiceIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const currentRouteDataRef = useRef<{
    distance: number
    duration: number
    currentLocation: Coordinates | null
  }>({
    distance: 0,
    duration: 0,
    currentLocation: null,
  })

  const [routeStarted, setRouteStarted] = useState(false)
  const [distanceKm, setDistanceKm] = useState<number | null>(null)
  const [durationMin, setDurationMin] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null)

  // Estados para voz
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [currentInstruction, setCurrentInstruction] = useState<string>("")
  const [announcementCount, setAnnouncementCount] = useState(0)

  // Memoized coordinates
  const start = useMemo(() => parseCoordinates(startCoordinates), [startCoordinates])
  const delivery = useMemo(() => parseCoordinates(deliveryCoordinates), [deliveryCoordinates])

  // Memoized map center
  const mapCenter = useMemo((): [number, number] => {
    return delivery ? [delivery.lng, delivery.lat] : [0, 0]
  }, [delivery])

  // Initialize speech synthesis
  useEffect(() => {
    console.log(startCoordinates, deliveryCoordinates, orderstatus)
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      speechSynthesisRef.current = window.speechSynthesis
    }
  }, [])

  // Función para hablar
  const speakInstruction = useCallback(
    (text: string) => {
      if (!voiceEnabled || !speechSynthesisRef.current) return

      speechSynthesisRef.current.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "es-ES"
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8

      const voices = speechSynthesisRef.current.getVoices()
      const spanishVoice = voices.find(
        (voice) => voice.lang.startsWith("es") || voice.name.toLowerCase().includes("spanish"),
      )
      if (spanishVoice) {
        utterance.voice = spanishVoice
      }

      speechSynthesisRef.current.speak(utterance)
      setCurrentInstruction(text)
      setAnnouncementCount((prev) => prev + 1)
    },
    [voiceEnabled],
  )

  // Procesar pasos de ruta para voz
  const processRouteSteps = useCallback((route: any): VoiceInstruction[] => {
    if (!route.legs || !route.legs[0] || !route.legs[0].steps) return []

    const instructions: VoiceInstruction[] = []
    let cumulativeDistance = 0

    route.legs[0].steps.forEach((step: any, index: number) => {
      if (index === 0) {
        instructions.push({
          text: "Iniciando navegación",
          distance: 0,
          announced: false,
          priority: 1,
        })
      }

      const instruction = getSpanishInstruction({
        instruction: step.name || "",
        distance: step.distance,
        duration: step.duration,
        maneuver: step.maneuver,
      })

      let priority = 2
      if (step.maneuver.type === "turn" || step.maneuver.type === "roundabout") {
        priority = 1
      } else if (step.maneuver.type === "arrive") {
        priority = 1
      }

      instructions.push({
        text: instruction,
        distance: cumulativeDistance,
        announced: false,
        priority,
      })

      cumulativeDistance += step.distance
    })

    return instructions
  }, [])

  // Sistema de anuncios de voz cada 30 segundos
  const handleVoiceAnnouncements = useCallback(() => {
    if (!voiceEnabled || !routeStarted) return

    const { distance } = currentRouteDataRef.current

    // Buscar instrucción próxima no anunciada
    const upcomingInstruction = voiceInstructionsRef.current.find(
      (instruction) => !instruction.announced && distance <= instruction.distance + 300 && instruction.priority <= 2,
    )

    if (upcomingInstruction) {
      speakInstruction(upcomingInstruction.text)
      upcomingInstruction.announced = true
      return
    }

    // Anuncio de distancia
    if (distance > 50) {
      let distanceText = ""
      if (distance > 1000) {
        const km = Math.round(distance / 100) / 10
        distanceText = `Continúe recto. Faltan ${km} kilómetros para llegar al destino`
      } else {
        const meters = Math.round(distance / 50) * 50
        distanceText = `Continúe recto. Faltan ${meters} metros para llegar al destino`
      }
      speakInstruction(distanceText)
    } else if (distance <= 50 && distance > 0) {
      speakInstruction("Está llegando a su destino")
    }
  }, [voiceEnabled, routeStarted, speakInstruction])

  // Intervalo de voz cada 30 segundos
  useEffect(() => {
    if (routeStarted && voiceEnabled) {
      if (voiceIntervalRef.current) {
        clearInterval(voiceIntervalRef.current)
      }

      setTimeout(() => {
        handleVoiceAnnouncements()
      }, 2000)

      voiceIntervalRef.current = setInterval(() => {
        handleVoiceAnnouncements()
      }, 30000)

      return () => {
        if (voiceIntervalRef.current) {
          clearInterval(voiceIntervalRef.current)
        }
      }
    } else {
      if (voiceIntervalRef.current) {
        clearInterval(voiceIntervalRef.current)
        voiceIntervalRef.current = null
      }
    }
  }, [routeStarted, voiceEnabled, handleVoiceAnnouncements])

  // Initialize map only once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || !delivery) return

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: mapCenter,
      zoom: 14,
      pitch: 0,
      bearing: 0,
      interactive: true,
      attributionControl: false,
    })

    mapInstanceRef.current = map

    map.on("load", () => {
      setIsLoading(false)
      // Add destination marker
      destinationMarkerRef.current = new maplibregl.Marker({
        color: "#10B981",
        scale: 1.2,
      })
        .setLngLat([delivery.lng, delivery.lat])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setText("🎯 Destino de entrega"))
        .addTo(map)
    })

    // Add navigation controls
    map.addControl(new maplibregl.NavigationControl(), "top-right")

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel()
      }
      if (voiceIntervalRef.current) {
        clearInterval(voiceIntervalRef.current)
      }
      map.remove()
      mapInstanceRef.current = null
    }
  }, [delivery, mapCenter])

  // Calculate initial route
  const calculateInitialRoute = useCallback(async () => {
    const map = mapInstanceRef.current
    if (!map || !start || !delivery || !map.isStyleLoaded()) return

    try {
      // Add start marker
      if (!startMarkerRef.current) {
        startMarkerRef.current = new maplibregl.Marker({
          color: "#3B82F6",
          scale: 1.1,
        })
          .setLngLat([start.lng, start.lat])
          .setPopup(new maplibregl.Popup({ offset: 25 }).setText("🚀 Punto de inicio"))
          .addTo(map)
      }

      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${delivery.lng},${delivery.lat}?overview=full&geometries=geojson&steps=true`,
      )
      const data = await response.json()
      const route = data.routes?.[0]
      if (!route) throw new Error("No route found")

      routeDataRef.current = route
      setDistanceKm(route.distance / 1000)
      setDurationMin(route.duration / 60)

      // Procesar instrucciones de voz
      voiceInstructionsRef.current = processRouteSteps(route)

      // Actualizar datos de ruta para voz
      currentRouteDataRef.current = {
        distance: route.distance,
        duration: route.duration,
        currentLocation: start,
      }

      const geojson: GeoJSON.Feature = {
        type: "Feature",
        geometry: route.geometry,
        properties: {},
      }

      // Remove existing route if any
      if (map.getSource("initialRoute")) {
        map.removeLayer("initialRoute")
        map.removeSource("initialRoute")
      }

      // Add route source and layer
      map.addSource("initialRoute", {
        type: "geojson",
        data: geojson,
      })

      map.addLayer({
        id: "initialRoute",
        type: "line",
        source: "initialRoute",
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#3B82F6",
          "line-width": 5,
          "line-opacity": 0.8,
        },
      })

      // Fit bounds with animation
      const bounds = route.geometry.coordinates.reduce(
        (bounds: maplibregl.LngLatBounds, coord: [number, number]) => bounds.extend(coord),
        new maplibregl.LngLatBounds(route.geometry.coordinates[0], route.geometry.coordinates[0]),
      )

      map.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        duration: 1000,
      })
    } catch (error) {
      console.error("Error calculating initial route:", error)
    }
  }, [start, delivery, processRouteSteps])

  // Update live route
  const updateLiveRoute = useCallback(
    async (pos: Coordinates) => {
      const map = mapInstanceRef.current
      if (!map || !delivery) return

      const bearing = getBearing(pos, delivery)

      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${pos.lng},${pos.lat};${delivery.lng},${delivery.lat}?overview=full&geometries=geojson&steps=true`,
        )
        const data = await response.json()
        const route = data.routes?.[0]
        if (!route) return

        setDistanceKm(route.distance / 1000)
        setDurationMin(route.duration / 60)
        setCurrentLocation(pos)

        // Actualizar datos para voz
        currentRouteDataRef.current = {
          distance: route.distance,
          duration: route.duration,
          currentLocation: pos,
        }

        // Actualizar instrucciones de voz
        voiceInstructionsRef.current = processRouteSteps(route)

        const geojson: GeoJSON.Feature = {
          type: "Feature",
          geometry: route.geometry,
          properties: {},
        }

        // Update live route
        if (map.getSource("liveRoute")) {
          ;(map.getSource("liveRoute") as any).setData(geojson)
        } else {
          map.addSource("liveRoute", {
            type: "geojson",
            data: geojson,
          })
          map.addLayer({
            id: "liveRoute",
            type: "line",
            source: "liveRoute",
            layout: {
              "line-cap": "round",
              "line-join": "round",
            },
            paint: {
              "line-color": "#EF4444",
              "line-width": 6,
              "line-opacity": 0.9,
            },
          })
        }

        // Update or create current location marker
        if (markerRef.current) {
          markerRef.current.setLngLat([pos.lng, pos.lat])
          const el = markerRef.current.getElement()
          el.style.transform = `rotate(${bearing}deg)`
        } else {
          const el = document.createElement("div")
          el.className = "current-location-marker"
          el.style.width = "32px"
          el.style.height = "32px"
          el.style.backgroundImage =
            "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTIiIGZpbGw9IiMzQjgyRjYiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjxwb2x5Z29uIHBvaW50cz0iMTYsOCAxMiwxNiAyMCwxNiIgZmlsbD0iI0ZGRkZGRiIvPgo8L3N2Zz4K')"
          el.style.backgroundSize = "contain"
          el.style.transform = `rotate(${bearing}deg)`
          el.style.transformOrigin = "center"
          markerRef.current = new maplibregl.Marker({ element: el })
            .setLngLat([pos.lng, pos.lat])
            .setPopup(new maplibregl.Popup({ offset: 25 }).setText("📍 Tu ubicación actual"))
            .addTo(map)
        }

        // Smooth camera movement
        map.easeTo({
          center: [pos.lng, pos.lat],
          zoom: 17,
          bearing: bearing,
          pitch: 45,
          duration: 1500,
        })
      } catch (error) {
        console.error("Error updating live route:", error)
      }
    },
    [delivery, processRouteSteps],
  )

  // Start live tracking
  const startLiveTracking = useCallback(() => {
    if (!navigator.geolocation) {
      alert("La geolocalización no está disponible en este navegador")
      return
    }

    setRouteStarted(true)
    const map = mapInstanceRef.current
    if (!map) return

    // Remove initial route
    if (map.getLayer("initialRoute")) {
      map.removeLayer("initialRoute")
    }
    if (map.getSource("initialRoute")) {
      map.removeSource("initialRoute")
    }

    // Anuncio de inicio de navegación
    if (voiceEnabled) {
      speakInstruction("Iniciando navegación por voz. Recibirá indicaciones cada 30 segundos")
    }

    // Start watching position
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    }

    const handleSuccess = (position: GeolocationPosition) => {
      const pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      }
      updateLiveRoute(pos)
    }

    const handleError = (error: GeolocationPositionError) => {
      console.error("Geolocation error:", error)
    }

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options)
    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, options)
  }, [updateLiveRoute, voiceEnabled, speakInstruction])

  const centerOnLocation = useCallback(() => {
    const map = mapInstanceRef.current
    if (!map || !currentLocation) return

    map.easeTo({
      center: [currentLocation.lng, currentLocation.lat],
      zoom: 17,
      duration: 1000,
    })
  }, [currentLocation])

  // Toggle voice
  const toggleVoice = useCallback(() => {
    const newVoiceState = !voiceEnabled
    setVoiceEnabled(newVoiceState)

    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel()
    }

    if (newVoiceState) {
      speakInstruction("Indicaciones de voz activadas")
    } else {
      setCurrentInstruction("")
    }
  }, [voiceEnabled, speakInstruction])

  useEffect(() => {
    if (!isLoading && start && delivery) {
      calculateInitialRoute()
    }
  }, [isLoading, start, delivery, calculateInitialRoute])

  const statusMessage = useMemo(() => {
    if (user?.rol === "Client" && orderstatus === "Pending") {
      return "📦 Su pedido aún no ha sido aceptado"
    }
    return null
  }, [user?.rol, orderstatus])

  // Memoized route info
  const routeInfo = useMemo(() => {
    if (distanceKm !== null && durationMin !== null && orderstatus === "En camino") {
      return {
        distance: distanceKm.toFixed(2),
        duration: Math.round(durationMin),
        isLive: routeStarted,
      }
    }
    return null
  }, [distanceKm, durationMin, orderstatus, routeStarted])

  if (!delivery) {
    return (
      <div className="error-container">
        <span className="error-icon">⚠️</span>
        <span>Coordenadas de destino inválidas</span>
      </div>
    )
  }

  return (
    <div className="maps-container">
      {/* Map Container */}
      <div className="map-wrapper">
        <div ref={mapRef} className="map-element" />
        {/* Loading Overlay */}
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <span>Cargando mapa...</span>
          </div>
        )}
        {routeStarted && currentLocation && (
          <button className="center-button-icon" onClick={centerOnLocation} title="Centrar en mi ubicación">
            <span className="center-icon"><Locate></Locate></span>
          </button>
        )}
        {/* Voice Toggle Button */}
        {routeStarted && (
          <button
            className={`voice-button-icon ${voiceEnabled ? "voice-enabled" : "voice-disabled"}`}
            onClick={toggleVoice}
            title={voiceEnabled ? "Desactivar voz" : "Activar voz"}
          >
            <span className="voice-icon">
              {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </span>
          </button>
        )}
      </div>

      {/* Current Voice Instruction */}
      {routeStarted && currentInstruction && (
        <div className="voice-instruction">
          <div className="instruction-icon">🗣️</div>
          <div className="instruction-text">{currentInstruction}</div>
          <div className="announcement-counter">#{announcementCount}</div>
        </div>
      )}

      {/* Status Messages */}
      {statusMessage && <div className="status-message pending">{statusMessage}</div>}

      {/* Route Information */}
      {routeInfo && (
        <div className={`route-info ${routeInfo.isLive ? "live" : "initial"}`}>
          <div className="route-stats">
            <div className="stat">
              <span className="stat-icon"><Ruler></Ruler></span>
              <span className="stat-value">{routeInfo.distance} km</span>
            </div>
            <div className="stat-divider">|</div>
            <div className="stat">
              <span className="stat-icon"><Timer></Timer></span>
              <span className="stat-value">{routeInfo.duration} min</span>
            </div>
            {routeInfo.isLive && (
              <>
                <div className="stat-divider">|</div>
                <div className="stat live-indicator">
                  <span className="live-dot"></span>
                  <span className="stat-value">En vivo</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Control Button */}
      {orderstatus === "En camino" && start && user?.rol === "Delivery" && (
        <button
          className={`control-button ${routeStarted ? "started" : "ready"}`}
          onClick={startLiveTracking}
          disabled={routeStarted}
        >
          <span className="button-icon">{routeStarted ? "🟢" : <CarTaxiFrontIcon></CarTaxiFrontIcon>}</span>
          <span className="button-text">{routeStarted ? "Seguimiento activo" : "Iniciar seguimiento"}</span>
        </button>
      )}
    </div>
  )
})

MapsDeliveryPerson.displayName = "MapsDeliveryPerson"
export default MapsDeliveryPerson
