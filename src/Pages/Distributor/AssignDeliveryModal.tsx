"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { baseURLRest } from "../../config"
import "./Styles/orders-distributor.css"

interface DeliveryPerson {
  DeliveryPersonId: number
  Name: string
  Email: string
  Phone: string
  Status: string
}

interface AssignDeliveryModalProps {
  orderId: number
  onClose: () => void
  onAssigned: () => void
}

export default function AssignDeliveryModal({ orderId, onClose, onAssigned }: AssignDeliveryModalProps) {
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([])
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<number | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<boolean>(false)

  // Obtener lista de repartidores disponibles
  useEffect(() => {
    const fetchDeliveryPersons = async () => {
      setLoading(true)
      try {
        const response = await fetch(`${baseURLRest}/delivery-persons/available`)
        if (!response.ok) {
          throw new Error("Error al obtener repartidores")
        }
        const data = await response.json()
        setDeliveryPersons(data)
      } catch (err) {
        setError("Error al cargar repartidores. Por favor, intente nuevamente.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchDeliveryPersons()
  }, [])

  // Manejar la asignación del repartidor
  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDeliveryId) {
      alert("Por favor, seleccione un repartidor")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`${baseURLRest}/sales/${orderId}/assign`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deliveryPersonId: selectedDeliveryId,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al asignar repartidor")
      }

      onAssigned()
    } catch (err) {
      console.error("Error al asignar repartidor:", err)
      alert("No se pudo asignar el repartidor. Por favor, intente nuevamente.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Asignar Repartidor</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="modal-loading">
              <div className="orders-loader"></div>
              <p>Cargando repartidores...</p>
            </div>
          ) : error ? (
            <div className="modal-error">
              <p>{error}</p>
              <button onClick={() => window.location.reload()} className="order-btn">
                Reintentar
              </button>
            </div>
          ) : (
            <form onSubmit={handleAssign}>
              <div className="form-group">
                <label htmlFor="deliveryPerson">Seleccione un repartidor:</label>
                {deliveryPersons.length > 0 ? (
                  <select
                    id="deliveryPerson"
                    value={selectedDeliveryId || ""}
                    onChange={(e) => setSelectedDeliveryId(Number(e.target.value))}
                    required
                  >
                    <option value="">-- Seleccionar repartidor --</option>
                    {deliveryPersons.map((person) => (
                      <option key={person.DeliveryPersonId} value={person.DeliveryPersonId}>
                        {person.Name} - {person.Email}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="no-delivery-persons">No hay repartidores disponibles</p>
                )}
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
                  {submitting ? "Asignando..." : "Asignar Repartidor"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
