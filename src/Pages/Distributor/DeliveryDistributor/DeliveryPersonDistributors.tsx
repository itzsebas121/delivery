"use client"

import React from "react"
import { useState, useEffect } from "react"
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  UserX,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  MapPin,
  Calendar,
  User,
} from "lucide-react"
import { useAlert } from "../../../components/Alerts/Alert-system"
import "./DeliveryPersonDistributors.css"
import { baseURLRest } from "../../../config"

interface DeliveryPerson {
  DeliveryId?: number
  UserId?: number
  DeliveryName: string
  DeliveryEmail: string
  IsAvailable: boolean
  Region: string
  RegistrationDate?: string
  Password?: string
}

const DeliveryPersonsDistributor = () => {
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([])
  const [loading, setLoading] = useState(false)

  // Paginación
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(0)

  // Filtros
  const [nameFilter, setNameFilter] = useState("")
  const [regionFilter, setRegionFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("view")
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState<DeliveryPerson | null>(null)
  const [formData, setFormData] = useState<DeliveryPerson>({
    DeliveryName: "",
    DeliveryEmail: "",
    IsAvailable: true,
    Region: "",
    Password: "",
  })

  // Agregar después de las variables de estado existentes
  const [allFilteredData, setAllFilteredData] = useState<DeliveryPerson[]>([])

  const { showSuccess, showError, showConfirm } = useAlert()

  // Regiones disponibles
  const regions = ["Centro", "Norte", "Sur", "Este", "Oeste"]

  useEffect(() => {
    fetchDeliveryPersons()
  }, [page, nameFilter, regionFilter, statusFilter])

  const fetchDeliveryPersons = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${baseURLRest}/delivery-persons`)
      if (!response.ok) throw new Error("Error al cargar repartidores")

      const data = await response.json()

      // Aplicar filtros localmente
      let filteredData = data

      if (nameFilter) {
        filteredData = filteredData.filter(
          (person: DeliveryPerson) =>
            person.DeliveryName.toLowerCase().includes(nameFilter.toLowerCase()) ||
            person.DeliveryEmail.toLowerCase().includes(nameFilter.toLowerCase()),
        )
      }

      if (regionFilter) {
        filteredData = filteredData.filter((person: DeliveryPerson) => person.Region === regionFilter)
      }

      if (statusFilter) {
        const isAvailable = statusFilter === "available"
        filteredData = filteredData.filter((person: DeliveryPerson) => person.IsAvailable === isAvailable)
      }

      // Guardar todos los datos filtrados
      setAllFilteredData(filteredData)

      // Calcular paginación basada en datos filtrados
      const totalItems = filteredData.length
      setTotalPages(Math.ceil(totalItems / limit))

      // Aplicar paginación del lado del cliente
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedData = filteredData.slice(startIndex, endIndex)

      setDeliveryPersons(paginatedData)
    } catch (err) {
      showError("Error", "No se pudieron cargar los repartidores")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDeliveryPerson = async () => {
    try {
      const response = await fetch(`${baseURLRest}/register-delivery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Name: formData.DeliveryName,
          Email: formData.DeliveryEmail,
          Password: formData.Password,
          Region: formData.Region,
        }),
      })

      if (!response.ok) throw new Error("Error al crear repartidor")

      showSuccess("Repartidor creado", "El repartidor se ha registrado exitosamente")
      closeModal()
      fetchDeliveryPersons()
    } catch (err) {
      showError("Error", "No se pudo crear el repartidor")
    }
  }

  const handleUpdateDeliveryPerson = async () => {
    if (!selectedDeliveryPerson?.UserId) return

    try {
      const response = await fetch(`${baseURLRest}/update-delivery/${selectedDeliveryPerson.UserId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Name: formData.DeliveryName,
          Email: formData.DeliveryEmail,
          Region: formData.Region,
        }),
      })

      if (!response.ok) throw new Error("Error al actualizar repartidor")

      showSuccess("Repartidor actualizado", "Los cambios se han guardado exitosamente")
      closeModal()
      fetchDeliveryPersons()
    } catch (err) {
      showError("Error", "No se pudo actualizar el repartidor")
    }
  }

  const handleDisableDeliveryPerson = (deliveryPerson: DeliveryPerson) => {
    const action = deliveryPerson.IsAvailable ? "inhabilitar" : "habilitar"
    showConfirm(
      `${action.charAt(0).toUpperCase() + action.slice(1)} repartidor`,
      `¿Estás seguro de que deseas ${action} a "${deliveryPerson.DeliveryName}"?`,
      async () => {
        try {
          const response = await fetch(`${baseURLRest}/disable-delivery/${deliveryPerson.UserId}`, {
            method: "PATCH",
          })

          if (!response.ok) throw new Error(`Error al ${action} repartidor`)

          showSuccess(`Repartidor ${action}do`, `El repartidor se ha ${action}do exitosamente`)
          fetchDeliveryPersons()
        } catch (err) {
          showError("Error", `No se pudo ${action} el repartidor`)
        }
      },
    )
  }

  const openModal = (mode: "view" | "edit" | "create", deliveryPerson?: DeliveryPerson) => {
    setModalMode(mode)
    setSelectedDeliveryPerson(deliveryPerson || null)

    if (deliveryPerson) {
      setFormData({
        DeliveryName: deliveryPerson.DeliveryName,
        DeliveryEmail: deliveryPerson.DeliveryEmail,
        IsAvailable: deliveryPerson.IsAvailable,
        Region: deliveryPerson.Region,
        Password: "",
      })
    } else {
      setFormData({
        DeliveryName: "",
        DeliveryEmail: "",
        IsAvailable: true,
        Region: "",
        Password: "",
      })
    }

    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedDeliveryPerson(null)
    setModalMode("view")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const getStatusBadge = (isAvailable: boolean) => {
    return (
      <span className={`status-badge ${isAvailable ? "available" : "unavailable"}`}>
        {isAvailable ? "Disponible" : "No disponible"}
      </span>
    )
  }

  // Función para generar los números de página a mostrar
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      // Si hay pocas páginas, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Lógica para mostrar páginas con puntos suspensivos
      if (page <= 3) {
        // Mostrar primeras páginas
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(totalPages)
      } else if (page >= totalPages - 2) {
        // Mostrar últimas páginas
        pages.push(1)
        pages.push("...")
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // Mostrar páginas del medio
        pages.push(1)
        pages.push("...")
        for (let i = page - 1; i <= page + 1; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(totalPages)
      }
    }

    return pages
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      setPage(newPage)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Skeleton loader
  const TableSkeleton = () => (
    <div className="table-skeleton">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="skeleton-row">
          <div className="skeleton-cell skeleton-id"></div>
          <div className="skeleton-cell skeleton-name"></div>
          <div className="skeleton-cell skeleton-email"></div>
          <div className="skeleton-cell skeleton-region"></div>
          <div className="skeleton-cell skeleton-status"></div>
          <div className="skeleton-cell skeleton-date"></div>
          <div className="skeleton-cell skeleton-actions">
            <div className="skeleton-button"></div>
            <div className="skeleton-button"></div>
            <div className="skeleton-button"></div>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="delivery-persons-admin">
      {/* Header */}
      <div className="admin-header">
        <div className="header-content">
          <div className="header-info">
            <h1>
              <Users size={24} /> Gestión de Repartidores
            </h1>
            <span className="delivery-count">{allFilteredData.length} repartidores</span>
          </div>
          <button className="btn-primary" onClick={() => openModal("create")}>
            <Plus size={18} />
            <span className="btn-text">Nuevo Repartidor</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="search-filter">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={nameFilter}
            onChange={(e) => {
              setNameFilter(e.target.value)
              setPage(1)
            }}
          />
        </div>

        <div className="region-filter">
          <MapPin size={18} />
          <select
            value={regionFilter}
            onChange={(e) => {
              setRegionFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">Todas las regiones</option>
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        <div className="status-filter">
          <Filter size={18} />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">Todos los estados</option>
            <option value="available">Disponibles</option>
            <option value="unavailable">No disponibles</option>
          </select>
        </div>

        {(nameFilter || regionFilter || statusFilter) && (
          <button
            className="btn-clear"
            onClick={() => {
              setNameFilter("")
              setRegionFilter("")
              setStatusFilter("")
              setPage(1)
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="table-section">
        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="table-container">
            <table className="delivery-persons-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Región</th>
                  <th>Estado</th>
                  <th>Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {deliveryPersons.map((person) => (
                  <tr key={person.DeliveryId}>
                    <td>#{person.DeliveryId}</td>
                    <td>
                      <div className="person-info">
                        <div className="person-avatar">
                          <User size={20} />
                        </div>
                        <span className="person-name">{person.DeliveryName}</span>
                      </div>
                    </td>
                    <td className="email-cell">{person.DeliveryEmail}</td>
                    <td>
                      <span className="region-badge">{person.Region}</span>
                    </td>
                    <td>{getStatusBadge(person.IsAvailable)}</td>
                    <td className="date-cell">{formatDate(person.RegistrationDate)}</td>
                    <td>
                      <div className="actions-cell">
                        <button
                          className="btn-action btn-view"
                          onClick={() => openModal("view", person)}
                          title="Ver detalles"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="btn-action btn-edit"
                          onClick={() => openModal("edit", person)}
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className={`btn-action ${person.IsAvailable ? "btn-disable" : "btn-enable"}`}
                          onClick={() => handleDisableDeliveryPerson(person)}
                          title={person.IsAvailable ? "Inhabilitar" : "Habilitar"}
                        >
                          <UserX size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && deliveryPersons.length === 0 && (
          <div className="empty-state">
            <Users size={48} />
            <h3>No hay repartidores</h3>
            <p>No se encontraron repartidores con los filtros seleccionados</p>
          </div>
        )}
      </div>

      {/* Paginación mejorada */}
      {!loading && totalPages > 1 && (
        <div className="pagination-section">
          <button
            className="pagination-btn nav-btn"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            title="Página anterior"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="page-numbers">
            {getPageNumbers().map((pageNum, index) => (
              <React.Fragment key={index}>
                {pageNum === "..." ? (
                  <span className="page-ellipsis">...</span>
                ) : (
                  <button
                    className={`page-btn ${page === pageNum ? "active" : ""}`}
                    onClick={() => handlePageChange(pageNum as number)}
                  >
                    {pageNum}
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>

          <button
            className="pagination-btn nav-btn"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            title="Página siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Modal mejorado */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container delivery-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {modalMode === "create" && "Registrar Repartidor"}
                {modalMode === "edit" && "Editar Repartidor"}
                {modalMode === "view" && "Detalles del Repartidor"}
              </h2>
              <button className="modal-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-content">
              {modalMode === "view" ? (
                <div className="delivery-details">
                  <div className="detail-header">
                    <div className="detail-avatar">
                      <User size={40} />
                    </div>
                    <div className="detail-basic-info">
                      <h3>{selectedDeliveryPerson?.DeliveryName}</h3>
                      <p className="detail-email">{selectedDeliveryPerson?.DeliveryEmail}</p>
                      {getStatusBadge(selectedDeliveryPerson?.IsAvailable || false)}
                    </div>
                  </div>

                  <div className="detail-sections">
                    <div className="detail-section">
                      <h4>
                        <MapPin size={18} /> Información de Ubicación
                      </h4>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <label>Región asignada:</label>
                          <span>{selectedDeliveryPerson?.Region}</span>
                        </div>
                      </div>
                    </div>

                    <div className="detail-section">
                      <h4>
                        <Calendar size={18} /> Información de Registro
                      </h4>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <label>Fecha de registro:</label>
                          <span>{formatDate(selectedDeliveryPerson?.RegistrationDate)}</span>
                        </div>
                        <div className="detail-item">
                          <label>ID del sistema:</label>
                          <span>#{selectedDeliveryPerson?.DeliveryId}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form className="delivery-form">
                  <div className="form-sections">
                    <div className="form-section">
                      <h4>
                        <User size={18} /> Información Personal
                      </h4>
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Nombre completo</label>
                          <input
                            type="text"
                            name="DeliveryName"
                            value={formData.DeliveryName}
                            onChange={handleInputChange}
                            placeholder="Ej: Juan Pérez García"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Correo electrónico</label>
                          <input
                            type="email"
                            name="DeliveryEmail"
                            value={formData.DeliveryEmail}
                            onChange={handleInputChange}
                            placeholder="juan.perez@correo.com"
                            required
                          />
                        </div>

                        {modalMode === "create" && (
                          <div className="form-group full-width">
                            <label>Contraseña</label>
                            <input
                              type="password"
                              name="Password"
                              value={formData.Password}
                              onChange={handleInputChange}
                              placeholder="Contraseña segura"
                              required
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="form-section">
                      <h4>
                        <MapPin size={18} /> Información de Trabajo
                      </h4>
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Región de trabajo</label>
                          <select name="Region" value={formData.Region} onChange={handleInputChange} required>
                            <option value="">Seleccionar región...</option>
                            {regions.map((region) => (
                              <option key={region} value={region}>
                                {region}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>

            <div className="modal-footer">
              {modalMode === "view" ? (
                <button className="btn-secondary" onClick={closeModal}>
                  Cerrar
                </button>
              ) : (
                <>
                  <button className="btn-secondary" onClick={closeModal}>
                    Cancelar
                  </button>
                  <button
                    className="btn-primary"
                    onClick={modalMode === "create" ? handleCreateDeliveryPerson : handleUpdateDeliveryPerson}
                  >
                    <Save size={16} />
                    {modalMode === "create" ? "Registrar Repartidor" : "Guardar Cambios"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeliveryPersonsDistributor
