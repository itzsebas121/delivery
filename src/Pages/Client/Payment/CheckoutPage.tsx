import { useAuth } from "../../../context/Authcontext"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, ShoppingCart, MapPin, CreditCard } from "lucide-react"
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

const CheckoutPage = () => {
  const { user, loading } = useAuth()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartId, setCartId] = useState<number | null>(null)
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [loadingp, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<"success" | "error" | "warning">("success")
  const navigate = useNavigate()
  const clientID = user?.rol === "Client" && "clientId" in user ? (user as any).clientId : 1;

  useEffect(() => {
    async function fetchCart() {
      try {
        alert(clientID)
        const res = await fetch(`${baseURLRest}/get-cart/${clientID}`)
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
    if (loading) return;
    fetchCart()
  }, [clientID])

  const getTotal = () => cartItems.reduce((acc, item) => acc + (item.Price ?? 0) * (item.Quantity ?? 0), 0)

  const handlePayPalSuccess = async (details: any) => {
    if (!deliveryAddress.trim()) {
      setMessage("Por favor ingresa la dirección de entrega")
      setMessageType("warning")
      return
    }
    if (!cartId) {
      setMessage("No hay carrito activo")
      setMessageType("warning")
      return
    }

    setLoading(true)
    setMessage("Procesando orden después del pago exitoso...")
    setMessageType("success")

    try {
      const res = await fetch(`${baseURLRest}/create-order-from-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId,
          deliveryAddress,
          paymentDetails: details,
        }),
      })
      if (!res.ok) throw new Error("Error al crear la orden")
      const result = await res.json()
      setMessage(`¡Orden creada con éxito! ID: ${result.orderId}`)
      setMessageType("success")
      setTimeout(() => {
        setLoading(false)
        navigate("/dashboard-cliente/history")
      }, 3000)
    } catch (error) {
      setLoading(false)
      setMessage("Error al procesar la orden")
      setMessageType("error")
    }
  }

  const handlePayPalError = (_error: any) => {
    setMessage("Error en el pago con PayPal")
    setMessageType("error")
  }

  const handlePayPalCancel = () => {
    setMessage("Pago cancelado")
    setMessageType("warning")
  }

  const handleTraditionalPay = async () => {
    if (!cartId) {
      setMessage("No hay carrito activo")
      setMessageType("warning")
      return
    }
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`${baseURLRest}/create-order-from-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId, deliveryAddress }),
      })
      if (!res.ok) throw new Error("Error al crear la orden")
      const result = await res.json()
      setMessage(`¡Orden creada con éxito! ID: ${result.orderId}`)
      setMessageType("success")
      setTimeout(() => {
        setLoading(false)
        navigate("../history")
      }, 3000)
    } catch (error) {
      setLoading(false)
      setMessage("Error al procesar el pago")
      setMessageType("error")
    }
  }

  const handleGoBack = () => {
    navigate(-1)
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-header">
          <button onClick={handleGoBack} className="checkout-back-button">
            <ArrowLeft size={18} />
            Volver
          </button>
          <h1 className="checkout-title">
            <CreditCard size={20} />
            Checkout
          </h1>
        </div>

        {cartItems.length === 0 ? (
          <div className="checkout-empty">
            <ShoppingCart size={48} />
            <h2>Carrito vacío</h2>
            <p>Agrega productos para continuar</p>
            <button onClick={() => navigate("products")} className="checkout-continue-shopping">
              Ir a Productos
            </button>
          </div>
        ) : (
          <div className="checkout-content">
            <div className="checkout-section">
              <h3 className="checkout-section-title">
                <ShoppingCart size={16} />
                Resumen
              </h3>
              <div className="checkout-items-compact">
                {cartItems.map((item) => (
                  <div key={item.ProductId} className="checkout-item-compact">
                    <span className="checkout-item-name-compact">{item.ProductName}</span>
                    <span className="checkout-item-qty">{item.Quantity}x</span>
                    <span className="checkout-item-price-compact">
                      ${((item.Price ?? 0) * (item.Quantity ?? 0)).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="checkout-total-compact">
                  <span>Total:</span>
                  <span className="checkout-total-amount">${getTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="checkout-section">
              <h3 className="checkout-section-title">
                <MapPin size={16} />
                Dirección de Entrega
              </h3>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => {
                  setDeliveryAddress(e.target.value)
                  if (e.target.value.trim()) setMessage(null)
                }}
                placeholder="Calle 123, Colonia, Ciudad"
                className="checkout-input-compact"
                disabled={loadingp}
              />
              {message && <div className={`checkout-message ${messageType}`}>{message}</div>}

            </div>

            <div className="checkout-section">
              <h3 className="checkout-section-title">
                <CreditCard size={16} />
                Método de Pago
              </h3>
              <div className="checkout-payment-methods">
                {deliveryAddress.trim() ? (
                  <>
                    <div className="checkout-paypal-container">
                      <PayPal
                        total={getTotal()}
                        onSuccess={handlePayPalSuccess}
                        onError={handlePayPalError}
                        onCancel={handlePayPalCancel}
                      />
                    </div>
                    <div className="checkout-divider">
                      <span>o</span>
                    </div>
                    <button
                      onClick={handleTraditionalPay}
                      disabled={loadingp}
                      className="checkout-traditional-button"
                    >
                      Pago Tradicional
                    </button>
                  </>
                ) : (
                  <div className="checkout-message warning">
                    Ingresa una dirección para habilitar los métodos de pago
                  </div>
                )}
              </div>

            </div>

          </div>
        )}
      </div>
    </div>
  )
}
export default CheckoutPage
