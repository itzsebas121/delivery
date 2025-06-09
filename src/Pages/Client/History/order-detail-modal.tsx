"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  X,
  Package,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  DollarSign,
  ShoppingCart,
  Loader2,
  AlertCircle,
  RotateCcw,
  Locate,
} from "lucide-react"
import { baseURLRest } from "../../../config"
import "./order-details-modal.css"
import MapsDeliveryPerson from "../../../components/Maps/MapsDeliveryPerson"
interface OrderDetail {
  ProductId: number
  ProductName: string
  Quantity: number
  Price: number
  Subtotal: number
}

interface OrderDetailsModalProps {
  orderId: number
  onClose: () => void
  order: {
    orderId: number
    orderDate: string
    status: string
    deliveryAddress: string
    DeliveryCoordinates: string
    StartCoordinates: string
  }
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ order, orderId, onClose }) => {
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    fetchOrderDetails()
  }, [orderId])

  const fetchOrderDetails = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${baseURLRest}/order-detail/${orderId}`)
      if (!response.ok) {
        throw new Error("Error al cargar los detalles del pedido")
      }

      const data: OrderDetail[] = await response.json()
      setOrderDetails(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const getTotalAmount = () => {
    return orderDetails.reduce((total, item) => total + item.Subtotal, 0)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock size={16} />
      case "in transit":
        return <Truck size={16} />
      case "completed":
        return <CheckCircle size={16} />
      case "cancelled":
        return <XCircle size={16} />
      default:
        return <Package size={16} />
    }
  }

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "Pendiente"
      case "in transit":
        return "En tránsito"
      case "completed":
        return "Completado"
      case "cancelled":
        return "Cancelado"
      default:
        return status
    }
  }

  return (
    <div className="order-details-overlay" role="dialog" aria-modal="true">
      <div className="order-details-modal">
        {/* Header */}
        <div className="order-details-header">
          <h2 className="order-details-title">
            <Package size={24} />
            Detalles del Pedido #{orderId}
          </h2>
          <button onClick={onClose} className="order-details-close">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="order-details-content">
          {loading ? (
            <div className="order-details-loading">
              <Loader2 className="order-details-spinner" size={32} />
              <p>Cargando detalles del pedido...</p>
            </div>
          ) : error ? (
            <div className="order-details-error">
              <AlertCircle className="order-details-error-icon" size={48} />
              <h3 className="order-details-error-title">Error al cargar detalles</h3>
              <p className="order-details-error-text">{error}</p>
              <button onClick={fetchOrderDetails} className="order-details-retry-btn">
                <RotateCcw size={16} />
                Reintentar
              </button>
            </div>
          ) : (
            <>
              {/* Información del pedido */}
              <div className="order-info-section">
                <h3 className="order-section-title-m">
                  <Package size={20} />
                  Información del Pedido
                </h3>
                <div className="order-info-grid-m">
                  <div className="order-info-item">
                    <span className="order-info-label">
                      <Calendar size={14} />
                      Fecha del pedido
                    </span>
                    <span className="order-info-value">{formatDate(order.orderDate)}</span>
                  </div>

                  <div className="order-info-item">
                    <span className="order-info-label">
                      <Package size={14} />
                      Estado
                    </span>
                    <span className={`order-info-status ${order.status.toLowerCase().replace(" ", "-")}`}>
                      {getStatusIcon(order.status)}
                      {getStatusText(order.status)}
                    </span>
                  </div>

                  <div className="order-info-item">
                    <span className="order-info-label">
                      <MapPin size={14} />
                      Dirección de entrega
                    </span>
                    <span className="order-info-value">{order.deliveryAddress}</span>
                  </div>


                </div>
              </div>

              {/* Productos */}
              <div className="order-products-section">
                <h3 className="order-section-title-m">
                  <ShoppingCart size={20} />
                  Productos ({orderDetails.length})
                </h3>
                <div className="order-products-list">
                  <div className="order-products-header">
                    <span>Producto</span>
                    <span>Cantidad</span>
                    <span>Precio</span>
                    <span>Subtotal</span>
                  </div>

                  {orderDetails.map((item) => (
                    <div key={item.ProductId} className="order-product-item">
                      <span className="order-product-name">
                        <Package size={16} />
                        {item.ProductName}
                      </span>
                      <span className="order-product-quantity">{item.Quantity}</span>
                      <span className="order-product-price">${item.Price.toFixed(2)}</span>
                      <span className="order-product-subtotal">${item.Subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="order-total-section">
                <div className="order-total-row">
                  <span className="order-total-label">
                    <ShoppingCart size={18} />
                    Subtotal ({orderDetails.length} productos)
                  </span>
                  <span className="order-total-value">${getTotalAmount().toFixed(2)}</span>
                </div>

                <div className="order-total-row">
                  <span className="order-total-label">
                    <Truck size={18} />
                    Envío
                  </span>
                  <span className="order-total-value">Gratis</span>
                </div>

                <div className="order-total-row">
                  <span className="order-total-label order-total-final">
                    <DollarSign size={20} />
                    Total
                  </span>
                  <span className="order-total-value order-total-final">${getTotalAmount().toFixed(2)}</span>
                </div>
              </div>
              <div className="order-info-section">
                <h3 className="order-section-title-m">
                  <Locate size={20} />
                  Lugar de entrega
                </h3>
                <div className="map">
                  <MapsDeliveryPerson
                    startCoordinates={order.StartCoordinates || ","}
                    deliveryCoordinates={order.DeliveryCoordinates || ","}
                    orderstatus={order.status}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default OrderDetailsModal
