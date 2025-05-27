import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { Trash2, Minus, Plus } from "lucide-react"
import CheckoutModal from "../Payment/CheckoutModal"
import { baseURLRest } from "../../../config"
import "./CartDropdownContext.css"

type CartItem = {
  ProductId: number
  CartId: number
  ProductName: string
  ImageURL: string | null
  Quantity: number
  Price: number
}

const CartDropdownContent = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const clientId = 1

  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        const response = await fetch(`${baseURLRest}/get-cart/${clientId}`)
        if (!response.ok) throw new Error("No se pudo obtener el carrito")
        const data = await response.json()
        setCartItems(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Error al obtener carrito:", error)
        setCartItems([])
      }
    }
    fetchCartItems()
  }, [clientId])

  const debounceTimers = useRef<{ [key: number]: ReturnType<typeof setTimeout> }>({})

  const removeFromCart = async (productId: number, cartId: number) => {
    setCartItems((prev) => prev.filter((item) => item.ProductId !== productId))
    try {
      await fetch(`${baseURLRest}/cart-item/${cartId}/${productId}`, { method: "DELETE" })
    } catch (error) {
      console.error("Error eliminando producto:", error)
    }
  }

  const removeFromCartWithConfirm = (productId: number, cartId: number) => {
    if (confirm("¿Deseas eliminar este producto del carrito?")) {
      removeFromCart(productId, cartId)
    }
  }

  const updateQuantity = (productId: number, inputValue: string, cartId: number) => {
    if (!/^\d{0,2}$/.test(inputValue)) return
    const newQuantity = Number(inputValue)
    setCartItems((prev) =>
      prev.map((item) => (item.ProductId === productId ? { ...item, Quantity: newQuantity } : item))
    )
    if (newQuantity === 0) {
      if (confirm("¿Deseas eliminar este producto del carrito?")) {
        removeFromCart(productId, cartId)
      }
      return
    }
    if (debounceTimers.current[productId]) clearTimeout(debounceTimers.current[productId])
    debounceTimers.current[productId] = setTimeout(async () => {
      try {
        await fetch(`${baseURLRest}/cart-item`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ CartId: cartId, ProductId: productId, Quantity: newQuantity }),
        })
      } catch (error) {
        console.error("Error actualizando cantidad:", error)
      }
    }, 500)
  }

  const getCartTotal = () => cartItems.reduce((total, item) => total + item.Price * item.Quantity, 0)

  const handleCheckout = () => setIsCheckoutOpen(true)

  if (cartItems.length === 0 || cartItems[0]?.CartId == null) {
    return <div className="nav__cart-empty"><p>Tu carrito está vacío</p></div>
  }

  return (
    <>
      <ul className="nav__cart-items">
        {cartItems.map((item) => (
          <li key={item.ProductId} className="nav__cart-item">
            <div className="nav__cart-item-image">
              {item.ImageURL ? (
                <img src={item.ImageURL} alt={item.ProductName} />
              ) : (
                <div className="nav__cart-item-placeholder" />
              )}
            </div>

            <div className="nav__cart-item-details">
              <h4 className="nav__cart-item-name">{item.ProductName}</h4>
              <div className="nav__cart-item-price">
                <span>${item.Price.toFixed(2)} x</span>
                <div className="nav__cart-quantity-subtotal">
                  <div className="nav__cart-quantity-control">
                    <button
                      className="nav__cart-quantity-button"
                      onClick={() => updateQuantity(item.ProductId, String(item.Quantity - 1), item.CartId)}
                      aria-label="Disminuir cantidad"
                    >
                      <Minus size={12} />
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={item.Quantity}
                      onChange={(e) => updateQuantity(item.ProductId, e.target.value, item.CartId)}
                      className="nav__cart-item-quantity-input"
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                    <button
                      className="nav__cart-quantity-button"
                      onClick={() => updateQuantity(item.ProductId, String(item.Quantity + 1), item.CartId)}
                      aria-label="Aumentar cantidad"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <span className="nav__cart-subtotal">${(item.Price * item.Quantity).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              className="nav__cart-item-remove"
              onClick={() => removeFromCartWithConfirm(item.ProductId, item.CartId)}
              aria-label="Eliminar producto"
              title="Eliminar producto"
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>

      <div className="nav__cart-footer">
        <div className="nav__cart-total">
          <span>Total:</span>
          <span>${getCartTotal().toFixed(2)}</span>
        </div>
        <div className="nav__cart-actions">
          <button className="nav__cart-button-primary" onClick={handleCheckout}>
            Pagar
          </button>
        </div>
      </div>

      {/* Modal */}
      {isCheckoutOpen && typeof window !== "undefined" &&
        createPortal(
          <CheckoutModal
            clientId={clientId}
            onClose={() => setIsCheckoutOpen(false)} // solo el botón dentro cierra
          />,
          document.body
        )}
    </>
  )
}
export default CartDropdownContent
