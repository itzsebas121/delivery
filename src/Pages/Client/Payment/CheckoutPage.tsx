"use client"

import { useAuth } from "../../../context/Authcontext"
import { useEffect, useState, Suspense, lazy } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, ShoppingCart, MapPin, CreditCard, Navigation, Map } from "lucide-react"
import { baseURLRest } from "../../../config"
import PayPal from "./PayPal/Paypal"
import LoadingSpinner from "../../../components/Loading/LoadingSpinner"
import "./checkout-page.css"

// Lazy load del modal de mapa
const MapModal = lazy(() => import("./Map/MapModal"))

type CartItem = {
  ProductId: number
  ProductName: string
  Quantity: number
  Price: number
  CartId: number
}

type LocationData = {
  latitude: number
  longitude: number
  address: string
}

const CheckoutPage = () => {
  const { user, loading } = useAuth()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartId, setCartId] = useState<number | null>(null)
  const [locationData, setLocationData] = useState<LocationData | null>(null)
  const [loadingp, setLoading] = useState(false)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [showMapModal, setShowMapModal] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<"success" | "error" | "warning">("success")
  const navigate = useNavigate()
  const clientID = user?.rol === "Client" && "clientId" in user ? (user as any).clientId : 1

  // Agregar estados separados para coordenadas internas
  const [internalCoordinates, setInternalCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [displayAddress, setDisplayAddress] = useState<string>("")

  useEffect(() => {
    async function fetchCart() {
      try {
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
    if (loading) return
    fetchCart()
  }, [clientID])

  const getTotal = () => cartItems.reduce((acc, item) => acc + (item.Price ?? 0) * (item.Quantity ?? 0), 0)

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Geolocalización no soportada en este navegador")
      setMessageType("error")
      return
    }

    setLoadingLocation(true)
    setMessage("Obteniendo ubicación actual...")
    setMessageType("success")

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        try {
          // Hacer reverse geocoding para obtener dirección legible
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          )
          const data = await response.json()
          const readableAddress = data.display_name || `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`

          // Guardar coordenadas internamente
          setInternalCoordinates({ lat: latitude, lng: longitude })
          // Mostrar solo la dirección al usuario
          setDisplayAddress(readableAddress)

          setLocationData({
            latitude,
            longitude,
            address: readableAddress,
          })

          setMessage("Ubicación obtenida exitosamente")
          setMessageType("success")
          setTimeout(() => setMessage(null), 3000)
        } catch (error) {
          // Si falla el reverse geocoding, mostrar coordenadas
          const fallbackAddress = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`
          setInternalCoordinates({ lat: latitude, lng: longitude })
          setDisplayAddress(fallbackAddress)

          setLocationData({
            latitude,
            longitude,
            address: fallbackAddress,
          })

          setMessage("Ubicación obtenida (sin dirección detallada)")
          setMessageType("warning")
        } finally {
          setLoadingLocation(false)
        }
      },
      (error) => {
        setLoadingLocation(false)
        let errorMessage = "Error al obtener ubicación"

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Permiso de ubicación denegado"
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Ubicación no disponible"
            break
          case error.TIMEOUT:
            errorMessage = "Tiempo de espera agotado"
            break
        }

        setMessage(errorMessage)
        setMessageType("error")
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    )
  }

  const handleMapSelection = (latitude: number, longitude: number, address: string) => {
    // Guardar coordenadas internamente
    setInternalCoordinates({ lat: latitude, lng: longitude })
    // Mostrar solo la dirección al usuario
    setDisplayAddress(address)

    setLocationData({
      latitude,
      longitude,
      address,
    })

    setShowMapModal(false)
    setMessage("Ubicación seleccionada exitosamente")
    setMessageType("success")
    setTimeout(() => setMessage(null), 3000)
  }

  const handlePayPalSuccess = async (details: any) => {
    if (!internalCoordinates || !displayAddress) {
      setMessage("Por favor selecciona una ubicación de entrega")
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
      // Alerta con las coordenadas internas (útiles para ti)
      alert(
        `DATOS INTERNOS:
        CartID: ${cartId}
        ClientID: ${clientID}
        Dirección mostrada: ${displayAddress}
        Latitud: ${internalCoordinates.lat}
        Longitud: ${internalCoordinates.lng}
        PayPal Details: ${JSON.stringify(details)}`,
      )

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
    if (!internalCoordinates || !displayAddress) {
      setMessage("Por favor selecciona una ubicación de entrega")
      setMessageType("warning")
      return
    }

    setLoading(true)
    setMessage(null)
    try {
      // Alerta con las coordenadas internas (útiles para ti)
      alert(
        `DATOS INTERNOS:
        CartID: ${cartId}
        ClientID: ${clientID}
        Dirección mostrada: ${displayAddress}
        Latitud: ${internalCoordinates.lat}
        Longitud: ${internalCoordinates.lng}
        Método: Pago Tradicional`,
      )

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

              <div className="location-input-container">
                <input
                  type="text"
                  value={displayAddress}
                  placeholder="Selecciona una ubicación usando los botones"
                  className="checkout-input-readonly"
                  readOnly
                />

                <div className="location-buttons">
                  <button
                    onClick={getCurrentLocation}
                    disabled={loadingLocation || loadingp}
                    className="location-button current-location"
                  >
                    {loadingLocation ? <LoadingSpinner size={16} /> : <Navigation size={16} />}
                    {loadingLocation ? "Obteniendo..." : "Mi Ubicación"}
                  </button>

                  <button
                    onClick={() => setShowMapModal(true)}
                    disabled={loadingp}
                    className="location-button map-selection"
                  >
                    <Map size={16} />
                    Seleccionar en Mapa
                  </button>
                </div>
              </div>

              {message && <div className={`checkout-message ${messageType}`}>{message}</div>}
            </div>

            <div className="checkout-section">
              <h3 className="checkout-section-title">
                <CreditCard size={16} />
                Método de Pago
              </h3>
              <div className="checkout-payment-methods">
                {internalCoordinates && displayAddress ? (
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
                    <button onClick={handleTraditionalPay} disabled={loadingp} className="checkout-traditional-button">
                      Pago Tradicional
                    </button>
                  </>
                ) : (
                  <div className="checkout-message warning">
                    Selecciona una ubicación para habilitar los métodos de pago
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showMapModal && (
        <Suspense
          fallback={
            <div className="modal-loading">
              <LoadingSpinner size={32} />
            </div>
          }
        >
          <MapModal onLocationSelect={handleMapSelection} onClose={() => setShowMapModal(false)} />
        </Suspense>
      )}
    </div>
  )
}

export default CheckoutPage
