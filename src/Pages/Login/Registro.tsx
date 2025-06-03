import type React from "react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { Mail, Lock, AlertCircle, User, CheckCircle, Loader2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import "./Login.css"
import { useAlert } from "../../components/Alerts/Alert-system"
export default function Registro() {
  const { showSuccess } = useAlert()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const [errors, setErrors] = useState({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
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
    const newErrors = {
      nombre: "",
      email: "",
      password: "",
      confirmPassword: "",
    }

    if (!formData.nombre) {
      newErrors.nombre = "El nombre es requerido"
      valid = false
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
      newErrors.password = "Debe tener al menos 6 caracteres"
      valid = false
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirma tu contraseña"
      valid = false
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
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
      // Aquí iría tu llamada al registerService
      // await registerService({ nombre, email, password })
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulación de delay
      showSuccess("¡Éxito!", "Cuenta creada correctamente")
      navigate("/login")
    } catch (error) {
      console.error("Error en el registro:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="var(--accent-gold)" />
            <path d="M2 17L12 22L22 17" stroke="var(--accent-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12L12 17L22 12" stroke="var(--accent-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h2 className="auth-title">Crea tu cuenta</h2>
        <p className="auth-subtitle">Únete a nuestra plataforma</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Nombre */}
          <div className="form-group">
            <label htmlFor="nombre">
              <User size={14} /> Nombre
            </label>
            <div className={`input-wrapper ${errors.nombre ? "input-error" : ""}`}>
              <span className="input-icon">
                <User size={16} />
              </span>
              <input
                type="text"
                id="nombre"
                name="nombre"
                placeholder="Tu nombre"
                value={formData.nombre}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            {errors.nombre && (
              <span className="error-message">
                <AlertCircle size={14} />
                {errors.nombre}
              </span>
            )}
          </div>

          {/* Email */}
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

          {/* Contraseña */}
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
                placeholder="••••••••"
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

          {/* Confirmación */}
          <div className="form-group">
            <label htmlFor="confirmPassword">
              <CheckCircle size={14} /> Confirmar Contraseña
            </label>
            <div className={`input-wrapper ${errors.confirmPassword ? "input-error" : ""}`}>
              <span className="input-icon">
                <CheckCircle size={16} />
              </span>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            {errors.confirmPassword && (
              <span className="error-message">
                <AlertCircle size={14} />
                {errors.confirmPassword}
              </span>
            )}
          </div>

          {/* Botón */}
          <button type="submit" className={`auth-button ${isLoading ? "loading" : ""}`} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 size={16} className="auth-button-spinner" />
                Creando cuenta...
              </>
            ) : (
              "Crear Cuenta"
            )}
          </button>
        </form>

        <p className="auth-footer">
          ¿Ya tienes una cuenta? <Link to="/login">Iniciar Sesión</Link>
        </p>
      </div>
    </div>
  )
}
