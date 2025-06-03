
import type React from "react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { Mail, Lock, AlertCircle, Loader2 } from "lucide-react"
import {jwtDecode} from "jwt-decode"
import { loginService } from "../../Services/LoginService"
import { useAuth } from "../../context/Authcontext"
import { useNavigate } from "react-router-dom"
import "./Login.css"

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  })

  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (errors[name as keyof typeof errors]) {
      setErrors({ ...errors, [name]: "" })
    }
  }

  const validateForm = () => {
    let valid = true
    const newErrors = { email: "", password: "" }

    if (!formData.email) {
      newErrors.email = "El email es requerido"
      valid = false
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido"
      valid = false
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida"
      valid = false
    } else if (formData.password.length < 6) {
      newErrors.password = "Debe tener al menos 6 caracteres"
      valid = false
    }

    setErrors(newErrors)
    return valid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const { token } = await loginService({ email: formData.email, password: formData.password })
      if (token.Message) {
        alert(token.Message || 'Error al iniciar sesión');
        return;
      }
      const decodedToken: any = jwtDecode(token);
      login(token)
      if (decodedToken.role === "Client") {
        navigate("/dashboard-cliente")
      } else if (decodedToken.role === "Distributor") {
        navigate("/dashboard-distribuidor")
      } else if (decodedToken.role === "Delivery") {
        navigate("/dashboard-delivery")
      } else {
        alert("Rol no reconocido")
      }
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simular delay
    } catch (error) {
      console.error("Error en login:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="var(--primary-orange)" />
            <path d="M2 17L12 22L22 17" stroke="var(--primary-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12L12 17L22 12" stroke="var(--primary-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="auth-title">¡Bienvenido de nuevo!</h2>
        <p className="auth-subtitle">Inicia sesión para continuar</p>

        <div className="auth-divider">
          <span>o continúa con email</span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">
              <Mail size={14} /> Email
            </label>
            <div className={`input-wrapper ${errors.email ? "input-error" : ""}`}>
              <span className="input-icon">
                <Mail size={16} />
              </span>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <span className="error-message">
                <AlertCircle size={14} />
                {errors.email}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <Lock size={14} /> Contraseña
            </label>
            <div className={`input-wrapper ${errors.password ? "input-error" : ""}`}>
              <span className="input-icon">
                <Lock size={16} />
              </span>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="********"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            {errors.password && (
              <span className="error-message">
                <AlertCircle size={14} />
                {errors.password}
              </span>
            )}
          </div>

          <button type="submit" className={`auth-button ${isLoading ? "loading" : ""}`} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 size={16} className="auth-button-spinner" />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar sesión"
            )}
          </button>
        </form>

        <p className="auth-footer">
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </div>
    </div>
  )
}
