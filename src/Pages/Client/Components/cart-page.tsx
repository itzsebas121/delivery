"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, ShoppingCart, Minus, Plus, X, Lock, Truck, Tag } from "lucide-react"
import { useCart } from "../../../context/cart-context"

const CartPage = () => {
  const { cartItems, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCart()
  const navigate = useNavigate()
  const [couponCode, setCouponCode] = useState("")
  const [couponApplied, setCouponApplied] = useState(false)
  const [discount, setDiscount] = useState(0)

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) return
    updateQuantity(productId, newQuantity)
  }

  const handleApplyCoupon = () => {
    if (couponCode.toLowerCase() === "descuento10") {
      setDiscount(10)
      setCouponApplied(true)
    } else if (couponCode.toLowerCase() === "descuento20") {
      setDiscount(20)
      setCouponApplied(true)
    } else {
      alert("Cupón no válido")
    }
  }

  const subtotal = getCartTotal()
  const discountAmount = (subtotal * discount) / 100
  const total = subtotal - discountAmount

  const handleCheckout = () => {
    navigate("/checkout", {
      state: {
        discount,
        couponCode: couponApplied ? couponCode : null,
      },
    })
  }

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h1>Mi Carrito de Compras</h1>
        <Link to="/products" className="cart-continue-shopping">
          <ArrowLeft size={20} />
          Continuar comprando
        </Link>
      </div>

      {cartItems.length === 0 ? (
        <div className="cart-empty">
          <div className="cart-empty-icon">
            <ShoppingCart size={64} />
          </div>
          <h2>Tu carrito está vacío</h2>
          <p>Parece que aún no has añadido productos a tu carrito.</p>
          <Link to="/products" className="cart-empty-button">
            Explorar Productos
          </Link>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items">
            <div className="cart-items-header">
              <span className="cart-header-product">Producto</span>
              <span className="cart-header-price">Precio</span>
              <span className="cart-header-quantity">Cantidad</span>
              <span className="cart-header-total">Total</span>
              <span className="cart-header-actions"></span>
            </div>

            {cartItems.map((item: any) => (
              <div className="cart-item" key={item.productId}>
                <div className="cart-item-product">
                  <div className="cart-item-image">
                    {item.imageURL ? (
                      <img src={item.imageURL || "/placeholder.svg"} alt={item.productName} />
                    ) : (
                      <div className="cart-item-placeholder"></div>
                    )}
                  </div>
                  <div className="cart-item-details">
                    <h3 className="cart-item-name">{item.productName}</h3>
                  </div>
                </div>

                <div className="cart-item-price">${item.price.toFixed(2)}</div>

                <div className="cart-item-quantity">
                  <button
                    className="cart-quantity-btn"
                    onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="cart-quantity-value">{item.quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                    className="cart-quantity-btn"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="cart-item-total">${(item.price * item.quantity).toFixed(2)}</div>

                <div className="cart-item-actions">
                  <button
                    className="cart-item-remove"
                    onClick={() => removeFromCart(item.productId)}
                    aria-label="Eliminar producto"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            ))}

            <div className="cart-actions">
              <button className="cart-clear-btn" onClick={clearCart}>
                Vaciar Carrito
              </button>
            </div>
          </div>

          <div className="cart-summary">
            <h2>Resumen del Pedido</h2>

            <div className="cart-coupon">
              <input
                type="text"
                placeholder="Código de descuento"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                disabled={couponApplied}
              />
              <button onClick={handleApplyCoupon} disabled={couponApplied || !couponCode}>
                <Tag size={16} />
                {couponApplied ? "Aplicado" : "Aplicar"}
              </button>
            </div>

            <div className="cart-totals">
              <div className="cart-total-row">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {couponApplied && (
                <div className="cart-total-row cart-discount">
                  <span>Descuento ({discount}%):</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="cart-total-row cart-total-final">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <button className="cart-checkout-btn" onClick={handleCheckout}>
              Proceder al Pago
            </button>

            <div className="cart-info">
              <p>
                <Lock size={16} className="cart-info-icon" />
                Pago seguro garantizado
              </p>
              <p>
                <Truck size={16} className="cart-info-icon" />
                Envío gratis en pedidos superiores a $50
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CartPage
