import React, { useEffect, useState } from "react"
import {
  CreditCard,
  MapPin,
  Package,
  DollarSign,
  X,
  Check,
  ArrowLeft,
  ShoppingCart,
  Building2,
  Loader2,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
} from "lucide-react"
import { baseURLRest } from "../../../config"
import "./checkout-modal.css"
import PayPal from "./PayPal/Paypal"

type CartItem = {
  ProductId: number
  ProductName: string
  Quantity: number
  Price: number
  CartId: number
}

type CheckoutModalProps = {
  onClose: () => void
  clientId: number
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ onClose, clientId }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartId, setCartId] = useState<number | null>(null)
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<"success" | "error" | "warning">("success")
  const [paymentMethod, setPaymentMethod] = useState<"traditional" | "paypal">("paypal")
  const [currentStep, setCurrentStep] = useState<"form" | "payment">("form")

  useEffect(() => {
    async function fetchCart() {
      try {
        const res = await fetch(`${baseURLRest}/get-cart/${clientId}`)
        if (!res.ok) throw new Error("No se pudo obtener el carrito")
        const data: CartItem[] = await res.json()
        setCartItems(data)
        if (data.length > 0) {
          setCartId(data[0].CartId)
        }
      } catch (error) {
        setMessage("Error al cargar el carrito")
        setMessageType("error")
      }
    }
    fetchCart()
  }, [clientId])

  useEffect(() => {
    return () => {
      console.log("Modal desmontado (se cerró desde afuera)");
    }
  }, [])

  useEffect(() => {
    setCurrentStep("form")
    setMessage(null)
    setLoading(false)
  }, [paymentMethod])

  const getTotal = () => {
    return cartItems.reduce((acc, item) => acc + (item.Price ?? 0) * (item.Quantity ?? 0), 0)
  }

  const validateForm = () => {
    if (!deliveryAddress.trim()) {
      setMessage("Por favor ingresa la dirección de entrega")
      setMessageType("warning")
      return false
    }
    if (!cartId) {
      setMessage("No hay carrito activo")
      setMessageType("warning")
      return false
    }
    return true
  }

  const handleTraditionalPay = async () => {
    if (!validateForm()) return
    setLoading(true)
    setMessage("Procesando pago tradicional...")
    setMessageType("success")
    await sendPayMentData()
  }

  const sendPayMentData = async () => {
    try {
      const res = await fetch(`${baseURLRest}/create-order-from-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId,
          deliveryAddress: deliveryAddress.trim(),
        }),
      })

      if (!res.ok) throw new Error("Error al crear la orden")
      const result = await res.json()
      setMessage(`¡Orden creada con éxito! ID: ${result.orderId}`)
      setMessageType("success")

      setTimeout(() => {
        setLoading(false)
        onClose()
      }, 2500)
    } catch (error) {
      setLoading(false)
      setMessage("Error al procesar el pago. Intenta nuevamente.")
      setMessageType("error")
    }
  }

  const handlePayPalSuccess = async () => {
    setLoading(true)
    setMessage("Procesando pago de PayPal...")
    setMessageType("success")
    await sendPayMentData()
  }

  const handlePayPalError = (_error: any) => {
    setMessage("Error en el pago con PayPal. Intenta nuevamente.")
    setMessageType("error")
    setCurrentStep("form")
  }

  const handlePayPalCancel = () => {
    setMessage("Pago cancelado")
    setMessageType("warning")
    setCurrentStep("form")
  }

  const handleProceedToPayment = () => {
    if (!validateForm()) return
    setMessage(null)

    if (paymentMethod === "traditional") {
      handleTraditionalPay()
    } else {
      setCurrentStep("payment")
    }
  }

  const handleBackToForm = () => {
    setCurrentStep("form")
    setMessage(null)
    setLoading(false)
  }

  const getMessageIcon = () => {
    switch (messageType) {
      case "success":
        return <CheckCircle size={20} />
      case "error":
        return <AlertCircle size={20} />
      case "warning":
        return <AlertTriangle size={20} />
      default:
        return null
    }
  }

  return (
    <div
      aria-modal="true"
      aria-labelledby="checkoutTitle"
      className="checkout-overlay"
    >
      <div className="checkout-modal">
        <div className="checkout-header">
          <h2 id="checkoutTitle" className="checkout-title">
            <CreditCard size={24} />
            Proceso de Pago 
          </h2>
          <button onClick={onClose} className="checkout-close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="checkout-content">
          {cartItems.length === 0 ? (
            <div className="checkout-empty">
              <ShoppingCart className="checkout-empty-icon" size={64} />
              <p className="checkout-empty-text">Tu carrito está vacío</p>
            </div>
          ) : (
            <>
              <div className="checkout-summary">
                <h3 className="checkout-section-title">
                  <Package size={20} />
                  Resumen del pedido
                </h3>
                <div className="checkout-summary-card">
                  {cartItems.map((item) => (
                    <div key={item.ProductId} className="checkout-item">
                      <span className="checkout-item-name">
                        {item.ProductName} × {item.Quantity}
                      </span>
                      <span className="checkout-item-price">
                        ${((item.Price ?? 0) * (item.Quantity ?? 0)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="checkout-total">
                    <span className="checkout-total-label">
                      <DollarSign size={20} />
                      Total:
                    </span>
                    <span className="checkout-total-amount">${getTotal().toFixed(2)} USD</span>
                  </div>
                </div>
              </div>

              {currentStep === "form" ? (
                <>
                  <div className="checkout-address">
                    <label htmlFor="deliveryAddress" className="checkout-label">
                      <MapPin size={20} />
                      Dirección de entrega
                    </label>
                    <input
                      id="deliveryAddress"
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Ej: Calle 123, Colonia, Ciudad, CP 12345"
                      className="checkout-input"
                      disabled={loading}
                    />
                    {message && (
                      <div role="alert" className={`checkout-message ${messageType}`}>
                        {getMessageIcon()}
                        {message}
                      </div>
                    )}
                  </div>

                  <div className="checkout-payment-methods">
                    <h3 className="checkout-section-title">
                      <CreditCard size={20} />
                      Método de pago
                    </h3>
                    <div className="checkout-payment-options">
                      <label
                        className={`checkout-payment-option ${paymentMethod === "paypal" ? "active paypal" : ""}`}
                      >
                        <input
                          type="radio"
                          value="paypal"
                          checked={paymentMethod === "paypal"}
                          onChange={(e) =>
                            setPaymentMethod(e.target.value as "traditional" | "paypal")
                          }
                          className="checkout-payment-radio"
                        />
                        <div className="checkout-payment-info">
                          <div className="checkout-payment-name">
                            <CreditCard size={18} />
                            PayPal
                          </div>
                          <p className="checkout-payment-description">
                            Pago seguro y rápido (Recomendado)
                          </p>
                        </div>
                        <Check className="checkout-payment-check" size={20} />
                      </label>

                      <label
                        className={`checkout-payment-option ${paymentMethod === "traditional" ? "active traditional" : ""
                          }`}
                      >
                        <input
                          type="radio"
                          value="traditional"
                          checked={paymentMethod === "traditional"}
                          onChange={(e) =>
                            setPaymentMethod(e.target.value as "traditional" | "paypal")
                          }
                          className="checkout-payment-radio"
                        />
                        <div className="checkout-payment-info">
                          <div className="checkout-payment-name">
                            <Building2 size={18} />
                            Pago Tradicional
                          </div>
                          <p className="checkout-payment-description">
                            Transferencia bancaria o efectivo
                          </p>
                        </div>
                        <Check className="checkout-payment-check" size={20} />
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={handleProceedToPayment}
                    disabled={loading}
                    className={`checkout-btn ${paymentMethod === "paypal"
                      ? "checkout-btn-paypal"
                      : "checkout-btn-traditional"
                      }`}
                  >
                    {loading ? (
                      <div className="checkout-loading">
                        <Loader2 className="checkout-spinner" size={16} />
                        Procesando...
                      </div>
                    ) : paymentMethod === "paypal" ? (
                      <>
                        <CreditCard size={20} />
                        Continuar con PayPal
                      </>
                    ) : (
                      <>
                        Confirmar Pago Tradicional
                        <Building2 size={20} />
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div>
                  <div className="checkout-paypal-section">
                    <h3 className="checkout-paypal-title">
                      <CreditCard size={24} />
                      Completa tu pago con PayPal
                    </h3>
                    <p className="checkout-paypal-description">
                      Serás redirigido a PayPal para completar el pago de forma segura
                    </p>
                  </div>

                  <div className="checkout-paypal-container">
                    <PayPal
                      total={getTotal()}
                      onSuccess={handlePayPalSuccess}
                      onError={handlePayPalError}
                      onCancel={handlePayPalCancel}
                    />
                  </div>

                  <button onClick={handleBackToForm} className="checkout-btn checkout-btn-secondary">
                    <ArrowLeft size={20} />
                    Volver a métodos de pago
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default CheckoutModal
