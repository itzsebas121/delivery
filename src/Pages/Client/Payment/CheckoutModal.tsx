import type React from "react"
import { useEffect, useState } from "react"
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
import PayPal from "./PayPal/Paypal"
import "./checkout-modal.css"

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
    console.log("🔄 Iniciando carga del carrito para cliente:", clientId)
    async function fetchCart() {
      try {
        const res = await fetch(`${baseURLRest}/get-cart/${clientId}`)
        if (!res.ok) throw new Error("No se pudo obtener el carrito")
        const data: CartItem[] = await res.json()
        console.log("✅ Carrito cargado exitosamente:", data)
        setCartItems(data)
        if (data.length > 0) {
          setCartId(data[0].CartId)
          console.log("📦 Cart ID establecido:", data[0].CartId)
        }
      } catch (error) {
        console.error("❌ Error al cargar el carrito:", error)
        setMessage("Error al cargar el carrito")
        setMessageType("error")
      }
    }
    fetchCart()
  }, [clientId])

  useEffect(() => {
    console.log("🔄 Método de pago cambiado a:", paymentMethod)
    setCurrentStep("form")
    setMessage(null)
    setLoading(false)
  }, [paymentMethod])

  const getTotal = () => {
    const total = cartItems.reduce((acc, item) => acc + (item.Price ?? 0) * (item.Quantity ?? 0), 0)
    console.log("💰 Total calculado:", total)
    return total
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
    console.log("🏦 Iniciando pago tradicional...")

    if (!validateForm()) return

    setLoading(true)
    setMessage("Procesando pago tradicional...")
    setMessageType("success")
    console.log("📤 Enviando orden tradicional al servidor...")

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

      console.log("✅ Orden tradicional creada exitosamente:", result)
      setMessage(`¡Orden creada con éxito! ID: ${result.orderId}`)
      setMessageType("success")

      setTimeout(() => {
        setLoading(false)
        onClose()
      }, 2500)
    } catch (error) {
      console.error("❌ Error en pago tradicional:", error)
      setLoading(false)
      setMessage("Error al procesar el pago. Intenta nuevamente.")
      setMessageType("error")
    }
  }

  const handlePayPalSuccess = async (paymentResult: any) => {
    console.log("🎉 Pago PayPal exitoso recibido:", paymentResult)
    setLoading(true)
    setMessage("Procesando pago de PayPal...")
    setMessageType("success")

    try {
      console.log("📤 Enviando confirmación de pago PayPal al servidor...")

      const res = await fetch(`${baseURLRest}/create-order-from-cart-paypal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId: cartId,
          clientId: clientId,
          deliveryAddress: deliveryAddress.trim(),
          paypalOrderId: paymentResult.id,
          paypalPayerId: paymentResult.payer?.payer_id,
          paypalPaymentId: paymentResult.purchase_units?.[0]?.payments?.captures?.[0]?.id,
          amount: getTotal(),
          paymentDetails: paymentResult,
        }),
      })

      if (!res.ok) {
        throw new Error("Error al confirmar el pago con PayPal")
      }

      const result = await res.json()
      console.log("✅ Orden PayPal confirmada en servidor:", result)

      setMessage(`¡Pago con PayPal exitoso! Orden ID: ${result.orderId}`)
      setMessageType("success")

      setTimeout(() => {
        setLoading(false)
        onClose()
      }, 3000)
    } catch (error) {
      console.error("❌ Error al confirmar pago PayPal:", error)
      setLoading(false)
      setMessage("Error al confirmar el pago con PayPal")
      setMessageType("error")
      setCurrentStep("form")
    }
  }

  const handlePayPalError = (error: any) => {
    console.error("❌ Error en PayPal:", error)
    setMessage("Error en el pago con PayPal. Intenta nuevamente.")
    setMessageType("error")
    setCurrentStep("form")
  }

  const handlePayPalCancel = () => {
    console.log("🚫 Pago PayPal cancelado por el usuario")
    setMessage("Pago cancelado")
    setMessageType("warning")
    setCurrentStep("form")
  }

  const handleProceedToPayment = () => {
    if (!validateForm()) return

    console.log("➡️ Procediendo al pago con método:", paymentMethod)
    setMessage(null)

    if (paymentMethod === "traditional") {
      handleTraditionalPay()
    } else {
      setCurrentStep("payment")
    }
  }

  const handleBackToForm = () => {
    console.log("⬅️ Volviendo al formulario")
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
    <div role="dialog" aria-modal="true" aria-labelledby="checkoutTitle" className="checkout-overlay">
      <div className="checkout-modal">
        {/* Header */}
        <div className="checkout-header">
          <h2 id="checkoutTitle" className="checkout-title">
            <CreditCard size={24} />
            Proceso de Pago
          </h2>
          <button onClick={onClose} className="checkout-close-btn">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="checkout-content">
          {cartItems.length === 0 ? (
            <div className="checkout-empty">
              <ShoppingCart className="checkout-empty-icon" size={64} />
              <p className="checkout-empty-text">Tu carrito está vacío</p>
            </div>
          ) : (
            <>
              {/* Resumen del carrito */}
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
                  {/* Dirección de entrega */}
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
                  {/* Métodos de pago */}
                  <div className="checkout-payment-methods">
                    <h3 className="checkout-section-title">
                      <CreditCard size={20} />
                      Método de pago
                    </h3>
                    <div className="checkout-payment-options">
                      {/* PayPal Option */}
                      <label className={`checkout-payment-option ${paymentMethod === "paypal" ? "active paypal" : ""}`}>
                        <input
                          type="radio"
                          value="paypal"
                          checked={paymentMethod === "paypal"}
                          onChange={(e) => setPaymentMethod(e.target.value as "traditional" | "paypal")}
                          className="checkout-payment-radio"
                        />
                        <div className="checkout-payment-info">
                          <div className="checkout-payment-name">
                            <CreditCard size={18} />
                            PayPal
                          </div>
                          <p className="checkout-payment-description">Pago seguro y rápido (Recomendado)</p>
                        </div>
                        <Check className="checkout-payment-check" size={20} />
                      </label>

                      {/* Traditional Payment Option */}
                      <label
                        className={`checkout-payment-option ${paymentMethod === "traditional" ? "active traditional" : ""
                          }`}
                      >
                        <input
                          type="radio"
                          value="traditional"
                          checked={paymentMethod === "traditional"}
                          onChange={(e) => setPaymentMethod(e.target.value as "traditional" | "paypal")}
                          className="checkout-payment-radio"
                        />
                        <div className="checkout-payment-info">
                          <div className="checkout-payment-name">
                            <Building2 size={18} />
                            Pago Tradicional
                          </div>
                          <p className="checkout-payment-description">Transferencia bancaria o efectivo</p>
                        </div>
                        <Check className="checkout-payment-check" size={20} />
                      </label>
                    </div>
                  </div>

                  {/* Botón proceder */}
                  <button
                    onClick={handleProceedToPayment}
                    disabled={loading}
                    className={`checkout-btn ${paymentMethod === "paypal" ? "checkout-btn-paypal" : "checkout-btn-traditional"
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
                        <Building2 size={20} />
                        Confirmar Pago Tradicional
                      </>
                    )}
                  </button>
                </>
              ) : (
                /* Paso de pago PayPal */
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
