import './NavbarClient.css'
import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ShoppingCart, User, Settings, LogOut, Home, Package, History, Phone, UserCheck } from "lucide-react"
import { useAuth } from "../context/Authcontext"
import { useCart } from "../context/cart-context"
import CartDropdownContent from "../Pages/Client/Cart/CartDropdownContext"

const NavbarClient = () => {
  const { isAuthenticated, logout, tipoUsuario } = useAuth()
  const { cartItems, getItemsCount } = useCart()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [cartMenuOpen, setCartMenuOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const cartRef = useRef<HTMLDivElement>(null)

  // Estado local para forzar re-renderizado
  const [, setCartUpdateTrigger] = useState(0)

  // Forzar re-renderizado cuando cambia cartItems
  useEffect(() => {
    setCartUpdateTrigger((prev) => prev + 1)
  }, [cartItems])

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const toggleMenu = () => {
    setMenuOpen(!menuOpen)
  }

  const toggleProfileMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    setProfileMenuOpen(!profileMenuOpen)
    if (cartMenuOpen) setCartMenuOpen(false)
  }

  const toggleCartMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCartMenuOpen(!cartMenuOpen)
    if (profileMenuOpen) setProfileMenuOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node) && profileMenuOpen) {
        setProfileMenuOpen(false)
      }

      if (cartRef.current && !cartRef.current.contains(event.target as Node) && cartMenuOpen) {
        setCartMenuOpen(false)
      }

      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest(".nav__menu-toggle") &&
        menuOpen
      ) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [profileMenuOpen, menuOpen, cartMenuOpen])

  // Obtener el número de items en el carrito
  const itemsCount = getItemsCount()

  return (
    <nav className="nav">
      <div className="nav__logo">
        <h1>Hot-Grill</h1>
      </div>

      <div className="nav__menu-toggle" onClick={toggleMenu}>
        <div className={`nav__hamburger ${menuOpen ? "nav__hamburger--active" : ""}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      <ul ref={menuRef} className={`nav__menu ${menuOpen ? "nav__menu--active" : ""}`}>
        <li className="nav__item">
          <Link to="/dashboard-cliente" className="nav__link" onClick={() => setMenuOpen(false)}>
            <Home size={18} />
            Inicio
          </Link>
        </li>
        <li className="nav__item">
          <Link to="products" className="nav__link" onClick={() => setMenuOpen(false)}>
            <Package size={18} />
            Productos
          </Link>
        </li>
        <li className="nav__item">
          <Link to="history" className="nav__link" onClick={() => setMenuOpen(false)}>
            <History size={18} />
            Historial
          </Link>
        </li>
        <li className="nav__item">
          <Link to="contact" className="nav__link" onClick={() => setMenuOpen(false)}>
            <Phone size={18} />
            Contactos
          </Link>
        </li>
        {isAuthenticated && tipoUsuario === "Distribuidor" && (
          <li className="nav__item">
            <Link to="/dashboard-distribuidor" className="nav__link" onClick={() => setMenuOpen(false)}>
              <UserCheck size={18} />
              Distribuidor
            </Link>
          </li>
        )}
        {isAuthenticated && tipoUsuario === "Cliente" && (
          <li className="nav__item">
            <Link to="/dashboard-cliente" className="nav__link" onClick={() => setMenuOpen(false)}>
              <User size={18} />
              Mi Cuenta
            </Link>
          </li>
        )}
      </ul>

      <div className="nav__actions">
        {/* Carrito de compras */}
        <div className="nav__cart" ref={cartRef}>
          <button className="nav__cart-button" onClick={toggleCartMenu}>
            <div className="nav__cart-icon">
              <ShoppingCart size={24} className="nav__cart-icon-svg" />
              {itemsCount > 0 && <span className="nav__cart-count">{itemsCount}</span>}
            </div>
          </button>

          {cartMenuOpen && (
            <div className="nav__dropdown nav__cart-dropdown">
              <div className="nav__dropdown-arrow"></div>
              <div className="nav__cart-header">
                <h3>Mi Carrito ({cartItems.length})</h3>
              </div>
              <div className="nav__cart-content">
                <CartDropdownContent />
              </div>
            </div>
          )}
        </div>

        {/* Perfil de usuario */}
        <div className="nav__profile" ref={profileRef}>
          <button className="nav__profile-button" onClick={toggleProfileMenu}>
            <div className="nav__profile-icon">
              <span className="nav__profile-initial">
                {tipoUsuario === "Cliente" ? "C" : tipoUsuario === "Distribuidor" ? "D" : "U"}
              </span>
            </div>
          </button>

          {profileMenuOpen && (
            <div className="nav__dropdown">
              <div className="nav__dropdown-arrow"></div>
              <ul className="nav__dropdown-menu">
                <li className="nav__dropdown-item">
                  <Link to="/profile" className="nav__dropdown-link">
                    <User size={16} className="nav__dropdown-icon" />
                    Mi Perfil
                  </Link>
                </li>
                <li className="nav__dropdown-item">
                  <Link to="/settings" className="nav__dropdown-link">
                    <Settings size={16} className="nav__dropdown-icon" />
                    Configuración
                  </Link>
                </li>
                <li className="nav__dropdown-item nav__dropdown-item--danger">
                  <button onClick={handleLogout} className="nav__dropdown-button">
                    <LogOut size={16} className="nav__dropdown-icon" />
                    Cerrar sesión
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default NavbarClient
