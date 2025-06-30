"use client"

import { useEffect, useRef, useState, useCallback, useMemo, memo } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import "./maps-delivery-person.css"
import { useAuth } from "../../context/Authcontext"
import {  CarTaxiFrontIcon,  Locate, Ruler, Timer } from "lucide-react"


interface Props {
  startCoordinates: string
  deliveryCoordinates: string
  orderstatus: string
}
interface Coordinates {
  lat: number
  lng: number
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

const MapsDeliveryPerson = memo(({ startCoordinates, deliveryCoordinates, orderstatus }: Props) => {
  const { user } = useAuth()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const startMarkerRef = useRef<maplibregl.Marker | null>(null)
  const destinationMarkerRef = useRef<maplibregl.Marker | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const routeDataRef = useRef<any>(null)

  const [routeStarted, setRouteStarted] = useState(false)
  const [distanceKm, setDistanceKm] = useState<number | null>(null)
  const [durationMin, setDurationMin] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null)

  // Memoized coordinates
  const start = useMemo(() => parseCoordinates(startCoordinates), [startCoordinates])
  const delivery = useMemo(() => parseCoordinates(deliveryCoordinates), [deliveryCoordinates])

  // Memoized map center
  const mapCenter = useMemo((): [number, number] => {
    return delivery ? [delivery.lng, delivery.lat] : [0, 0]
  }, [delivery])

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

      const geojson: GeoJSON.Feature = {
        type: "Feature" as const,
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
  }, [start, delivery])

  // Update live route
  const updateLiveRoute = useCallback(
    async (pos: Coordinates) => {
      const map = mapInstanceRef.current
      if (!map || !delivery) return

      const bearing = getBearing(pos, delivery)

      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${pos.lng},${pos.lat};${delivery.lng},${delivery.lat}?overview=full&geometries=geojson`,
        )
        const data = await response.json()
        const route = data.routes?.[0]

        if (!route) return

        setDistanceKm(route.distance / 1000)
        setDurationMin(route.duration / 60)
        setCurrentLocation(pos)

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
    [delivery],
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

    // Get initial position
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options)

    // Watch position
    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, options)
  }, [updateLiveRoute])

  // Center map on current location
  const centerOnLocation = useCallback(() => {
    const map = mapInstanceRef.current
    if (!map || !currentLocation) return

    map.easeTo({
      center: [currentLocation.lng, currentLocation.lat],
      zoom: 17,
      duration: 1000,
    })
  }, [currentLocation])

  // Calculate initial route when dependencies change
  useEffect(() => {
    if (!isLoading && start && delivery) {
      calculateInitialRoute()
    }
  }, [isLoading, start, delivery, calculateInitialRoute])

  // Memoized status message
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

        {/* Center Button - Only show when route is started */}
        {routeStarted && currentLocation && (
          <button className="center-button-icon" onClick={centerOnLocation} title="Centrar en mi ubicación">
            <span className="center-icon"><Locate></Locate></span>
          </button>
        )}
      </div>

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
