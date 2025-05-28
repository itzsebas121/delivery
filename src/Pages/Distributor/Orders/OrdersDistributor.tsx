import type React from "react"

import { useState, useEffect } from "react"
import { baseURLRest } from "../../../config"
import AssignDeliveryModal from "./AssignDeliveryModal"
import OrderDetailsModal from "./order-details-modal"
import './Orders.css'
import { ShoppingBag, Truck, CheckCircle, XCircle, Calendar, MapPin, User, DollarSign, Filter, Search, Loader2 } from 'lucide-react'

// Definir interfaces para los tipos de datos
interface Order {
  OrderId: number
  OrderDate: string
  Status: "Pending" | "En camino" | "Completed" | "Canceled"
  DeliveryAddress: string
  Total: number
  DiscountedTotal: number
  ClientId: number
  ClientName: string
  ClientEmail: string
  DiscountCode: string | null
  DiscountPercentage: number | null
}

type OrderStatus = "All" | "Pending" | "En camino" | "Completed" | "Canceled"

export default function OrdersDistributor() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false)
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<OrderStatus>("All")
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Estados de paginación para cada sección
  const [pendingPage, setPendingPage] = useState(1)
  const [inTransitPage, setInTransitPage] = useState(1)
  const [completedPage, setCompletedPage] = useState(1)
  const [canceledPage, setCanceledPage] = useState(1)
  const itemsPerPage = 6

  // Obtener todas las órdenes
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      try {
        const response = await fetch(`${baseURLRest}/sales`)
        if (!response.ok) {
          throw new Error("Error al obtener las órdenes")
        }
        const data = await response.json()
        setOrders(data)
      } catch (err) {
        setError("Error al cargar las órdenes. Por favor, intente nuevamente.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  // Resetear paginación cuando cambian los filtros
  useEffect(() => {
    setPendingPage(1)
    setInTransitPage(1)
    setCompletedPage(1)
    setCanceledPage(1)
  }, [statusFilter, searchQuery])

  // Filtrar órdenes por estado seleccionado y búsqueda
  const filteredOrders = orders
    .filter((order) => statusFilter === "All" || order.Status === statusFilter)
    .filter((order) => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        order.ClientName.toLowerCase().includes(query) ||
        order.DeliveryAddress.toLowerCase().includes(query) ||
        order.OrderId.toString().includes(query)
      )
    })

  // Filtrar órdenes por estado para las secciones con paginación
  const pendingOrders = filteredOrders.filter((order) => order.Status === "Pending")
  const inTransitOrders = filteredOrders.filter((order) => order.Status === "En camino")
  const completedOrders = filteredOrders.filter((order) => order.Status === "Completed")
  const canceledOrders = filteredOrders.filter((order) => order.Status === "Canceled")

  // Funciones de paginación
  const getPaginatedOrders = (orders: Order[], currentPage: number) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return orders.slice(startIndex, endIndex)
  }

  const getTotalPages = (totalItems: number) => {
    return Math.ceil(totalItems / itemsPerPage)
  }

  // Órdenes paginadas para cada sección
  const paginatedPendingOrders = getPaginatedOrders(pendingOrders, pendingPage)
  const paginatedInTransitOrders = getPaginatedOrders(inTransitOrders, inTransitPage)
  const paginatedCompletedOrders = getPaginatedOrders(completedOrders, completedPage)
  const paginatedCanceledOrders = getPaginatedOrders(canceledOrders, canceledPage)

  // Manejar la cancelación de una orden
  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm("¿Está seguro que desea cancelar esta orden?")) {
      return
    }

    try {
      const response = await fetch(`${baseURLRest}/sales/${orderId}/cancel`, {
        method: "PUT",
      })

      if (!response.ok) {
        throw new Error("Error al cancelar la orden")
      }

      // Actualizar el estado local
      setOrders((prevOrders) =>
        prevOrders.map((order) => (order.OrderId === orderId ? { ...order, Status: "Canceled" } : order)),
      )
    } catch (err) {
      console.error("Error al cancelar la orden:", err)
      alert("No se pudo cancelar la orden. Por favor, intente nuevamente.")
    }
  }

  // Abrir modal para asignar repartidor
  const handleAssignDelivery = (orderId: number) => {
    setSelectedOrderId(orderId)
    setShowAssignModal(true)
  }

  // Manejar la asignación del repartidor
  const handleDeliveryAssigned = () => {
    if (!selectedOrderId) return

    // Actualizar el estado local
    setOrders((prevOrders) =>
      prevOrders.map((order) => (order.OrderId === selectedOrderId ? { ...order, Status: "En camino" } : order)),
    )
    setShowAssignModal(false)
  }

  // Ver detalles de una orden
  const handleViewDetails = (orderId: number) => {
    setSelectedOrderId(orderId)
    setShowDetailsModal(true)
  }

  // Manejar cambio de filtro
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value as OrderStatus)
  }

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
    return new Date(dateString).toLocaleDateString("es-ES", options)
  }

  // Renderizar controles de paginación
  const renderPaginationControls = (
    currentPage: number,
    totalItems: number,
    onPageChange: (page: number) => void,
    sectionName: string
  ) => {
    const totalPages = getTotalPages(totalItems)
    
    if (totalPages <= 1) return null

    const getVisiblePages = () => {
      const delta = 2
      const range = []
      const rangeWithDots = []

      for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
        range.push(i)
      }

      if (currentPage - delta > 2) {
        rangeWithDots.push(1, '...')
      } else {
        rangeWithDots.push(1)
      }

      rangeWithDots.push(...range)

      if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push('...', totalPages)
      } else {
        rangeWithDots.push(totalPages)
      }

      return rangeWithDots
    }

    return (
      <div className="pagination-section">
        <button
          className="pagination-btn nav-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ←
        </button>

        <div className="page-numbers">
          {getVisiblePages().map((page, index) => (
            <button
              key={`${sectionName}-${index}`}
              className={`page-btn ${page === currentPage ? 'active' : ''} ${typeof page === 'string' ? 'dots' : ''}`}
              onClick={() => typeof page === 'number' && onPageChange(page)}
              disabled={typeof page === 'string'}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          className="pagination-btn nav-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
           →
        </button>

        <div className="pagination-info">
          <span>
            Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} - {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} órdenes
          </span>
        </div>
      </div>
    )
  }

  // Renderizar una tarjeta de orden
  const renderOrderCard = (order: Order) => {
    // Determinar el icono según el estado
    const getStatusIcon = () => {
      switch (order.Status) {
        case "Pending":
          return <ShoppingBag size={18} />
        case "En camino":
          return <Truck size={18} />
        case "Completed":
          return <CheckCircle size={18} />
        case "Canceled":
          return <XCircle size={18} />
        default:
          return <ShoppingBag size={18} />
      }
    }

    return (
      <div className="order-card" key={order.OrderId}>
        <div className="order-card-header">
          <h3>Orden #{order.OrderId}</h3>
          <span className={`order-status order-status-${order.Status.toLowerCase().replace(" ", "-")}`}>
            {getStatusIcon()} {order.Status}
          </span>
        </div>

        <div className="order-card-body">
          <div className="order-info">
            <p>
              <strong>
                <User size={16} /> Cliente:
              </strong>
              <span>{order.ClientName}</span>
            </p>
            <p>
              <strong>
                <Calendar size={16} /> Fecha:
              </strong>
              <span>{formatDate(order.OrderDate)}</span>
            </p>
            <p>
              <strong>
                <MapPin size={16} /> Dirección:
              </strong>
              <span>{order.DeliveryAddress}</span>
            </p>
            <p>
              <strong>
                <DollarSign size={16} /> Total:
              </strong>
              <span>${order.DiscountedTotal.toFixed(2)}</span>
            </p>
          </div>
        </div>

        <div className="order-card-actions">
          <button className="order-btn order-btn-details" onClick={() => handleViewDetails(order.OrderId)}>
            Ver detalles
          </button>

          {order.Status === "Pending" && (
            <>
              <button className="order-btn order-btn-assign" onClick={() => handleAssignDelivery(order.OrderId)}>
                Asignar repartidor
              </button>
              <button className="order-btn order-btn-cancel" onClick={() => handleCancelOrder(order.OrderId)}>
                Cancelar orden
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // Renderizar órdenes filtradas o agrupadas por sección
  const renderOrders = () => {
    if (statusFilter !== "All") {
      return (
        <div className="orders-section">
          <h2 className="section-title">
            {statusFilter === "Pending" && <ShoppingBag size={22} />}
            {statusFilter === "En camino" && <Truck size={22} />}
            {statusFilter === "Completed" && <CheckCircle size={22} />}
            {statusFilter === "Canceled" && <XCircle size={22} />}
            Órdenes {statusFilter} ({filteredOrders.length})
          </h2>
          <div className="orders-container">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => renderOrderCard(order))
            ) : (
              <div className="empty-orders">
                <p>No hay órdenes con el estado {statusFilter}</p>
              </div>
            )}
          </div>
        </div>
      )
    }

    // Si no hay filtro, mostrar todas las secciones con paginación
    return (
      <>
        {/* Sección Pendientes */}
        <div className="orders-section">
          <h2 className="section-title">
            <ShoppingBag size={22} /> Órdenes Pendientes ({pendingOrders.length})
          </h2>
          <div className="orders-container">
            {paginatedPendingOrders.length > 0 ? (
              paginatedPendingOrders.map((order) => renderOrderCard(order))
            ) : (
              <div className="empty-orders">
                <p>No hay órdenes pendientes</p>
              </div>
            )}
          </div>
          {renderPaginationControls(
            pendingPage,
            pendingOrders.length,
            setPendingPage,
            'pending'
          )}
        </div>

        {/* Sección En Camino */}
        <div className="orders-section">
          <h2 className="section-title">
            <Truck size={22} /> Órdenes En Camino ({inTransitOrders.length})
          </h2>
          <div className="orders-container">
            {paginatedInTransitOrders.length > 0 ? (
              paginatedInTransitOrders.map((order) => renderOrderCard(order))
            ) : (
              <div className="empty-orders">
                <p>No hay órdenes en camino</p>
              </div>
            )}
          </div>
          {renderPaginationControls(
            inTransitPage,
            inTransitOrders.length,
            setInTransitPage,
            'inTransit'
          )}
        </div>

        {/* Sección Completadas */}
        <div className="orders-section">
          <h2 className="section-title">
            <CheckCircle size={22} /> Órdenes Completadas ({completedOrders.length})
          </h2>
          <div className="orders-container">
            {paginatedCompletedOrders.length > 0 ? (
              paginatedCompletedOrders.map((order) => renderOrderCard(order))
            ) : (
              <div className="empty-orders">
                <p>No hay órdenes completadas</p>
              </div>
            )}
          </div>
          {renderPaginationControls(
            completedPage,
            completedOrders.length,
            setCompletedPage,
            'completed'
          )}
        </div>

        {/* Sección Canceladas */}
        <div className="orders-section">
          <h2 className="section-title">
            <XCircle size={22} /> Órdenes Canceladas ({canceledOrders.length})
          </h2>
          <div className="orders-container">
            {paginatedCanceledOrders.length > 0 ? (
              paginatedCanceledOrders.map((order) => renderOrderCard(order))
            ) : (
              <div className="empty-orders">
                <p>No hay órdenes canceladas</p>
              </div>
            )}
          </div>
          {renderPaginationControls(
            canceledPage,
            canceledOrders.length,
            setCanceledPage,
            'canceled'
          )}
        </div>
      </>
    )
  }

  if (loading) {
    return (
      <div className="orders-loading">
        <Loader2 size={50} className="animate-spin" />
        <p>Cargando órdenes...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="orders-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="order-btn">
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="orders-dashboard">
      <div className="dashboard-header">
        <h1>Dashboard de Ventas</h1>
        <div className="dashboard-summary">
          <div className="summary-card">
            <h3>Pendientes</h3>
            <span className="summary-count">{orders.filter((o) => o.Status === "Pending").length}</span>
          </div>
          <div className="summary-card">
            <h3>En camino</h3>
            <span className="summary-count">{orders.filter((o) => o.Status === "En camino").length}</span>
          </div>
          <div className="summary-card">
            <h3>Completadas</h3>
            <span className="summary-count">{orders.filter((o) => o.Status === "Completed").length}</span>
          </div>
          <div className="summary-card">
            <h3>Canceladas</h3>
            <span className="summary-count">{orders.filter((o) => o.Status === "Canceled").length}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-filters">
        <div className="filter-group">
          <label htmlFor="statusFilter">
            <Filter size={18} /> Filtrar por estado:
          </label>
          <select id="statusFilter" value={statusFilter} onChange={handleFilterChange} className="filter-select">
            <option value="All">Todos los estados</option>
            <option value="Pending">Pendientes</option>
            <option value="En camino">En camino</option>
            <option value="Completed">Completadas</option>
            <option value="Canceled">Canceladas</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="searchQuery">
            <Search size={18} /> Buscar:
          </label>
          <input
            id="searchQuery"
            type="text"
            placeholder="Cliente, dirección o # de orden"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="filter-select"
          />
        </div>
      </div>

      <div className="dashboard-content">{renderOrders()}</div>

      {showAssignModal && selectedOrderId && (
        <AssignDeliveryModal
          orderId={selectedOrderId}
          onClose={() => setShowAssignModal(false)}
          onAssigned={() => handleDeliveryAssigned()}
        />
      )}

      {showDetailsModal && selectedOrderId && (
        <OrderDetailsModal orderId={selectedOrderId} onClose={() => setShowDetailsModal(false)} />
      )}
    </div>
  )
}