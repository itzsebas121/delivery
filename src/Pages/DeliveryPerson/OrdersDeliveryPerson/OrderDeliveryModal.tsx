"use client"
import { useState, useEffect, useRef, useId } from "react"
import { X, MapPin, Navigation, CheckCircle, Clock, Phone, User, DollarSign, Route, Loader2, Calendar } from 'lucide-react'
import { useAlert } from "../../../components/Alerts/Alert-system"
import "./OrderDeliveryModal.css" // Ensure you have the correct path to your CSS file
interface Order {
  OrderId: number
  OrderDate: string
  DeliveryAddressName?: string
  DeliveryAddress: string
  DeliveryCoordinates?: string
  StartCoordinates?: string
  ClientName: string
  ClientPhone?: string
  Status: "En camino" | "Completada" | "Cancelada"
  Total: number
  IsRouteStarted?: boolean
  CompletionDate?: string
}

interface OrderDeliveryModalProps {
  order: Order
  onClose: () => void
  onStartRoute: (orderId: number, startLatitude: number, startLongitude: number) => Promise<void>
  onCompleteOrder: (orderId: number) => Promise<void>
  deliveryId: number
}

export default function OrderDeliveryModal({ order, onClose, onStartRoute, onCompleteOrder }: OrderDeliveryModalProps) {
  const mapContainerId = useId()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const isInitializingRef = useRef(false)
  const isMountedRef = useRef(true)

  const [estimatedTime, setEstimatedTime] = useState<string>("")
  const [estimatedDistance, setEstimatedDistance] = useState<string>("")
  const [loadingLocation, setLoadingLocation] = useState<boolean>(false)
  const [loadingRoute, setLoadingRoute] = useState<boolean>(false)
  const [mapLoaded, setMapLoaded] = useState<boolean>(false)
  const [mapError, setMapError] = useState<string>("")

  const { showSuccess, showError } = useAlert()

  // Parse coordinates safely
  const parseCoordinates = (coordString: string) => {
    if (!coordString || coordString.trim() === "" || coordString === ", ") return null
    try {
      const [lat, lng] = coordString.split(",").map((coord) => Number.parseFloat(coord.trim()))
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return null
      return { lat, lng }
    } catch {
      return null
    }
  }

  const deliveryCoords = parseCoordinates(order.DeliveryCoordinates || "")
  const startCoords = parseCoordinates(order.StartCoordinates || "")

  // Cleanup map completely
  const cleanupMap = () => {
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove()
      } catch (e) {
        console.warn("Map cleanup warning:", e)
      }
      mapInstanceRef.current = null
    }

    if (mapRef.current) {
      mapRef.current.innerHTML = ""
      // Remove all Leaflet properties
      const element = mapRef.current as any
      Object.keys(element).forEach((key) => {
        if (key.startsWith("_leaflet")) {
          delete element[key]
        }
      })
    }

    setMapLoaded(false)
    setMapError("")
    isInitializingRef.current = false
  }

  // Initialize map with unique container
  const initializeMap = async () => {
    if (!isMountedRef.current || !mapRef.current || !deliveryCoords || isInitializingRef.current) {
      return
    }

    isInitializingRef.current = true
    setMapError("")

    try {
      // Clean up any existing map
      cleanupMap()

      // Wait for DOM to be ready
      await new Promise((resolve) => setTimeout(resolve, 200))

      if (!isMountedRef.current || !mapRef.current) {
        isInitializingRef.current = false
        return
      }

      // Set unique ID to container
      mapRef.current.id = `map-${mapContainerId.replace(/:/g, "")}`

      // Dynamic import Leaflet
      const L = (await import("leaflet")).default

      // Fix default markers
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      })

      if (!isMountedRef.current) {
        isInitializingRef.current = false
        return
      }

      // Create map
      const map = L.map(mapRef.current, {
        center: [deliveryCoords.lat, deliveryCoords.lng],
        zoom: 15,
        zoomControl: true,
        attributionControl: false,
      })

      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map)

      // Delivery marker
      const deliveryIcon = L.divIcon({
        html: `
          <div style="
            background: #e74c3c;
            width: 30px;
            height: 30px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 3px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              transform: rotate(45deg);
              color: white;
              font-size: 12px;
              font-weight: bold;
            ">📍</div>
          </div>
        `,
        className: "delivery-marker",
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      })

      // Add delivery marker
      const deliveryMarker = L.marker([deliveryCoords.lat, deliveryCoords.lng], { icon: deliveryIcon }).addTo(map)
      deliveryMarker.bindPopup(`
        <div style="text-align: center; padding: 8px;">
          <strong style="color: #e74c3c;">📍 Punto de Entrega</strong><br>
          <span style="color: #6c757d; font-size: 12px;">${order.DeliveryAddress}</span>
        </div>
      `)

      if (!isMountedRef.current) {
        map.remove()
        isInitializingRef.current = false
        return
      }

      mapInstanceRef.current = map
      setMapLoaded(true)

      // If route is started, display it
      if (startCoords && isMountedRef.current) {
        await displayRoute(L, map, startCoords, deliveryCoords)
      }
    } catch (error) {
      console.error("Error initializing map:", error)
      setMapError("Error al cargar el mapa")
      showError("Error", "No se pudo cargar el mapa")
    } finally {
      isInitializingRef.current = false
    }
  }

  // Display route between two points
  const displayRoute = async (
    L: any,
    map: any,
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
  ) => {
    try {
      console.log("Displaying route from:", start, "to:", end)

      // Start marker
      const startIcon = L.divIcon({
        html: `
          <div style="
            background: #27ae60;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="color: white; font-size: 10px; font-weight: bold;">🚗</div>
          </div>
        `,
        className: "start-marker",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })

      // Add start marker
      const startMarker = L.marker([start.lat, start.lng], { icon: startIcon }).addTo(map)
      startMarker.bindPopup(`
        <div style="text-align: center; padding: 8px;">
          <strong style="color: #27ae60;">🚗 Punto de Inicio</strong><br>
          <span style="color: #6c757d; font-size: 12px;">Tu ubicación actual</span>
        </div>
      `)

      // Get route from OSRM
      const routeUrl = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
      
      console.log("Fetching route from:", routeUrl)
      
      const response = await fetch(routeUrl)
      const data = await response.json()

      console.log("Route response:", data)

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0]
        const coordinates = route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]])

        console.log("Drawing route with", coordinates.length, "points")

        // Draw route line
        const routeLine = L.polyline(coordinates, {
          color: "#17a2b8",
          weight: 5,
          opacity: 0.8,
          smoothFactor: 1,
        }).addTo(map)

        // Calculate and set stats
        const duration = Math.round(route.duration / 60)
        const distance = (route.distance / 1000).toFixed(1)
        setEstimatedTime(`${duration} min`)
        setEstimatedDistance(`${distance} km`)

        console.log("Route stats:", { duration: `${duration} min`, distance: `${distance} km` })

        // Fit map to show entire route
        const bounds = L.latLngBounds([
          [start.lat, start.lng],
          [end.lat, end.lng],
        ])
        map.fitBounds(bounds, { padding: [30, 30] })

        console.log("Route displayed successfully")
      } else {
        console.error("No routes found in response:", data)
        throw new Error("No se encontró una ruta válida")
      }
    } catch (error) {
      console.error("Error displaying route:", error)
      showError("Error", "No se pudo calcular la ruta")
    }
  }

  // Get current location
  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocalización no soportada"))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          console.log("Current location obtained:", location)
          resolve(location)
        },
        (error) => {
          console.error("Geolocation error:", error)
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000,
        },
      )
    })
  }

  // Handle start route
  const handleStartRoute = async () => {
    if (!deliveryCoords || !mapInstanceRef.current) {
      showError("Error", "Mapa no disponible")
      return
    }

    setLoadingRoute(true)
    try {
      setLoadingLocation(true)
      const location = await getCurrentLocation()
      setLoadingLocation(false)

      console.log("Starting route from:", location, "to:", deliveryCoords)

      // Display route on map
      const L = (await import("leaflet")).default
      await displayRoute(L, mapInstanceRef.current, location, deliveryCoords)

      // Update backend
      await onStartRoute(order.OrderId, location.lat, location.lng)
      showSuccess("Ruta iniciada", "Navegación activada correctamente")
    } catch (error) {
      setLoadingLocation(false)
      console.error("Error starting route:", error)
      showError("Error", "No se pudo obtener tu ubicación")
    } finally {
      setLoadingRoute(false)
    }
  }

  // Format functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`

  // Effects
  useEffect(() => {
    isMountedRef.current = true
    
    // Initialize map after a short delay
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        initializeMap()
      }
    }, 300)

    return () => {
      isMountedRef.current = false
      clearTimeout(timer)
      cleanupMap()
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      cleanupMap()
    }
  }, [])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container delivery-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-section">
            <h2>
              <MapPin size={20} />
              Orden #{order.OrderId}
            </h2>
            <p className="modal-subtitle">{order.DeliveryAddressName || "Entrega a domicilio"}</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="delivery-content">
            {/* Info Panel */}
            <div className="delivery-info">
              {/* Client Info */}
              <div className="info-section">
                <h3>
                  <User size={16} />
                  Cliente
                </h3>
                <div className="info-grid">
                  <div className="info-item">
                    <User size={14} />
                    <span>{order.ClientName}</span>
                  </div>
                  {order.ClientPhone && (
                    <div className="info-item">
                      <Phone size={14} />
                      <a href={`tel:${order.ClientPhone}`} className="phone-link">
                        {order.ClientPhone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Info */}
              <div className="info-section">
                <h3>
                  <MapPin size={16} />
                  Entrega
                </h3>
                <div className="info-grid">
                  <div className="info-item">
                    <MapPin size={14} />
                    <span>{order.DeliveryAddress}</span>
                  </div>
                  <div className="info-item">
                    <DollarSign size={14} />
                    <span className="price">{formatCurrency(order.Total)}</span>
                  </div>
                  <div className="info-item">
                    <Calendar size={14} />
                    <span>{formatDate(order.OrderDate)}</span>
                  </div>
                </div>
              </div>

              {/* Route Status */}
              <div className="info-section">
                <h3>
                  <Route size={16} />
                  Estado de Ruta
                </h3>
                <div className="route-status">
                  {order.IsRouteStarted ? (
                    <div className="route-active">
                      <div className="status-badge active">
                        <Route size={12} />
                        Ruta Activa
                      </div>
                      {(estimatedTime || estimatedDistance) && (
                        <div className="route-stats">
                          {estimatedTime && (
                            <div className="stat">
                              <Clock size={12} />
                              {estimatedTime}
                            </div>
                          )}
                          {estimatedDistance && (
                            <div className="stat">
                              <Navigation size={12} />
                              {estimatedDistance}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="route-inactive">
                      <div className="status-badge inactive">
                        <Clock size={12} />
                        Sin Iniciar
                      </div>
                      <p>Presiona "Iniciar Ruta" para comenzar la navegación</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Map Panel */}
            <div className="delivery-map">
              <div className="map-header">
                <h3>
                  <Navigation size={16} />
                  Mapa de Navegación
                </h3>
                {(estimatedTime || estimatedDistance) && (
                  <div className="map-stats">
                    {estimatedTime && <span>{estimatedTime}</span>}
                    {estimatedDistance && <span>{estimatedDistance}</span>}
                  </div>
                )}
              </div>

              <div className="map-container">
                {!mapLoaded && !mapError && (
                  <div className="map-loading">
                    <Loader2 size={32} className="animate-spin" />
                    <p>Cargando mapa...</p>
                  </div>
                )}
                {mapError && (
                  <div className="map-error">
                    <p>{mapError}</p>
                    <button onClick={initializeMap} className="retry-btn">
                      Reintentar
                    </button>
                  </div>
                )}
                <div ref={mapRef} className="leaflet-map" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="modal-actions">
            {!order.IsRouteStarted && order.Status === "En camino" ? (
              <button className="btn-primary" onClick={handleStartRoute} disabled={loadingRoute || loadingLocation}>
                {loadingLocation ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Obteniendo ubicación...
                  </>
                ) : loadingRoute ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Iniciando ruta...
                  </>
                ) : (
                  <>
                    <Navigation size={16} />
                    Iniciar Ruta
                  </>
                )}
              </button>
            ) : order.IsRouteStarted && order.Status === "En camino" ? (
              <button className="btn-success" onClick={() => onCompleteOrder(order.OrderId)}>
                <CheckCircle size={16} />
                Completar Entrega
              </button>
            ) : null}

            <button className="btn-secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
