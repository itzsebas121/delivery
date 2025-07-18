import { baseURLRest } from "../../../config"
import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../../context/Authcontext"
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
  const { user, loading } = useAuth()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const navigate = useNavigate()
  const clientId = user?.rol === "Client" && "clientId" in user ? (user as any).clientId : 1;

  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        const response = await fetch(`${baseURLRest}/get-cart/${clientId}`)
        if (!response.ok) throw new Error("No se pudo obtener el carrito")
        const data = await response.json()

        if (!data || (Array.isArray(data) && data.length === 0)) {
          setCartItems([])
        } else {
          setCartItems(data)
        }
      } catch (error) {
        console.error("Error al obtener el carrito:", error)
        setCartItems([])
      }
    }
    if (!loading) {
      fetchCartItems()
    }
  }, [clientId])
  if (loading) {
    return <div className="nav__cart-loading">Cargando...</div>
  }
  const debounceTimers = useRef<{ [key: number]: ReturnType<typeof setTimeout> }>({})

  const removeFromCart = async (productId: number, _cartId: number) => {
    setCartItems((prev) => prev.filter((item) => item.ProductId !== productId))
    try {
      await fetch(`${baseURLRest}/get-cart/${clientId}`, {
        method: "DELETE",
      })
    } catch (error) {
      console.error("Error al eliminar producto del carrito:", error)
    }
  }

  const removeFromCartWithConfirm = (productId: number, cartId: number) => {
    const confirmDelete = confirm("¿Deseas eliminar este producto del carrito?")
    if (confirmDelete) {
      removeFromCart(productId, cartId)
    }
  }

  const updateQuantity = (productId: number, inputValue: string, cartId: number) => {
    if (!/^\d{0,2}$/.test(inputValue)) return

    const newQuantity = Number(inputValue)

    setCartItems((prev) =>
      prev.map((item) => (item.ProductId === productId ? { ...item, Quantity: newQuantity } : item)),
    )

    if (newQuantity === 0) {
      const confirmDelete = confirm("¿Deseas eliminar este producto del carrito?")
      if (confirmDelete) {
        removeFromCart(productId, cartId)
      }
      return
    }

    if (debounceTimers.current[productId]) {
      clearTimeout(debounceTimers.current[productId])
    }

    debounceTimers.current[productId] = setTimeout(async () => {
      try {
        await fetch(`${baseURLRest}/cart-item`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            CartId: cartId,
            ProductId: productId,
            Quantity: newQuantity,
          }),
        })
      } catch (error) {
        console.error("Error al actualizar cantidad en backend:", error)
      }
    }, 500)
  }

  const getCartTotal = () => cartItems.reduce((total, item) => total + item.Price * item.Quantity, 0)


  const handleCheckout = () => {
    navigate("payment")
  }

  if (cartItems.length === 0 || cartItems[0]?.CartId == null) {
    return (
      <div className="nav__cart-empty">
        <p>Tu carrito está vacío</p>
      </div>
    )
  }

  return (
    <>
      <ul className="nav__cart-items">
        {cartItems.map((item, index) => (
          <li key={index} className="nav__cart-item">
            <div className="nav__cart-item-image">
              {item.ImageURL ? (
                <img src={item.ImageURL || "/placeholder.svg"} alt={item.ProductName} />
              ) : (
                <div className="nav__cart-item-placeholder"></div>
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
                      −
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
                      +
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
              ×
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
    </>
  )
}

export default CartDropdownContent
