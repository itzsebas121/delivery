import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/Authcontext"
import "./NavbarClient.css"
import {Box, Home, LogOut, Package, UsersRound} from 'lucide-react'
const NavbarDistributor = () => {
  const {  logout, tipoUsuario } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileRef = useRef(null)
  const menuRef = useRef(null)

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const toggleMenu = () => {
    setMenuOpen(!menuOpen)
  }

  const toggleProfileMenu = (e:any) => {
    e.stopPropagation()
    setProfileMenuOpen(!profileMenuOpen)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current && 
        !(profileRef.current as HTMLElement).contains(event.target as Node) &&
        profileMenuOpen
      ) {
        setProfileMenuOpen(false)
      }
      
      if (
        menuRef.current && 
        !(menuRef.current as HTMLElement).contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('.nav__menu-toggle') &&
        menuOpen
      ) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [profileMenuOpen, menuOpen])

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

      <ul 
        ref={menuRef}
        className={`nav__menu ${menuOpen ? "nav__menu--active" : ""}`}
      >
        <li className="nav__item">
          <Link to="/dashboard-distribuidor" className="nav__link" onClick={() => setMenuOpen(false)}>
            <Home></Home>Inicio
          </Link>
        </li>
        <li className="nav__item">
          <Link to="sales" className="nav__link" onClick={() => setMenuOpen(false)}>
            <Package></Package>Pedidos
          </Link>
        </li>

        <li className="nav__item">
          <Link to="delivery" className="nav__link" onClick={() => setMenuOpen(false)}>
            <UsersRound></UsersRound>Repartidores
          </Link>
        </li>
        <li className="nav__item">
          <Link to="products" className="nav__link" onClick={() => setMenuOpen(false)}>
            <Box></Box>Productos
          </Link>
        </li>

      </ul>

      <div className="nav__actions" ref={profileRef}>
        <div className="nav__profile">
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
                
                <li className="nav__dropdown-item nav__dropdown-item--danger">
                  <button onClick={handleLogout} className="nav__dropdown-button">
                    <span className="nav__dropdown-icon"><LogOut/></span>
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

export default NavbarDistributor
