"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { baseURLRest } from "../../../config"
import { Truck, X, AlertCircle, Loader2, User, MapPin, CheckCircle } from "lucide-react"
import { useAlert } from "../../../components/Alerts/Alert-system"

interface DeliveryPerson {
  DeliveryId: number
  UserId: number
  DeliveryName: string
  DeliveryEmail: string
  IsAvailable: boolean
  Region: string
  RegistrationDate: string
}

interface AssignDeliveryModalProps {
  orderId: number
  onClose: () => void
  onAssigned: () => void
}

// Componente de skeleton para la lista de repartidores
const DeliveryPersonSkeleton = () => (
  <div className="delivery-person-skeleton">
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="skeleton-delivery-item">
        <div className="skeleton-avatar"></div>
        <div className="skeleton-info">
          <div className="skeleton-name"></div>
          <div className="skeleton-email"></div>
          <div className="skeleton-region"></div>
        </div>
      </div>
    ))}
  </div>
)

// Componente para mostrar un repartidor
const DeliveryPersonCard = ({
  person,
  isSelected,
  onSelect,
}: {
  person: DeliveryPerson
  isSelected: boolean
  onSelect: () => void
}) => (
  <div className={`delivery-person-card ${isSelected ? "selected" : ""}`} onClick={onSelect}>
    <div className="delivery-person-avatar">
      <User size={24} />
    </div>
    <div className="delivery-person-info">
      <h4 className="delivery-person-name">{person.DeliveryName}</h4>
      <p className="delivery-person-email">{person.DeliveryEmail}</p>
      <div className="delivery-person-region">
        <MapPin size={14} />
        <span>{person.Region}</span>
      </div>
    </div>
    {isSelected && (
      <div className="selection-indicator">
        <CheckCircle size={20} />
      </div>
    )}
  </div>
)

export default function AssignDeliveryModal({ orderId, onClose, onAssigned }: AssignDeliveryModalProps) {
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([])
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<number | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<boolean>(false)

  const { showSuccess, showError } = useAlert()

  // Obtener lista de repartidores disponibles
  useEffect(() => {
    const fetchDeliveryPersons = async () => {
      setLoading(true)
      setError(null)

      try {
        // Simular delay para mostrar loading state
        await new Promise((resolve) => setTimeout(resolve, 800))

        const response = await fetch(`${baseURLRest}/delivery-persons`)
        if (!response.ok) {
          throw new Error("Error al obtener repartidores")
        }
        const data = await response.json()

        // Filtrar solo repartidores disponibles
        const availableDeliveryPersons = data.filter((person: DeliveryPerson) => person.IsAvailable)
        setDeliveryPersons(availableDeliveryPersons)
      } catch (err) {
        setError("Error al cargar repartidores. Por favor, intente nuevamente.")
        showError("Error", "Error al cargar repartidores. Por favor, intente nuevamente.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchDeliveryPersons()
  }, [showError])

  // Manejar la asignación del repartidor
  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDeliveryId) {
      showError("Error", "Por favor, seleccione un repartidor")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`${baseURLRest}/assign-delivery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          OrderId: orderId,
          DeliveryId: selectedDeliveryId,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al asignar repartidor")
      }

      // Simular delay para mostrar estado de éxito
      await new Promise((resolve) => setTimeout(resolve, 500))

      showSuccess("Repartidor asignado", "El repartidor ha sido asignado correctamente a la orden")
      onAssigned()
      onClose()
    } catch (err) {
      console.error("Error al asignar repartidor:", err)
      showError("Error", "No se pudo asignar el repartidor. Por favor, intente nuevamente.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    setLoading(true)
    // Re-ejecutar el useEffect
    window.location.reload()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container assign-delivery-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-section">
            <h2>
              <Truck size={22} /> Asignar Repartidor
            </h2>
            <p className="modal-subtitle">Orden #{orderId}</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="modal-loading">
              <div className="loading-animation">
                <Loader2 size={40} className="animate-spin" />
              </div>
              <h3>Cargando repartidores disponibles...</h3>
              <p>Buscando los mejores repartidores para tu orden</p>
              <DeliveryPersonSkeleton />
            </div>
          ) : error ? (
            <div className="modal-error">
              <AlertCircle size={48} color="var(--error)" />
              <h3>Error al cargar repartidores</h3>
              <p>{error}</p>
              <button onClick={handleRetry} className="order-btn order-btn-retry">
                <Loader2 size={18} />
                Reintentar
              </button>
            </div>
          ) : deliveryPersons.length === 0 ? (
            <div className="no-delivery-persons">
              <Truck size={48} />
              <h3>No hay repartidores disponibles</h3>
              <p>En este momento no hay repartidores disponibles para asignar a esta orden.</p>
              <button onClick={onClose} className="order-btn order-btn-cancel">
                Cerrar
              </button>
            </div>
          ) : (
            <form onSubmit={handleAssign} className="assign-delivery-form">
              <div className="form-section">
                <h3 className="section-title">Selecciona un repartidor ({deliveryPersons.length} disponibles)</h3>
                <div className="delivery-persons-grid">
                  {deliveryPersons.map((person) => (
                    <DeliveryPersonCard
                      key={person.DeliveryId}
                      person={person}
                      isSelected={selectedDeliveryId === person.DeliveryId}
                      onSelect={() => setSelectedDeliveryId(person.DeliveryId)}
                    />
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="order-btn order-btn-cancel" onClick={onClose} disabled={submitting}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="order-btn order-btn-assign"
                  disabled={!selectedDeliveryId || submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Asignando...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Asignar Repartidor
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
