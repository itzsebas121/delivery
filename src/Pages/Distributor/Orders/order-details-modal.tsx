"use client"

import { useState, useEffect } from "react"
import { baseURLRest } from "../../../config"
import { Clock, MapPin, User, X, Loader2, ShoppingBag } from "lucide-react"
import { useAlert } from "../../../components/Alerts/Alert-system"
import "./OrderDetailsModal.css"

interface OrderDetail {
  OrderId: number
  OrderDate: string
  Status: string
  DeliveryAddress: string
  ClientName: string
  ClientEmail: string
  DeliveryPersonName: string | null
  DeliveryPersonEmail: string | null
  Subtotal: number
  DiscountPercentage: number
  TotalWithDiscount: number
  ProductId: number
  ProductName: string
  Quantity: number
  UnitPrice: number
  TotalPrice: number
}

interface OrderDetailsModalProps {
  orderId: number
  onClose: () => void
}

export default function OrderDetailsModal({ orderId, onClose }: OrderDetailsModalProps) {
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const { showError } = useAlert()

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true)
      try {
        const response = await fetch(`${baseURLRest}/orders-details/${orderId}`)
        if (!response.ok) {
          throw new Error("Error al obtener los detalles de la orden")
        }
        const data = await response.json()
        setOrderDetails(data)
      } catch (err) {
        showError("Error", "Error al cargar los detalles de la orden. Por favor, intente nuevamente.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [orderId, showError])

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
    return new Date(dateString).toLocaleDateString("es-ES", options)
  }

  if (loading) {
    return (
      <div className="odm-overlay">
        <div className="odm-container">
          <div className="odm-header">
            <h2>Orden #{orderId}</h2>
            <button className="odm-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <div className="odm-loading">
            <Loader2 size={30} className="odm-spinner" />
            <p>Cargando detalles de la orden...</p>
          </div>
        </div>
      </div>
    )
  }

  if (orderDetails.length === 0) {
    return (
      <div className="odm-overlay">
        <div className="odm-container">
          <div className="odm-header">
            <h2>Orden #{orderId}</h2>
            <button className="odm-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <div className="odm-empty">
            <p>No se encontraron detalles para esta orden.</p>
          </div>
        </div>
      </div>
    )
  }

  // Tomamos el primer elemento para obtener la información general de la orden
  const orderInfo = orderDetails[0]

  return (
    <div className="odm-overlay" onClick={onClose}>
      <div className="odm-container" onClick={(e) => e.stopPropagation()}>
        <div className="odm-header">
          <h2>Orden #{orderInfo.OrderId}</h2>
          <div className="odm-status-badge">
            <Clock size={16} />
            <span>{orderInfo.Status}</span>
          </div>
          <button className="odm-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="odm-content">
          <div className="odm-columns">
            {/* Columna izquierda - Información */}
            <div className="odm-column">
              <div className="odm-section">
                <div className="odm-section-header">
                  <Clock size={18} />
                  <h3>Información de la Orden</h3>
                </div>
                <div className="odm-section-content">
                  <div className="odm-info-row">
                    <span className="odm-info-label">
                      <Clock size={14} /> Fecha:
                    </span>
                    <span className="odm-info-value">{formatDate(orderInfo.OrderDate)}</span>
                  </div>
                  <div className="odm-info-row">
                    <span className="odm-info-label">
                      <Clock size={14} /> Estado:
                    </span>
                    <span className="odm-info-value">
                      <span className={`odm-status odm-status-${orderInfo.Status.toLowerCase().replace(" ", "-")}`}>
                        {orderInfo.Status}
                      </span>
                    </span>
                  </div>
                  <div className="odm-info-row">
                    <span className="odm-info-label">
                      <MapPin size={14} /> Dirección:
                    </span>
                    <span className="odm-info-value">{orderInfo.DeliveryAddress}</span>
                  </div>
                </div>
              </div>

              <div className="odm-section">
                <div className="odm-section-header">
                  <User size={18} />
                  <h3>Información del Cliente</h3>
                </div>
                <div className="odm-section-content">
                  <div className="odm-info-row">
                    <span className="odm-info-label">
                      <User size={14} /> Nombre:
                    </span>
                    <span className="odm-info-value">{orderInfo.ClientName}</span>
                  </div>
                  <div className="odm-info-row">
                    <span className="odm-info-label">Email:</span>
                    <span className="odm-info-value">{orderInfo.ClientEmail}</span>
                  </div>
                </div>
              </div>

              {orderInfo.DeliveryPersonName && (
                <div className="odm-section">
                  <div className="odm-section-header">
                    <User size={18} />
                    <h3>Información del Repartidor</h3>
                  </div>
                  <div className="odm-section-content">
                    <div className="odm-info-row">
                      <span className="odm-info-label">
                        <User size={14} /> Nombre:
                      </span>
                      <span className="odm-info-value">{orderInfo.DeliveryPersonName}</span>
                    </div>
                    <div className="odm-info-row">
                      <span className="odm-info-label">Email:</span>
                      <span className="odm-info-value">{orderInfo.DeliveryPersonEmail}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Columna derecha - Productos */}
            <div className="odm-column">
              <div className="odm-section">
                <div className="odm-section-header">
                  <ShoppingBag size={18} />
                  <h3>Productos ({orderDetails.length})</h3>
                </div>

                <div className="odm-products">
                  <div className="odm-products-header">
                    <div className="odm-product-col odm-product-name">Producto</div>
                    <div className="odm-product-col odm-product-price">Precio</div>
                    <div className="odm-product-col odm-product-qty">Cant</div>
                    <div className="odm-product-col odm-product-total">Total</div>
                  </div>

                  <div className="odm-products-body">
                    {orderDetails.map((item, index) => (
                      <div className="odm-product-row" key={`${item.ProductId}-${index}`}>
                        <div className="odm-product-col odm-product-name">
                          <div className="odm-product-info">
                            <span>{item.ProductName}</span>
                            <small>ID: {item.ProductId}</small>
                          </div>
                        </div>
                        <div className="odm-product-col odm-product-price">${item.UnitPrice.toFixed(2)}</div>
                        <div className="odm-product-col odm-product-qty">{item.Quantity}</div>
                        <div className="odm-product-col odm-product-total">${item.TotalPrice.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>

                  <div className="odm-products-footer">
                    <div className="odm-totals">
                      <div className="odm-total-row">
                        <span>Subtotal:</span>
                        <span>${orderInfo.Subtotal.toFixed(2)}</span>
                      </div>
                      {orderInfo.DiscountPercentage > 0 && (
                        <div className="odm-total-row odm-discount">
                          <span>Descuento ({orderInfo.DiscountPercentage}%):</span>
                          <span>-${(orderInfo.Subtotal - orderInfo.TotalWithDiscount).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="odm-total-row odm-final-total">
                        <span>Total:</span>
                        <span>${orderInfo.TotalWithDiscount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
