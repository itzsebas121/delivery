"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Clock,
  Package,
  CheckCircle,
  XCircle,
  Truck,
  Search,
  RotateCcw,
  Eye,
  Calendar,
  DollarSign,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
} from "lucide-react"
import { baseURLRest } from "../../../config"
import OrderDetailsModal from "./order-detail-modal"
import "./order-history.css"
import { useAuth } from "../../../context/Authcontext"

interface Order {
  OrderId: number
  OrderDate: string
  Status: "Pending" | "Completed" | "Cancelada" | "En camino"
  DeliveryAddress: string
  total: number
}

const OrderHistory: React.FC<{ clientId?: number }> = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingp, setLoadingp] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, loading } = useAuth()
  const clientId = user?.rol === "Client" && "clientId" in user ? (user as any).clientId : 1

  // Filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(3)

  // Modal
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)

  const fetchOrders = async () => {
    setLoadingp(true)
    setError(null)
    try {
      const response = await fetch(`${baseURLRest}/product-history/${clientId}`)

      if (!response.ok) {
        throw new Error("Error al cargar los pedidos")
      }

      const data: Order[] = await response.json()
      // Ordenar por fecha más reciente primero
      const sortedData = data.sort((a, b) => new Date(b.OrderDate).getTime() - new Date(a.OrderDate).getTime())
      setOrders(sortedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoadingp(false)
    }
  }

  // Cargar pedidos
  useEffect(() => {
    if (!loading) {
      fetchOrders()
    }
  }, [clientId])

  if (loading) {
    console.log("Cargando datos del usuario...")
    return (
      <div className="loading-container">
        <Loader2 className="loading-icon" />
      </div>
    )
  }

  // Filtrar pedidos
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.OrderId.toString().includes(searchTerm) ||
      order.DeliveryAddress.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || order.Status.toLowerCase() === statusFilter.toLowerCase()

    return matchesSearch && matchesStatus
  })

  // Separar por estado
  const ordersByStatus = {
    pending: filteredOrders.filter((order) => order.Status === "Pending"),
    "in-transit": filteredOrders.filter((order) => order.Status === "En camino"),
    completed: filteredOrders.filter((order) => order.Status === "Completed"),
    Cancelada: filteredOrders.filter((order) => order.Status === "Cancelada"),
  }

  // Estadísticas
  const stats = {
    pending: orders.filter((order) => order.Status === "Pending").length,
    completed: orders.filter((order) => order.Status === "Completed").length,
    Cancelada: orders.filter((order) => order.Status === "Cancelada").length,
    inTransit: orders.filter((order) => order.Status === "En camino").length,
  }

  // Paginación
  const getPaginatedOrders = (orders: Order[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return orders.slice(startIndex, endIndex)
  }

  const getTotalPages = (orders: Order[]) => {
    return Math.ceil(orders.length / itemsPerPage)
  }

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setCurrentPage(1)
  }

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Obtener icono de estado
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock size={14} />
      case "En camino":
        return <Truck size={14} />
      case "completed":
        return <CheckCircle size={14} />
      case "Cancelada":
        return <XCircle size={14} />
      default:
        return <Package size={14} />
    }
  }

  // Obtener texto de estado
  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "Pendiente"
      case "En camino":
        return "En tránsito"
      case "completed":
        return "Completado"
      case "Cancelada":
        return "Cancelado"
      default:
        return status
    }
  }

  // Abrir modal de detalles
  const openOrderDetails = (orderId: number) => {
    setSelectedOrderId(orderId)
    setShowModal(true)
  }

  // Renderizar sección de pedidos
  const renderOrderSection = (title: string, orders: Order[], icon: React.ReactNode) => {
    if (orders.length === 0) return null

    const paginatedOrders = getPaginatedOrders(orders)
    const totalPages = getTotalPages(orders)

    return (
      <div className="order-section">
        <div className="order-section-header">
          <h3 className="order-section-title">
            {icon}
            {title}
            <span className="order-section-count">{orders.length}</span>
          </h3>
        </div>

        <div className="order-grid">
          {paginatedOrders.map((order) => (
            <div key={order.OrderId} className="order-card" onClick={() => openOrderDetails(order.OrderId)}>
              {/* Badge de estado flotante */}
              <div className={`order-status-floating ${order.Status.toLowerCase().replace(/\s+/g, "-")}`}>
                {getStatusIcon(order.Status)}
                {getStatusText(order.Status)}
              </div>

              <div className="order-card-content">
                <div className="order-card-header">
                  <div className="order-card-id">
                    <Package size={18} />
                    Pedido #{order.OrderId}
                  </div>
                  <div className="order-card-date">
                    <Calendar size={14} />
                    {formatDate(order.OrderDate)}
                  </div>
                </div>

                <div className="order-card-body">
                  <div className="order-card-address">
                    <MapPin size={16} />
                    <span>{order.DeliveryAddress}</span>
                  </div>
                </div>

                <div className="order-card-total">
                  <span className="order-total-label">Total del pedido</span>
                  <span className="order-total-amount">
                    <DollarSign size={18} />
                    {order.total.toFixed(2)}
                  </span>
                </div>

                <button
                  className="order-details-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    openOrderDetails(order.OrderId)
                  }}
                >
                  <Eye size={16} />
                  Ver detalles
                </button>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="order-pagination">
            <button
              className="order-pagination-btn"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page
              if (totalPages <= 5) {
                page = i + 1
              } else if (currentPage <= 3) {
                page = i + 1
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i
              } else {
                page = currentPage - 2 + i
              }
              return (
                <button
                  key={page}
                  className={`order-pagination-btn ${currentPage === page ? "active" : ""}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              )
            })}

            <button
              className="order-pagination-btn"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
            </button>

            <span className="order-pagination-info">
              Página {currentPage} de {totalPages}
            </span>
          </div>
        )}
      </div>
    )
  }

  if (loadingp) {
    return (
      <div className="order-loading">
        <Loader2 className="order-spinner" size={32} />
        <p>Cargando historial de pedidos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="order-history-container">
        <div className="order-empty">
          <XCircle className="order-empty-icon" size={64} />
          <h3 className="order-empty-title">Error al cargar pedidos</h3>
          <p className="order-empty-text">{error}</p>
          <button
            onClick={fetchOrders}
            className="order-details-btn"
            style={{ marginTop: "1rem", position: "relative" }}
          >
            <RotateCcw size={16} />
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="order-history-container">
      {/* Header */}
      <div className="order-history-header">
        <h1 className="order-history-title">
          <ShoppingBag size={32} />
          Historial de Pedidos
        </h1>
        <p className="order-history-subtitle">Revisa todos tus pedidos y su estado actual</p>
      </div>
      <div className="order-stats">
        <div className="order-stat-card">
          <div className="order-stat-icon pending">
            <Clock size={20} />
          </div>
          <div className="order-stat-number">{stats.pending}</div>
          <div className="order-stat-label">Pendientes</div>
        </div>

        <div className="order-stat-card">
          <div className="order-stat-icon in-transit">
            <Truck size={20} />
          </div>
          <div className="order-stat-number">{stats.inTransit}</div>
          <div className="order-stat-label">En tránsito</div>
        </div>

        <div className="order-stat-card">
          <div className="order-stat-icon completed">
            <CheckCircle size={20} />
          </div>
          <div className="order-stat-number">{stats.completed}</div>
          <div className="order-stat-label">Completados</div>
        </div>

        <div className="order-stat-card">
          <div className="order-stat-icon cancelled">
            <XCircle size={20} />
          </div>
          <div className="order-stat-number">{stats.Cancelada}</div>
          <div className="order-stat-label">Cancelados</div>
        </div>
      </div>

      {/* Controles y filtros */}
      <div className="order-history-controls">
        <div className="order-filters">
          <div className="order-search-group">
            <label className="order-search-label">
              <Search size={16} />
              Buscar pedidos
            </label>
            <input
              type="text"
              placeholder="Buscar por número de pedido o dirección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="order-search-input"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="order-filter-select"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="En camino">En tránsito</option>
            <option value="completed">Completados</option>
            <option value="Cancelada">Cancelados</option>
          </select>

          <button onClick={clearFilters} className="order-clear-btn">
            <RotateCcw size={16} />
            Limpiar
          </button>
        </div>
      </div>


      {/* Secciones de pedidos */}
      {filteredOrders.length === 0 ? (
        <div className="order-empty">
          <Package className="order-empty-icon" size={64} />
          <h3 className="order-empty-title">No se encontraron pedidos</h3>
          <p className="order-empty-text">
            {searchTerm || statusFilter !== "all"
              ? "Intenta ajustar los filtros de búsqueda"
              : "Aún no has realizado ningún pedido"}
          </p>
        </div>
      ) : (
        <>
          {renderOrderSection("Pedidos Pendientes", ordersByStatus.pending, <Clock size={20} />)}
          {renderOrderSection("En Tránsito", ordersByStatus["in-transit"], <Truck size={20} />)}
          {renderOrderSection("Completados", ordersByStatus.completed, <CheckCircle size={20} />)}
          {renderOrderSection("Cancelados", ordersByStatus.Cancelada, <XCircle size={20} />)}
        </>
      )}

      {/* Modal de detalles */}
      {showModal && selectedOrderId && (
        <OrderDetailsModal
          orderId={selectedOrderId}
          onClose={() => {
            setShowModal(false)
            setSelectedOrderId(null)
          }}
        />
      )}
    </div>
  )
}

export default OrderHistory
