import { useState, useEffect } from "react"
import { baseURLRest } from "../../../config"
import { Calendar, DollarSign, ShoppingBag, Truck, User, X } from "lucide-react"

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
  const [error, setError] = useState<string | null>(null)

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
        setError("Error al cargar los detalles de la orden. Por favor, intente nuevamente.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [orderId])

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-container modal-details">
          <div className="modal-header">
            <h2>Detalles de la Orden #{orderId}</h2>
            <button className="modal-close" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
          <div className="modal-body">
            <div className="modal-loading">
              <div className="orders-loader"></div>
              <p>Cargando detalles de la orden...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="modal-overlay">
        <div className="modal-container modal-details">
          <div className="modal-header">
            <h2>Detalles de la Orden #{orderId}</h2>
            <button className="modal-close" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
          <div className="modal-body">
            <div className="modal-error">
              <p>{error}</p>
              <button onClick={() => window.location.reload()} className="order-btn">
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (orderDetails.length === 0) {
    return (
      <div className="modal-overlay">
        <div className="modal-container modal-details">
          <div className="modal-header">
            <h2>Detalles de la Orden #{orderId}</h2>
            <button className="modal-close" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
          <div className="modal-body">
            <div className="modal-error">
              <p>No se encontraron detalles para esta orden.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Tomamos el primer elemento para obtener la información general de la orden
  const orderInfo = orderDetails[0]

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

  return (
    <div className="modal-overlay">
      <div className="modal-container modal-details">
        <div className="modal-header">
          <h2>Orden #{orderInfo.OrderId}</h2>
          <div className="modal-header-status">
            <span className={`order-status order-status-${orderInfo.Status.toLowerCase().replace(" ", "-")}`}>
              {orderInfo.Status}
            </span>
            <button className="modal-close" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="order-details-modal-body">
          <div className="order-details-content">
            <div className="order-details-info">
              <div className="order-details-card">
                <h3>
                  <Calendar size={18} /> Información de la Orden
                </h3>
                <div className="order-info-grid">
                  <div className="info-item">
                    <span className="info-label">Fecha:</span>
                    <span className="info-value">{formatDate(orderInfo.OrderDate)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Estado:</span>
                    <span className="info-value">{orderInfo.Status}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Dirección:</span>
                    <span className="info-value">{orderInfo.DeliveryAddress}</span>
                  </div>
                </div>
              </div>

              <div className="order-details-card">
                <h3>
                  <User size={18} /> Información del Cliente
                </h3>
                <div className="order-info-grid">
                  <div className="info-item">
                    <span className="info-label">Nombre:</span>
                    <span className="info-value">{orderInfo.ClientName}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{orderInfo.ClientEmail}</span>
                  </div>
                </div>
              </div>

              {orderInfo.DeliveryPersonName && (
                <div className="order-details-card">
                  <h3>
                    <Truck size={18} /> Información del Repartidor
                  </h3>
                  <div className="order-info-grid">
                    <div className="info-item">
                      <span className="info-label">Nombre:</span>
                      <span className="info-value">{orderInfo.DeliveryPersonName}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Email:</span>
                      <span className="info-value">{orderInfo.DeliveryPersonEmail}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="order-details-card">
                <h3>
                  <DollarSign size={18} /> Resumen de Pago
                </h3>
                <div className="order-info-grid">
                  <div className="info-item">
                    <span className="info-label">Subtotal:</span>
                    <span className="info-value">${orderInfo.Subtotal.toFixed(2)}</span>
                  </div>
                  {orderInfo.DiscountPercentage > 0 && (
                    <div className="info-item">
                      <span className="info-label">Descuento:</span>
                      <span className="info-value">{orderInfo.DiscountPercentage}%</span>
                    </div>
                  )}
                  <div className="info-item">
                    <span className="info-label">Total:</span>
                    <span className="info-value">${orderInfo.TotalWithDiscount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-details-products">
              <h3>
                <ShoppingBag size={18} /> Productos
              </h3>
              <div className="order-products-list">
                <div className="order-product-header">
                  <span className="product-col product-name">Producto</span>
                  <span className="product-col product-price">Precio</span>
                  <span className="product-col product-quantity">Cantidad</span>
                  <span className="product-col product-total">Total</span>
                </div>

                {orderDetails.map((item, index) => (
                  <div className="order-product-item" key={`${item.ProductId}-${index}`}>
                    <span className="product-col product-name">{item.ProductName}</span>
                    <span className="product-col product-price">${item.UnitPrice.toFixed(2)}</span>
                    <span className="product-col product-quantity">{item.Quantity}</span>
                    <span className="product-col product-total">${item.TotalPrice.toFixed(2)}</span>
                  </div>
                ))}

                <div className="order-product-footer">
                  <div className="order-totals">
                    <div className="total-row">
                      <span>Subtotal:</span>
                      <span>${orderInfo.Subtotal.toFixed(2)}</span>
                    </div>
                    {orderInfo.DiscountPercentage > 0 && (
                      <div className="total-row">
                        <span>Descuento ({orderInfo.DiscountPercentage}%):</span>
                        <span>-${(orderInfo.Subtotal - orderInfo.TotalWithDiscount).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="total-row total-final">
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
  )
}
