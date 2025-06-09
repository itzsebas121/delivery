"use client"

import {  useState } from "react"
import { X, MapPin, Navigation, CheckCircle, Phone, User, DollarSign, Loader2, Calendar } from "lucide-react"
import { useAlert } from "../../../components/Alerts/Alert-system"
import MapsDeliveryPerson from "../../../components/Maps/MapsDeliveryPerson"
import "./OrderDeliveryModal.css"

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
  const [loadingLocation, setLoadingLocation] = useState<boolean>(false)
  const [loadingRoute, setLoadingRoute] = useState<boolean>(false)
  const { showSuccess, showError } = useAlert()

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

  const handleStartRoute = async () => {
    setLoadingRoute(true)
    try {
      setLoadingLocation(true)
      const location = await getCurrentLocation()
      setLoadingLocation(false)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`

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
        <div className="map-header">
          <h3>
            <Navigation size={16} />
            Mapa de Navegación
          </h3>
        </div>
        <div className="modal-body-dp">
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
            </div>

            <div className="delivery-map">

              <div className="map-container" style={{ height: "100%", display: "flex", flexDirection: "column"}}>
                <MapsDeliveryPerson
                  startCoordinates={order.StartCoordinates || ","}
                  deliveryCoordinates={order.DeliveryCoordinates || ","}
                  orderstatus={order.Status}
                />
              </div>
            </div>
          </div>

        </div>
        <div className="modal-actions-dp">
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
                  Marcar Ruta
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
  )
}
