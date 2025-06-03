import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { CheckCircle, AlertCircle, Info, AlertTriangle, X, ShoppingCart } from "lucide-react"
import "./Alert-system.css"
// Tipos de alertas

type AlertType = "success" | "error" | "warning" | "info" | "confirm"

interface AlertData {
  id: string
  type: AlertType
  title: string
  message?: string
  duration?: number
  onConfirm?: () => void
  onCancel?: () => void
  showConfirmButtons?: boolean
}

interface AlertContextType {
  showAlert: (alert: Omit<AlertData, "id">) => void
  showSuccess: (title: string, message?: string, duration?: number) => void
  showError: (title: string, message?: string, duration?: number) => void
  showWarning: (title: string, message?: string, duration?: number) => void
  showInfo: (title: string, message?: string, duration?: number) => void
  showConfirm: (title: string, message?: string, onConfirm?: () => void, onCancel?: () => void) => void
  showCartSuccess: (productName: string) => void
  hideAlert: (id: string) => void
}

const AlertContext = createContext<AlertContextType | undefined>(undefined)

export const useAlert = () => {
  const context = useContext(AlertContext)
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider")
  }
  return context
}

// Componente individual de alerta
const AlertItem = ({ alert, onClose }: { alert: AlertData; onClose: (id: string) => void }) => {
  const getIcon = () => {
    switch (alert.type) {
      case "success":
        return <CheckCircle size={24} />
      case "error":
        return <AlertCircle size={24} />
      case "warning":
        return <AlertTriangle size={24} />
      case "info":
        return <Info size={24} />
      case "confirm":
        return <AlertTriangle size={24} />
      default:
        return <Info size={24} />
    }
  }

  const handleConfirm = () => {
    alert.onConfirm?.()
    onClose(alert.id)
  }

  const handleCancel = () => {
    alert.onCancel?.()
    onClose(alert.id)
  }

  return (
    <div className={`alert-item alert-${alert.type}`}>
      <div className="alert-content">
        <div className="alert-icon">{getIcon()}</div>
        <div className="alert-text">
          <h4 className="alert-title">{alert.title}</h4>
          {alert.message && <p className="alert-message">{alert.message}</p>}
        </div>
        {!alert.showConfirmButtons && (
          <button className="alert-close" onClick={() => onClose(alert.id)}>
            <X size={18} />
          </button>
        )}
      </div>

      {alert.showConfirmButtons && (
        <div className="alert-actions">
          <button className="alert-btn alert-btn-cancel" onClick={handleCancel}>
            Cancelar
          </button>
          <button className="alert-btn alert-btn-confirm" onClick={handleConfirm}>
            Confirmar
          </button>
        </div>
      )}
    </div>
  )
}

// Componente especial para éxito del carrito
const CartSuccessAlert = ({ productName, onClose }: { productName: string; onClose: () => void }) => {
  return (
    <div className="alert-item alert-cart-success">
      <div className="alert-content">
        <div className="alert-icon cart-icon">
          <ShoppingCart size={24} />
        </div>
        <div className="alert-text">
          <h4 className="alert-title">¡Agregado al carrito!</h4>
          <p className="alert-message">{productName}</p>
        </div>
        <button className="alert-close" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      <div className="cart-success-animation">
        <div className="cart-success-checkmark">✓</div>
      </div>
    </div>
  )
}

// Provider del contexto
export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alerts, setAlerts] = useState<AlertData[]>([])

  const generateId = () => Math.random().toString(36).substr(2, 9)

  const showAlert = useCallback((alertData: Omit<AlertData, "id">) => {
    const id = generateId()
    const newAlert: AlertData = { ...alertData, id }

    setAlerts((prev) => [...prev, newAlert])

    // Auto-hide para alertas que no son de confirmación
    if (!alertData.showConfirmButtons) {
      const duration = alertData.duration || 3000
      setTimeout(() => {
        hideAlert(id)
      }, duration)
    }
  }, [])

  const hideAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id))
  }, [])

  const showSuccess = useCallback(
    (title: string, message?: string, duration?: number) => {
      showAlert({ type: "success", title, message, duration })
    },
    [showAlert],
  )

  const showError = useCallback(
    (title: string, message?: string, duration?: number) => {
      showAlert({ type: "error", title, message, duration })
    },
    [showAlert],
  )

  const showWarning = useCallback(
    (title: string, message?: string, duration?: number) => {
      showAlert({ type: "warning", title, message, duration })
    },
    [showAlert],
  )

  const showInfo = useCallback(
    (title: string, message?: string, duration?: number) => {
      showAlert({ type: "info", title, message, duration })
    },
    [showAlert],
  )

  const showConfirm = useCallback(
    (title: string, message?: string, onConfirm?: () => void, onCancel?: () => void) => {
      showAlert({
        type: "confirm",
        title,
        message,
        onConfirm,
        onCancel,
        showConfirmButtons: true,
      })
    },
    [showAlert],
  )

  const showCartSuccess = useCallback((productName: string) => {
    const id = generateId()
    setAlerts((prev) => [
      ...prev,
      {
        id,
        type: "success",
        title: "¡Agregado al carrito!",
        message: productName,
        duration: 3000,
      },
    ])

    setTimeout(() => {
      hideAlert(id)
    }, 3000)
  }, [])

  const value: AlertContextType = {
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    showCartSuccess,
    hideAlert,
  }

  return (
    <AlertContext.Provider value={value}>
      {children}
      {typeof window !== "undefined" &&
        createPortal(
          <div className="alert-container">
            {alerts.map((alert) =>
              alert.title === "¡Agregado al carrito!" ? (
                <CartSuccessAlert
                  key={alert.id}
                  productName={alert.message || ""}
                  onClose={() => hideAlert(alert.id)}
                />
              ) : (
                <AlertItem key={alert.id} alert={alert} onClose={hideAlert} />
              ),
            )}
          </div>,
          document.body,
        )}
    </AlertContext.Provider>
  )
}
