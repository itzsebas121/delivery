import  { useCart } from "../context/cart-context"
import { useNavigate } from "react-router-dom"
const CartDropdownContent = () => {
  const { cartItems, removeFromCart, getCartTotal } = useCart()
  const navigate = useNavigate()

  const handleViewCart = () => {
    navigate("/cart")
  }

  const handleCheckout = () => {
    navigate("/checkout")
  }

  return (
    <div className="nav__cart-content">
      {cartItems.length === 0 ? (
        <div className="nav__cart-empty">
          <p>Tu carrito está vacío</p>
        </div>
      ) : (
        <>
          <ul className="nav__cart-items">
            {cartItems.slice(0, 3).map((item) => (
              <li key={item.productId} className="nav__cart-item">
                <div className="nav__cart-item-image">
                  {item.imageURL ? (
                    <img src={item.imageURL || "/placeholder.svg"} alt={item.productName} />
                  ) : (
                    <div className="nav__cart-item-placeholder"></div>
                  )}
                </div>
                <div className="nav__cart-item-details">
                  <h4 className="nav__cart-item-name">{item.productName}</h4>
                  <div className="nav__cart-item-price">
                    {item.quantity} x ${item.price.toFixed(2)}
                  </div>
                </div>
                <button
                  className="nav__cart-item-remove"
                  onClick={() => removeFromCart(item.productId)}
                >
                  ×
                </button>
              </li>
            ))}
            {cartItems.length > 3 && (
              <li className="nav__cart-more">
                <span>Y {cartItems.length - 3} productos más...</span>
              </li>
            )}
          </ul>

          <div className="nav__cart-footer">
            <div className="nav__cart-total">
              <span>Total:</span>
              <span>${getCartTotal().toFixed(2)}</span>
            </div>
            <div className="nav__cart-actions">
              <button className="nav__cart-button-secondary" onClick={handleViewCart}>
                Ver Carrito
              </button>
              <button className="nav__cart-button-primary" onClick={handleCheckout}>
                Pagar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
export default CartDropdownContent