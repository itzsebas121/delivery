import type React from "react"

import { useEffect, useRef, useState } from "react"
import { X, MapPin, Check } from "lucide-react"
import LoadingSpinner from "../../../../components/Loading/LoadingSpinner"
import "./map-modal.css"

interface MapModalProps {
  onLocationSelect: (latitude: number, longitude: number, address: string) => void
  onClose: () => void
}

const MapModal = ({ onLocationSelect, onClose }: MapModalProps) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const markerRef = useRef<any>(null) // marcador activo

  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mapLibre, setMapLibre] = useState<any>(null)
  const [address, setAddress] = useState<string | null>(null)

  useEffect(() => {
    const loadMapLibre = async () => {
      try {
        const maplibregl = await import("maplibre-gl")
        await import("maplibre-gl/dist/maplibre-gl.css")
        setMapLibre(maplibregl.default)
      } catch (error) {
        console.error("Error loading MapLibre:", error)
        setIsLoading(false)
      }
    }

    loadMapLibre()
  }, [])

  useEffect(() => {
    if (!mapLibre || !mapContainer.current) return

    map.current = new mapLibre.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [-78.6197, -1.2543],
      zoom: 10,
    })

    map.current.on("load", () => {
      setIsLoading(false)
    })

    map.current.on("click", (e: any) => {
      const { lng, lat } = e.lngLat
      setSelectedLocation({ lat, lng })

      // Remover marcador anterior si existe
      if (markerRef.current) {
        markerRef.current.remove()
      }

      // Crear nuevo marcador
      const newMarker = new mapLibre.Marker({ color: "#ff6b35" })
        .setLngLat([lng, lat])
        .addTo(map.current)

      markerRef.current = newMarker

      // Obtener dirección con reverse geocoding
      fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
        .then((response) => response.json())
        .then((data) => {
          setAddress(data.display_name || "Dirección no encontrada")
        })
        .catch((error) => {
          console.error("Error obteniendo la dirección:", error)
          setAddress("Dirección no encontrada")
        })
    })

    return () => {
      if (map.current) {
        map.current.remove()
      }
    }
  }, [mapLibre])

  const handleConfirmLocation = () => {
    if (selectedLocation && address) {
      onLocationSelect(selectedLocation.lat, selectedLocation.lng, address)
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="map-modal-overlay" onClick={handleOverlayClick}>
      <div className="map-modal">
        <div className="map-modal-header">
          <h3 className="map-modal-title">
            <MapPin size={20} />
            Seleccionar Ubicación
          </h3>
          <button onClick={onClose} className="map-modal-close">
            <X size={20} />
          </button>
        </div>  

        <div className="map-modal-content">
          {isLoading && (
            <div className="map-loading">
              <LoadingSpinner size={32} />
              <p>Cargando mapa...</p>
            </div>
          )}

          <div ref={mapContainer} className={`map-container ${isLoading ? "map-hidden" : ""}`} />

          {address && (
            <div className="location-info">
              <div className="location-coordinates">
                <MapPin size={16} />
                <span>
                  <span>Dirección: {address}</span>
                </span>
              </div>
              
            </div>
          )}
        </div>

        <div className="map-modal-footer">
          <button onClick={onClose} className="map-modal-cancel">
            Cancelar
          </button>
          <button onClick={handleConfirmLocation} disabled={!selectedLocation} className="map-modal-confirm">
            <Check size={16} />
            Confirmar Dirección
          </button>
        </div>
      </div>
    </div>
  )
}

export default MapModal
