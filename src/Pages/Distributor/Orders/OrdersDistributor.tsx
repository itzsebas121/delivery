"use client"
import { useState, useEffect } from "react"
import { baseURLRest } from "../../../config"
import AssignDeliveryModal from "./AssignDeliveryModal"
import OrderDetailsModal from "./order-details-modal"
import {
  ShoppingBag,
  Truck,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  User,
  DollarSign,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react"
import { useAlert } from "../../../components/Alerts/Alert-system"
import "./Orders.css"

interface Order {
  OrderId: number
  OrderDate: string
  Status: "Pending" | "En camino" | "Completada" | "Cancelada"
  DeliveryAddress: string
  Total: number
  DiscountedTotal: number
  ClientId: number
  ClientName: string
  ClientEmail: string
  DiscountCode: string | null
  DiscountPercentage: number | null
}

type OrderStatus = "Pending" | "En camino" | "Completada" | "Cancelada"

export default function OrdersDistributor() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<OrderStatus>("Pending")
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false)
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Pagination states for each status
  const [pendingPage, setPendingPage] = useState<number>(1)
  const [inTransitPage, setInTransitPage] = useState<number>(1)
  const [completedPage, setCompletedPage] = useState<number>(1)
  const [canceledPage, setCanceledPage] = useState<number>(1)

  const ordersPerPage = 6
  const { showSuccess, showError, showConfirm } = useAlert()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${baseURLRest}/sales`)
      if (!response.ok) throw new Error("Error al obtener las órdenes")

      const data = await response.json()
      setOrders(data)
    } catch (err) {
      showError("Error", "Error al cargar las órdenes. Por favor, intente nuevamente.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Filter orders by status and search
  const getFilteredOrders = (status: OrderStatus) => {
    return orders
      .filter((order) => order.Status === status)
      .filter((order) => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return (
          order.ClientName.toLowerCase().includes(query) ||
          order.DeliveryAddress.toLowerCase().includes(query) ||
          order.OrderId.toString().includes(query)
        )
      })
  }

  // Get paginated orders for current tab
  const getPaginatedOrders = (status: OrderStatus) => {
    const filteredOrders = getFilteredOrders(status)
    const currentPage = getCurrentPage(status)
    const startIndex = (currentPage - 1) * ordersPerPage
    const endIndex = startIndex + ordersPerPage
    return filteredOrders.slice(startIndex, endIndex)
  }

  // Get total pages for current tab
  const getTotalPages = (status: OrderStatus) => {
    const filteredOrders = getFilteredOrders(status)
    return Math.ceil(filteredOrders.length / ordersPerPage)
  }

  // Get current page for status
  const getCurrentPage = (status: OrderStatus) => {
    switch (status) {
      case "Pending":
        return pendingPage
      case "En camino":
        return inTransitPage
      case "Completada":
        return completedPage
      case "Cancelada":
        return canceledPage
      default:
        return 1
    }
  }

  // Set current page for status
  const setCurrentPage = (status: OrderStatus, page: number) => {
    switch (status) {
      case "Pending":
        setPendingPage(page)
        break
      case "En camino":
        setInTransitPage(page)
        break
      case "Completada":
        setCompletedPage(page)
        break
      case "Cancelada":
        setCanceledPage(page)
        break
    }
  }

  // Get status configuration
  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case "Pending":
        return { icon: ShoppingBag, color: "warning", label: "Pendientes" }
      case "En camino":
        return { icon: Truck, color: "info", label: "En Camino" }
      case "Completada":
        return { icon: CheckCircle, color: "success", label: "Completadas" }
      case "Cancelada":
        return { icon: XCircle, color: "danger", label: "Canceladas" }
    }
  }

  // Get order counts
  const getOrderCounts = () => {
    return {
      Pending: getFilteredOrders("Pending").length,
      "En camino": getFilteredOrders("En camino").length,
      Completada: getFilteredOrders("Completada").length,
      Cancelada: getFilteredOrders("Cancelada").length,
    }
  }

  const handleCancelOrder = async (orderId: number) => {
    showConfirm("Cancelar orden", "¿Está seguro que desea cancelar esta orden?", async () => {
      try {
        const response = await fetch(`${baseURLRest}/cancel-order/${orderId}`, {
          method: "PATCH",
        })
        if (!response.ok) throw new Error("Error al cancelar la orden")

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

  const handleAssignDelivery = (orderId: number) => {
    setSelectedOrderId(orderId)
    setShowAssignModal(true)
  }

  const handleDeliveryAssigned = () => {
    if (!selectedOrderId) return
    setOrders((prevOrders) =>
      prevOrders.map((order) => (order.OrderId === selectedOrderId ? { ...order, Status: "En camino" } : order)),
    )
    setShowAssignModal(false)
  }

  const handleViewDetails = (orderId: number) => {
    setSelectedOrderId(orderId)
    setShowDetailsModal(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`
  }

  const orderCounts = getOrderCounts()

  if (loading) {
    return (
      <div className="delivery-orders-loading">
        <div className="loading-spinner">
          <Loader2 size={50} className="animate-spin" />
        </div>
        <h3>Cargando órdenes...</h3>
        <p>Obteniendo las órdenes del sistema</p>
      </div>
    )
  }

  return (
    <div className="delivery-orders-dashboard">
      {/* Professional Header */}
      <div className="delivery-header">
        <div className="header-content">
          <div className="header-title">
            <ShoppingBag size={32} />
            <div>
              <h1>Dashboard de Órdenes</h1>
              <p>Gestiona todas las órdenes del sistema</p>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-card">
              <div className="stat-number">{orderCounts["Pending"]}</div>
              <div className="stat-label">Pendientes</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{orderCounts["En camino"]}</div>
              <div className="stat-label">En Camino</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{orderCounts["Completada"]}</div>
              <div className="stat-label">Completadas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-container">
          <Search size={20} />
          <input
            type="text"
            placeholder="Buscar por cliente, dirección o número de orden..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="status-tabs">
        {(["Pending", "En camino", "Completada", "Cancelada"] as const).map((status) => {
          const config = getStatusConfig(status)
          const Icon = config.icon
          const count = orderCounts[status]
          const isActive = activeTab === status

          return (
            <button
              key={status}
              className={`status-tab ${config.color} ${isActive ? "active" : ""}`}
              onClick={() => setActiveTab(status)}
            >
              <Icon size={20} />
              <span className="tab-label">{config.label}</span>
              <span className="tab-count">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Orders Content */}
      <div className="orders-content">
        <div className="orders-section">
          <div className="section-header">
            <h2>
              {(() => {
                const config = getStatusConfig(activeTab)
                const Icon = config.icon
                return (
                  <>
                    <Icon size={24} />
                    Órdenes {config.label}
                  </>
                )
              })()}
            </h2>
            <div className="section-info">
              {orderCounts[activeTab]} {orderCounts[activeTab] === 1 ? "orden" : "órdenes"}
            </div>
          </div>

          {/* Orders Grid */}
          <div className="orders-grid">
            {getPaginatedOrders(activeTab).length > 0 ? (
              getPaginatedOrders(activeTab).map((order) => (
                <div key={order.OrderId} className={`order-card ${activeTab.toLowerCase().replace(" ", "-")}`}>
                  <div className="order-card-header">
                    <div className="order-number">
                      <ShoppingBag size={18} />
                      <span>#{order.OrderId}</span>
                    </div>
                    <div className={`order-status ${activeTab.toLowerCase().replace(" ", "-")}`}>
                      {(() => {
                        const config = getStatusConfig(activeTab)
                        const Icon = config.icon
                        return (
                          <>
                            <Icon size={16} />
                            {config.label}
                          </>
                        )
                      })()}
                    </div>
                  </div>

                  <div className="order-card-body">
                    <div className="order-info-grid">
                      <div className="info-item-dp customer-name">
                        <div className="info-icon">
                          <User size={16} />
                          <span className="info-label">Cliente</span>
                        </div>
                        <div className="info-content">
                          <span className="info-value">{order.ClientName}</span>
                        </div>
                      </div>

                      <div className="info-item-dp order-date">
                        <div className="info-icon">
                          <Calendar size={16} />
                          <span className="info-label">Fecha</span>
                        </div>
                        <div className="info-content">
                          <span className="info-value">{formatDate(order.OrderDate)}</span>
                        </div>
                      </div>

                      <div className="info-item-dp delivery-address">
                        <div className="info-icon">
                          <MapPin size={16} />
                          <span className="info-label">Dirección</span>
                        </div>
                        <div className="info-content">
                          <span className="info-value">{order.DeliveryAddress}</span>
                        </div>
                      </div>

                      <div className="info-item-dp order-total">
                        <div className="info-icon">
                          <DollarSign size={16} />
                          <span className="info-label">Total</span>
                        </div>
                        <div className="info-content">
                          <span className="info-value price">{formatCurrency(order.DiscountedTotal)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="order-card-footer">
                    <button className="btn-view-details" onClick={() => handleViewDetails(order.OrderId)}>
                      <Eye size={16} />
                      Ver Detalles
                    </button>
                    {order.Status === "Pending" && (
                      <button className="btn-assign-delivery" onClick={() => handleAssignDelivery(order.OrderId)}>
                        <Truck size={16} />
                        Asignar Repartidor
                      </button>
                    )}
                    {(order.Status === "Pending" || order.Status === "En camino") && (
                      <button className="btn-cancel-order" onClick={() => handleCancelOrder(order.OrderId)}>
                        <XCircle size={16} />
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                {(() => {
                  const config = getStatusConfig(activeTab)
                  const Icon = config.icon
                  return (
                    <>
                      <Icon size={64} />
                      <h3>No hay órdenes {config.label.toLowerCase()}</h3>
                      <p>
                        {activeTab === "Pending"
                          ? "No hay órdenes pendientes por procesar"
                          : activeTab === "En camino"
                            ? "No hay órdenes en camino actualmente"
                            : activeTab === "Completada"
                              ? "Aún no se han completado órdenes"
                              : "No hay órdenes canceladas"}
                      </p>
                    </>
                  )
                })()}
              </div>
            )}
          </div>

          {/* Pagination */}
          {getTotalPages(activeTab) > 1 && (
            <div className="pagination-section">
              <button
                className="pagination-btn nav-btn"
                onClick={() => setCurrentPage(activeTab, getCurrentPage(activeTab) - 1)}
                disabled={getCurrentPage(activeTab) === 1}
              >
                <ChevronLeft size={18} />
              </button>

              <div className="page-numbers">
                {Array.from({ length: getTotalPages(activeTab) }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`page-btn ${pageNum === getCurrentPage(activeTab) ? "active" : ""}`}
                    onClick={() => setCurrentPage(activeTab, pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                className="pagination-btn nav-btn"
                onClick={() => setCurrentPage(activeTab, getCurrentPage(activeTab) + 1)}
                disabled={getCurrentPage(activeTab) === getTotalPages(activeTab)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
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
