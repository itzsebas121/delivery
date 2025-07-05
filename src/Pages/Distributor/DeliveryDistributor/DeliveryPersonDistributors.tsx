import React from "react"
import { useState, useEffect } from "react"
import { Search, Filter, Plus, Eye, Edit, UserX, Users, ChevronLeft, ChevronRight, X, Save, MapPin, Calendar, User, Grid, List, Mail, CheckCircle, XCircle, UserCheck } from 'lucide-react'
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

const PersonAvatar = ({ name, className }: { name: string; className: string }) => {
  const colors = [
    "var(--primary-orange)",
    "var(--primary-red)",
    "var(--primary-yellow)",
    "var(--accent-green)",
    "var(--info)",
    "var(--primary-brown)",
  ]
  const color = colors[name.length % colors.length]
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()

  return (
    <div className={`person-avatar-ddp ${className}`} style={{ backgroundColor: color }}>
      <span className="avatar-text-ddp">{initials}</span>
    </div>
  )
}

// Skeleton loader para cards
const CardSkeleton = () => (
  <div className="delivery-card-skeleton-ddp">
    <div className="skeleton-header-ddp">
      <div className="skeleton-avatar-ddp"></div>
      <div className="skeleton-info-ddp">
        <div className="skeleton-name-ddp"></div>
        <div className="skeleton-email-ddp"></div>
      </div>
      <div className="skeleton-status-ddp"></div>
    </div>
    <div className="skeleton-content-ddp">
      <div className="skeleton-region-ddp"></div>
      <div className="skeleton-date-ddp"></div>
    </div>
    <div className="skeleton-actions-ddp">
      <div className="skeleton-button-ddp"></div>
      <div className="skeleton-button-ddp"></div>
      <div className="skeleton-button-ddp"></div>
    </div>
  </div>
)

// Skeleton loader para tabla
const TableSkeleton = () => (
  <div className="table-skeleton-ddp">
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="skeleton-row-ddp">
        <div className="skeleton-cell-ddp skeleton-id-ddp"></div>
        <div className="skeleton-cell-ddp skeleton-person-ddp">
          <div className="skeleton-avatar-small-ddp"></div>
          <div className="skeleton-text-ddp"></div>
        </div>
        <div className="skeleton-cell-ddp skeleton-email-ddp"></div>
        <div className="skeleton-cell-ddp skeleton-region-ddp"></div>
        <div className="skeleton-cell-ddp skeleton-status-ddp"></div>
        <div className="skeleton-cell-ddp skeleton-date-ddp"></div>
        <div className="skeleton-cell-ddp skeleton-actions-ddp">
          <div className="skeleton-button-small-ddp"></div>
          <div className="skeleton-button-small-ddp"></div>
          <div className="skeleton-button-small-ddp"></div>
        </div>
      </div>
    ))}
  </div>
)

