"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react'
import { baseURLLogin } from "../../config"
import { jwtDecode } from "jwt-decode"
import "./Login.css"

export default function Login() {
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
    setFormData({
      ...formData,
      [name]: value,
    })
    // Limpiar errores al escribir
    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name]: "",
      })
    }
  }

  const validateForm = () => {
    let valid = true
    const newErrors = {
      email: "",
      password: "",
    }

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
      newErrors.password = "La contraseña debe tener al menos 6 caracteres"
      valid = false
    }

    setErrors(newErrors)
    return valid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      setIsLoading(true)
      try {
        const response = await fetch(`${baseURLLogin}/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || "Error al iniciar sesión")
        }

        localStorage.setItem("token", data.token)

        const decodedToken = jwtDecode<{ role: string }>(data.token)

        if (decodedToken.role === "Client") {
          navigate("/dashboard-cliente")
        } else if (decodedToken.role === "Distributor") {
          navigate("/dashboard-distribuidor")
        } else {
          alert("Rol no reconocido")
        }
      } catch (err) {
        alert((err as Error).message)
      } finally {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      navigate("/login")
      return
    }
    const decodedToken = jwtDecode<{ role: string }>(token || "")
    if (decodedToken.role === "Client") {
      navigate("/dashboard-cliente")
    } else if (decodedToken.role === "Distributor") {
      navigate("/dashboard-distribuidor")
    }
  }, [])

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#ff6b35" />
            <path
              d="M2 17L12 22L22 17"
              stroke="#ff6b35"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 12L12 17L22 12"
              stroke="#ff6b35"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="auth-title">¡Bienvenido de nuevo!</h2>
        <p className="auth-subtitle">Inicia sesión para continuar</p>

        <div className="social-buttons">
          <button className="social-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.57V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z"
                fill="#4285F4"
              />
              <path
                d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.57C14.73 18.23 13.48 18.63 12 18.63C9.13 18.63 6.72 16.69 5.82 14.09H2.12V16.95C3.94 20.53 7.69 23 12 23Z"
                fill="#34A853"
              />
              <path
                d="M5.82 14.09C5.6 13.43 5.48 12.73 5.48 12C5.48 11.27 5.6 10.57 5.82 9.91V7.05H2.12C1.41 8.57 1 10.24 1 12C1 13.76 1.41 15.43 2.12 16.95L5.82 14.09Z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.37C13.54 5.37 14.93 5.91 16.03 6.97L19.22 3.78C17.46 2.13 14.97 1 12 1C7.69 1 3.94 3.47 2.12 7.05L5.82 9.91C6.72 7.31 9.13 5.37 12 5.37Z"
                fill="#EA4335"
              />
            </svg>
            Google
          </button>
          <button className="social-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M24 12.073C24 5.446 18.627 0.073 12 0.073C5.373 0.073 0 5.446 0 12.073C0 18.063 4.388 23.027 10.125 23.927V15.542H7.078V12.072H10.125V9.43C10.125 6.423 11.917 4.761 14.658 4.761C15.97 4.761 17.344 4.996 17.344 4.996V7.949H15.83C14.34 7.949 13.874 8.874 13.874 9.823V12.073H17.202L16.67 15.543H13.874V23.928C19.612 23.027 24 18.062 24 12.073Z"
                fill="#1877F2"
              />
            </svg>
            Facebook
          </button>
        </div>

        <div className="auth-divider">o continúa con email</div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">
              <Mail size={18} />
              Email
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <Mail size={18} />
              </span>
              <input
                type="email"
                id="email"
                placeholder="tu@email.com"
                name="email"
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
              <Lock size={18} />
              Contraseña
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