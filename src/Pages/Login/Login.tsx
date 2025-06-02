"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Mail, Lock, AlertCircle, Loader2 } from "lucide-react"
import { jwtDecode } from "jwt-decode"
import { loginService } from "../../Services/LoginService"
import "./Login.css"
import { useAuth } from "../../context/Authcontext"

export default function Login() {
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
  const navigate = useNavigate()

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
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return

    const decoded = jwtDecode<{ role: string }>(token)
    if (decoded.role === "Client") {
      navigate("/dashboard-cliente")
    } else if (decoded.role === "Distributor") {
      navigate("/dashboard-distribuidor")
    } else if (decoded.role === "Delivery") {
      navigate("/dashboard-delivery")
    }
  }, [])

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#ff6b35" />
            <path d="M2 17L12 22L22 17" stroke="#ff6b35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12L12 17L22 12" stroke="#ff6b35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="auth-title">¡Bienvenido de nuevo!</h2>
        <p className="auth-subtitle">Inicia sesión para continuar</p>

        <div className="auth-divider">o continúa con email</div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">
              <Mail size={18} /> Email
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Mail size={18} />
              </span>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? "input-error" : ""}
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <span className="error-message">
                <AlertCircle size={16} />
                {errors.email}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <Lock size={18} /> Contraseña
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Lock size={18} />
              </span>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="********"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? "input-error" : ""}
                disabled={isLoading}
              />
            </div>
            {errors.password && (
              <span className="error-message">
                <AlertCircle size={16} />
                {errors.password}
              </span>
            )}
          </div>

          <button type="submit" className={`auth-button ${isLoading ? "loading" : ""}`} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 size={20} className="auth-button-spinner" />
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
