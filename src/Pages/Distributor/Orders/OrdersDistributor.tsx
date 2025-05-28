import type React from "react"
import { useState, useEffect } from "react"
import { baseURLRest } from "../../../config"
import AssignDeliveryModal from "./AssignDeliveryModal"
import OrderDetailsModal from "./order-details-modal"
import { MoveLeftIcon, MoveRightIcon } from "lucide-react"
import "./Orders.css"
import {
  ShoppingBag,
  Truck,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  User,
  DollarSign,
  Filter,
  Search,
  Loader2,
} from "lucide-react"
import { useAlert } from "../../../components/Alerts/Alert-system"

// Definir interfaces para los tipos de datos
interface Order {
  OrderId: number
  OrderDate: string
  Status: "Pending" | "En camino" | "Completed" | "Cancelada"
  DeliveryAddress: string
  Total: number
  DiscountedTotal: number
  ClientId: number
  ClientName: string
  ClientEmail: string
  DiscountCode: string | null
  DiscountPercentage: number | null
}

type OrderStatus = "All" | "Pending" | "En camino" | "Completed" | "Cancelada"

export default function OrdersDistributor() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false)
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<OrderStatus>("All")
  const [searchQuery, setSearchQuery] = useState<string>("")

  const { showSuccess, showError, showConfirm } = useAlert()

  // Agregar estados para la paginación de cada sección
  const [pendingPage, setPendingPage] = useState<number>(1)
  const [inTransitPage, setInTransitPage] = useState<number>(1)
  const [completedPage, setCompletedPage] = useState<number>(1)
  const [canceledPage, setCanceledPage] = useState<number>(1)
  const ordersPerPage = 6

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
        setError(null)
      } catch (err) {
        setError("Error al cargar las órdenes. Por favor, intente nuevamente.")
        showError("Error", "Error al cargar las órdenes. Por favor, intente nuevamente.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

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

  // Filtrar órdenes por estado para las secciones
  const pendingOrders = filteredOrders.filter((order) => order.Status === "Pending")
  const inTransitOrders = filteredOrders.filter((order) => order.Status === "En camino")
  const completedOrders = filteredOrders.filter((order) => order.Status === "Completed")
  const canceledOrders = filteredOrders.filter((order) => order.Status === "Cancelada")

  // Manejar la cancelación de una orden
  const handleCancelOrder = async (orderId: number) => {
    showConfirm("Cancelar orden", "¿Está seguro que desea cancelar esta orden?", async () => {
      try {
        const response = await fetch(`${baseURLRest}/cancel-order/${orderId}`, {
          method: "PATCH",
        })

        if (!response.ok) {
          throw new Error("Error al cancelar la orden")
        }

        // Actualizar el estado local
        setOrders((prevOrders) =>
          prevOrders.map((order) => (order.OrderId === orderId ? { ...order, Status: "Cancelada" } : order)),
        )

        showSuccess("Orden cancelada", "La orden ha sido cancelada exitosamente")
      } catch (err) {
        console.error("Error al cancelar la orden:", err)
        showError("Error", "No se pudo cancelar la orden. Por favor, intente nuevamente.")
      }
    })
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
        case "Cancelada":
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
          {order.Status === "En camino" && (

            <button className="order-btn order-btn-cancel" onClick={() => handleCancelOrder(order.OrderId)}>
              Cancelar orden
            </button>
          )}
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

  // Modificar las secciones de filtrado para incluir paginación
  const paginateOrders = (orders: Order[], page: number) => {
    const startIndex = (page - 1) * ordersPerPage
    const endIndex = startIndex + ordersPerPage
    return orders.slice(startIndex, endIndex)
  }

  // Modificar la función renderOrders para incluir paginación en cada sección
  const renderOrders = () => {
    if (statusFilter !== "All") {
      const currentPage =
        statusFilter === "Pending"
          ? pendingPage
          : statusFilter === "En camino"
            ? inTransitPage
            : statusFilter === "Completed"
              ? completedPage
              : canceledPage

      const setPage =
        statusFilter === "Pending"
          ? setPendingPage
          : statusFilter === "En camino"
            ? setInTransitPage
            : statusFilter === "Completed"
              ? setCompletedPage
              : setCanceledPage

      const paginatedOrders = paginateOrders(filteredOrders, currentPage)
      const totalPages = Math.ceil(filteredOrders.length / ordersPerPage)

      return (
        <div className="orders-section">
          <h2 className="section-title">
            {statusFilter === "Pending" && <ShoppingBag size={22} />}
            {statusFilter === "En camino" && <Truck size={22} />}
            {statusFilter === "Completed" && <CheckCircle size={22} />}
            {statusFilter === "Cancelada" && <XCircle size={22} />}
            Órdenes {statusFilter}
          </h2>
          <div className="orders-container">
            {filteredOrders.length > 0 ? (
              paginatedOrders.map((order) => renderOrderCard(order))
            ) : (
              <div className="empty-orders">
                <p>No hay órdenes con el estado {statusFilter}</p>
              </div>
            )}
          </div>

          {filteredOrders.length > 0 && (
            <div className="pagination-section">
              <button
                className="pagination-btn nav-btn"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <MoveLeftIcon size={22} />
              </button>
              <div className="page-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`page-btn ${pageNum === currentPage ? "active" : ""}`}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
              <button
                className="pagination-btn nav-btn"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <MoveRightIcon />
              </button>
            </div>
          )}
        </div>
      )
    }

    // Si no hay filtro, mostrar todas las secciones con paginación
    return (
      <>
        <div className="orders-section">
          <h2 className="section-title">
            <ShoppingBag size={22} /> Órdenes Pendientes
          </h2>
          <div className="orders-container">
            {pendingOrders.length > 0 ? (
              paginateOrders(pendingOrders, pendingPage).map((order) => renderOrderCard(order))
            ) : (
              <div className="empty-orders">
                <p>No hay órdenes pendientes</p>
              </div>
            )}
          </div>
          {pendingOrders.length > 0 && (
            <div className="pagination-section">
              <button
                className="pagination-btn nav-btn"
                onClick={() => setPendingPage(pendingPage - 1)}
                disabled={pendingPage === 1}
              >
                <MoveLeftIcon size={22} />
              </button>
              <div className="page-numbers">
                {Array.from({ length: Math.ceil(pendingOrders.length / ordersPerPage) }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <button
                      key={pageNum}
                      className={`page-btn ${pageNum === pendingPage ? "active" : ""}`}
                      onClick={() => setPendingPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  ),
                )}
              </div>
              <button
                className="pagination-btn nav-btn"
                onClick={() => setPendingPage(pendingPage + 1)}
                disabled={pendingPage === Math.ceil(pendingOrders.length / ordersPerPage)}
              >
                <MoveRightIcon />
              </button>
            </div>
          )}
        </div>

        <div className="orders-section">
          <h2 className="section-title">
            <Truck size={22} /> Órdenes En Camino
          </h2>
          <div className="orders-container">
            {inTransitOrders.length > 0 ? (
              paginateOrders(inTransitOrders, inTransitPage).map((order) => renderOrderCard(order))
            ) : (
              <div className="empty-orders">
                <p>No hay órdenes en camino</p>
              </div>
            )}
          </div>
          {inTransitOrders.length > 0 && (
            <div className="pagination-section">
              <button
                className="pagination-btn nav-btn"
                onClick={() => setInTransitPage(inTransitPage - 1)}
                disabled={inTransitPage === 1}
              >
                <MoveLeftIcon size={22} />
              </button>
              <div className="page-numbers">
                {Array.from({ length: Math.ceil(inTransitOrders.length / ordersPerPage) }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <button
                      key={pageNum}
                      className={`page-btn ${pageNum === inTransitPage ? "active" : ""}`}
                      onClick={() => setInTransitPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  ),
                )}
              </div>
              <button
                className="pagination-btn nav-btn"
                onClick={() => setInTransitPage(inTransitPage + 1)}
                disabled={inTransitPage === Math.ceil(inTransitOrders.length / ordersPerPage)}
              >
                <MoveRightIcon />
              </button>
            </div>
          )}
        </div>

        <div className="orders-section">
          <h2 className="section-title">
            <CheckCircle size={22} /> Órdenes Completadas
          </h2>
          <div className="orders-container">
            {completedOrders.length > 0 ? (
              paginateOrders(completedOrders, completedPage).map((order) => renderOrderCard(order))
            ) : (
              <div className="empty-orders">
                <p>No hay órdenes completadas</p>
              </div>
            )}
          </div>
          {completedOrders.length > 0 && (
            <div className="pagination-section">
              <button
                className="pagination-btn nav-btn"
                onClick={() => setCompletedPage(completedPage - 1)}
                disabled={completedPage === 1}
              >
                <MoveLeftIcon size={22} />
              </button>
              <div className="page-numbers">
                {Array.from({ length: Math.ceil(completedOrders.length / ordersPerPage) }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <button
                      key={pageNum}
                      className={`page-btn ${pageNum === completedPage ? "active" : ""}`}
                      onClick={() => setCompletedPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  ),
                )}
              </div>
              <button
                className="pagination-btn nav-btn"
                onClick={() => setCompletedPage(completedPage + 1)}
                disabled={completedPage === Math.ceil(completedOrders.length / ordersPerPage)}
              >
                <MoveRightIcon />
              </button>
            </div>
          )}
        </div>

        <div className="orders-section">
          <h2 className="section-title">
            <XCircle size={22} /> Órdenes Canceladas
          </h2>
          <div className="orders-container">
            {canceledOrders.length > 0 ? (
              paginateOrders(canceledOrders, canceledPage).map((order) => renderOrderCard(order))
            ) : (
              <div className="empty-orders">
                <p>No hay órdenes canceladas</p>
              </div>
            )}
          </div>
          {canceledOrders.length > 0 && (
            <div className="pagination-section">
              <button
                className="pagination-btn nav-btn"
                onClick={() => setCanceledPage(canceledPage - 1)}
                disabled={canceledPage === 1}
              >
                <MoveLeftIcon size={22} />
              </button>
              <div className="page-numbers">
                {Array.from({ length: Math.ceil(canceledOrders.length / ordersPerPage) }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <button
                      key={pageNum}
                      className={`page-btn ${pageNum === canceledPage ? "active" : ""}`}
                      onClick={() => setCanceledPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  ),
                )}
              </div>
              <button
                className="pagination-btn nav-btn"
                onClick={() => setCanceledPage(canceledPage + 1)}
                disabled={canceledPage === Math.ceil(canceledOrders.length / ordersPerPage)}
              >
                <MoveRightIcon />
              </button>
            </div>
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
            <span className="summary-count">{orders.filter((o) => o.Status === "Cancelada").length}</span>
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