const DeliveryPersonsDistributor = () => {
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")

  // Paginación
  const [page, setPage] = useState(1)
  const [limit] = useState(12)
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
      <span className={`status-badge-ddp ${isAvailable ? "available-ddp" : "unavailable-ddp"}`}>
        {isAvailable ? (
          <>
            <CheckCircle size={14} />
            Disponible
          </>
        ) : (
          <>
            <XCircle size={14} />
            No disponible
          </>
        )}
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

  // Componente de Card de Repartidor
  const DeliveryPersonCard = ({ person }: { person: DeliveryPerson }) => (
    <div className={`delivery-card-ddp ${!person.IsAvailable ? "person-disabled-ddp" : ""}`}>
      <div className="card-header-ddp">
        <div className="person-info-ddp">
          <PersonAvatar name={person.DeliveryName} className="card-avatar-ddp" />
          <div className="person-details-ddp">
            <h3 className="person-name-ddp">{person.DeliveryName}</h3>
            <p className="person-email-ddp">
              <Mail size={14} />
              {person.DeliveryEmail}
            </p>
          </div>
        </div>
        <div className="person-id-ddp">#{person.DeliveryId}</div>
      </div>

      <div className="card-content-ddp">
        <div className="person-region-ddp">
          <MapPin size={16} />
          <span className="region-badge-ddp">{person.Region}</span>
        </div>

        <div className="person-status-ddp">{getStatusBadge(person.IsAvailable)}</div>

        <div className="person-date-ddp">
          <Calendar size={14} />
          <span>Registrado: {formatDate(person.RegistrationDate)}</span>
        </div>
      </div>

      <div className="card-actions-ddp">
        <button className="btn-action-ddp btn-view-ddp" onClick={() => openModal("view", person)} title="Ver detalles">
          <Eye size={16} />
        </button>
        <button className="btn-action-ddp btn-edit-ddp" onClick={() => openModal("edit", person)} title="Editar">
          <Edit size={16} />
        </button>
        <button
          className={`btn-action-ddp ${person.IsAvailable ? "btn-disable-ddp" : "btn-enable-ddp"}`}
          onClick={() => handleDisableDeliveryPerson(person)}
          title={person.IsAvailable ? "Inhabilitar" : "Habilitar"}
        >
          {person.IsAvailable ? <UserX size={16} /> : <UserCheck size={16} />}
        </button>
      </div>
    </div>
  )

  return (
    <div className="delivery-persons-admin-ddp">
      {/* Header mejorado */}
      <div className="admin-header-ddp">
        <div className="header-content-ddp">
          <div className="header-info-ddp">
            <div className="header-title-ddp">
              <Users size={28} className="header-icon-ddp" />
              <div>
                <h1>Gestión de Repartidores</h1>
                <span className="delivery-count-ddp">{allFilteredData.length} repartidores</span>
              </div>
            </div>
          </div>
          <div className="header-actions-ddp">
            <div className="view-toggle-ddp">
              <button
                className={`view-btn-ddp ${viewMode === "grid" ? "active-ddp" : ""}`}
                onClick={() => setViewMode("grid")}
                title="Vista de tarjetas"
              >
                <Grid size={18} />
              </button>
              <button
                className={`view-btn-ddp ${viewMode === "table" ? "active-ddp" : ""}`}
                onClick={() => setViewMode("table")}
                title="Vista de tabla"
              >
                <List size={18} />
              </button>
            </div>
            <button className="btn-primary-ddp" onClick={() => openModal("create")}>
              <Plus size={18} />
              <span className="btn-text-ddp">Nuevo Repartidor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filtros mejorados */}
      <div className="filters-section-ddp">
        <div className="filters-container-ddp">
          <div className="search-filter-ddp">
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
          <div className="region-filter-ddp">
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
          <div className="status-filter-ddp">
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
              className="btn-clear-ddp"
              onClick={() => {
                setNameFilter("")
                setRegionFilter("")
                setStatusFilter("")
                setPage(1)
              }}
            >
              <X size={16} />
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="content-section-ddp">
        {loading ? (
          viewMode === "grid" ? (
            <div className="delivery-grid-ddp">
              {Array.from({ length: 8 }).map((_, index) => (
                <CardSkeleton key={index} />
              ))}
            </div>
          ) : (
            <TableSkeleton />
          )
        ) : viewMode === "grid" ? (
          <div className="delivery-grid-ddp">
            {deliveryPersons.map((person) => (
              <DeliveryPersonCard key={person.DeliveryId} person={person} />
            ))}
          </div>
        ) : (
          <div className="table-section-ddp">
            <div className="table-container-ddp">
              <table className="delivery-persons-table-ddp">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th className="hide-mobile-ddp">Email</th>
                    <th>Región</th>
                    <th>Estado</th>
                    <th className="hide-mobile-ddp">Registro</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveryPersons.map((person) => (
                    <tr key={person.DeliveryId} className={!person.IsAvailable ? "person-disabled-ddp" : ""}>
                      <td>
                        <span className="person-id-table-ddp">#{person.DeliveryId}</span>
                      </td>
                      <td>
                        <div className="person-info-table-ddp">
                          <PersonAvatar name={person.DeliveryName} className="table-avatar-ddp" />
                          <div className="person-details-table-ddp">
                            <span className="person-name-table-ddp">{person.DeliveryName}</span>
                            <span className="person-mobile-info-ddp hide-desktop-ddp">
                              {person.DeliveryEmail} • {person.Region}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="email-cell-ddp hide-mobile-ddp">{person.DeliveryEmail}</td>
                      <td>
                        <span className="region-badge-table-ddp">{person.Region}</span>
                      </td>
                      <td>{getStatusBadge(person.IsAvailable)}</td>
                      <td className="date-cell-ddp hide-mobile-ddp">{formatDate(person.RegistrationDate)}</td>
                      <td>
                        <div className="actions-cell-ddp">
                          <button
                            className="btn-action-ddp btn-view-ddp"
                            onClick={() => openModal("view", person)}
                            title="Ver detalles"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="btn-action-ddp btn-edit-ddp"
                            onClick={() => openModal("edit", person)}
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className={`btn-action-ddp ${person.IsAvailable ? "btn-disable-ddp" : "btn-enable-ddp"}`}
                            onClick={() => handleDisableDeliveryPerson(person)}
                            title={person.IsAvailable ? "Inhabilitar" : "Habilitar"}
                          >
                            {person.IsAvailable ? <UserX size={16} /> : <UserCheck size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && deliveryPersons.length === 0 && (
          <div className="empty-state-ddp">
            <Users size={64} />
            <h3>No hay repartidores</h3>
            <p>No se encontraron repartidores con los filtros seleccionados</p>
            <button className="btn-primary-ddp" onClick={() => openModal("create")}>
              <Plus size={18} />
              Registrar primer repartidor
            </button>
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

      {showModal && (
        <div className="modal-overlay-ddp">
          <div className="modal-container-ddp delivery-modal-ddp" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-ddp">
              <h2>
                {modalMode === "create" && "Registrar Repartidor"}
                {modalMode === "edit" && "Editar Repartidor"}
                {modalMode === "view" && "Detalles del Repartidor"}
              </h2>
              <button className="modal-close-ddp" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-content-ddp">
              {modalMode === "view" ? (
                <div className="delivery-details-ddp">
                  <div className="detail-header-ddp">
                    <PersonAvatar name={selectedDeliveryPerson?.DeliveryName || ""} className="detail-avatar-ddp" />
                    <div className="detail-basic-info-ddp">
                      <h3>{selectedDeliveryPerson?.DeliveryName}</h3>
                      <p className="detail-email-ddp">
                        <Mail size={16} />
                        {selectedDeliveryPerson?.DeliveryEmail}
                      </p>
                      {getStatusBadge(selectedDeliveryPerson?.IsAvailable || false)}
                    </div>
                  </div>
                  <div className="detail-sections-ddp">
                    <div className="detail-section-ddp">
                      <h4>
                        <MapPin size={18} /> Información de Ubicación
                      </h4>
                      <div className="detail-grid-ddp">
                        <div className="detail-item-ddp">
                          <label>Región asignada:</label>
                          <span className="region-badge-ddp">{selectedDeliveryPerson?.Region}</span>
                        </div>
                      </div>
                    </div>
                    <div className="detail-section-ddp">
                      <h4>
                        <Calendar size={18} /> Información de Registro
                      </h4>
                      <div className="detail-grid-ddp">
                        <div className="detail-item-ddp">
                          <label>Fecha de registro:</label>
                          <span>{formatDate(selectedDeliveryPerson?.RegistrationDate)}</span>
                        </div>
                        <div className="detail-item-ddp">
                          <label>ID del sistema:</label>
                          <span>#{selectedDeliveryPerson?.DeliveryId}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form className="delivery-form-ddp">
                  <div className="form-sections-ddp">
                    <div className="form-section-ddp">
                      <h4>
                        <User size={18} /> Información Personal
                      </h4>
                      <div className="form-grid-ddp">
                        <div className="form-group-ddp">
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
                        <div className="form-group-ddp">
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
                          <div className="form-group-ddp full-width-ddp">
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
                    <div className="form-section-ddp">
                      <h4>
                        <MapPin size={18} /> Información de Trabajo
                      </h4>
                      <div className="form-grid-ddp">
                        <div className="form-group-ddp">
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
            <div className="modal-footer-ddp">
              {modalMode === "view" ? (
                <button className="btn-secondary-ddp" onClick={closeModal}>
                  Cerrar
                </button>
              ) : (
                <>
                  <button className="btn-secondary-ddp" onClick={closeModal}>
                    Cancelar
                  </button>
                  <button
                    className="btn-primary-ddp"
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
