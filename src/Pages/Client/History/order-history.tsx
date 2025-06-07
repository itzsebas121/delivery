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
  Trash,
} from "lucide-react"
import { baseURLRest } from "../../../config"
import OrderDetailsModal from "./order-detail-modal"
import "./order-history.css"
import { useAuth } from "../../../context/Authcontext"
import { useAlert } from "../../../components/Alerts/Alert-system"
interface Order {
  OrderId: number
  OrderDate: string
  Status: "Pending" | "Completada" | "Cancelada" | "En camino"
  DeliveryAddress: string
  total: number
}

type OrderStatus = "Pending" | "En camino" | "Completada" | "Cancelada"

const OrderHistory: React.FC<{ clientId?: number }> = () => {
  const {showConfirm, showError, showSuccess} = useAlert()
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingp, setLoadingp] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, loading } = useAuth()
  const clientId = user?.rol === "Client" && "clientId" in user ? (user as any).clientId : 1

  // Active tab state
  const [activeTab, setActiveTab] = useState<OrderStatus>("Pending")

  // Search state
  const [searchQuery, setSearchQuery] = useState("")

  // Pagination states for each status
  const [pendingPage, setPendingPage] = useState(1)
  const [enCaminoPage, setEnCaminoPage] = useState(1)
  const [completedPage, setCompletedPage] = useState(1)
  const [canceladaPage, setCanceladaPage] = useState(1)

  const ordersPerPage = 3

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
      const sortedData = data.sort((a, b) => new Date(b.OrderDate).getTime() - new Date(a.OrderDate).getTime())
      setOrders(sortedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoadingp(false)
    }
  }

  useEffect(() => {
    if (!loading) {
      fetchOrders()
    }
  }, [clientId])

  const getFilteredOrders = (status: OrderStatus) => {
    return orders
      .filter((order) => order.Status === status)
      .filter((order) => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return order.OrderId.toString().includes(query) || order.DeliveryAddress.toLowerCase().includes(query)
      })
  }

  // Get paginated orders for current tab
  const getPaginatedOrders = (status: OrderStatus) => {
    const filteredOrders = getFilteredOrders(status)
    const currentPage =
      status === "Pending"
        ? pendingPage
        : status === "En camino"
          ? enCaminoPage
          : status === "Completada"
            ? completedPage
            : canceladaPage

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
    return status === "Pending"
      ? pendingPage
      : status === "En camino"
        ? enCaminoPage
        : status === "Completada"
          ? completedPage
          : canceladaPage
  }

  // Set current page for status
  const setCurrentPage = (status: OrderStatus, page: number) => {
    if (status === "Pending") setPendingPage(page)
    else if (status === "En camino") setEnCaminoPage(page)
    else if (status === "Completada") setCompletedPage(page)
    else if (status === "Cancelada") setCanceladaPage(page)
  }

  // Get status configuration
  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case "Pending":
        return { icon: Clock, color: "warning", label: "Pendientes" }
      case "En camino":
        return { icon: Truck, color: "info", label: "En Camino" }
      case "Completada":
        return { icon: CheckCircle, color: "success", label: "Completados" }
      case "Cancelada":
        return { icon: XCircle, color: "danger", label: "Cancelados" }
      default:
        return { icon: Package, color: "secondary", label: "Pedidos" }
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

  const orderCounts = getOrderCounts()

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Open order details
  const openOrderDetails = (orderId: number) => {
    setSelectedOrderId(orderId)
    setShowModal(true)
  }

  if (loadingp) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <Loader2 size={50} className="animate-spin" />
        </div>
        <h3>Cargando historial...</h3>
        <p>Obteniendo tus pedidos</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="order-history-dashboard">
        <div className="empty-state">
          <XCircle size={64} />
          <h3>Error al cargar pedidos</h3>
          <p>{error}</p>
          <button onClick={fetchOrders} className="btn-view-details">
            <RotateCcw size={16} />
            <span>Reintentar</span>
          </button>
        </div>
      </div>
    )
  }

  function cancelOrder(OrderId: number): void {
    showConfirm("Cancelar orden", "¿Está seguro que desea cancelar esta orden?", async () => {
      try {
        const response = await fetch(`${baseURLRest}/cancel-order/${OrderId}`, {
          method: "PATCH",
        })
        if (!response.ok) throw new Error("Error al cancelar la orden")

        setOrders((prevOrders) =>
          prevOrders.map((order) => (order.OrderId === OrderId ? { ...order, Status: "Cancelada" } : order)),
        )
        showSuccess("Orden cancelada", "La orden ha sido cancelada exitosamente")
      } catch (err) {
        console.error("Error al cancelar la orden:", err)
        showError("Error", "No se pudo cancelar la orden. Por favor, intente nuevamente.")
      }
    })
  }

  return (
    <div className="order-history-dashboard">
      {/* Professional Header */}
      <div className="delivery-header">
        <div className="header-content">
          <div className="header-title">
            <ShoppingBag size={32} />
            <div>
              <h1>Historial de Pedidos</h1>
              <p>Revisa todos tus pedidos y su estado actual</p>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-card">
              <div className="stat-number">{orderCounts.Pending}</div>
              <div className="stat-label">Pendientes</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{orderCounts["En camino"]}</div>
              <div className="stat-label">En Camino</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{orderCounts.Completada}</div>
              <div className="stat-label">Completados</div>
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
            placeholder="Buscar por número de pedido o dirección..."
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
                    Pedidos {config.label}
                  </>
                )
              })()}
            </h2>
            <div className="section-info">
              {orderCounts[activeTab]} {orderCounts[activeTab] === 1 ? "pedido" : "pedidos"}
            </div>
          </div>

          {/* Orders Grid */}
          <div className="orders-grid">
            {getPaginatedOrders(activeTab).length > 0 ? (
              getPaginatedOrders(activeTab).map((order) => (
                <div key={order.OrderId} className={`order-card ${activeTab.toLowerCase().replace(" ", "-")}`}>
                  <div className="order-card-header">
                    <div className="order-number">
                      <Package size={18} />
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
                    <div className="order-info-grid-m">
                      <div className="info-item-dp order-date">
                        <div className="info-icon">
                          <Calendar size={16} />
                          <span className="info-label">Fecha</span>
                        </div>
                        <div className="info-content">
                          <span className="info-value">{formatDate(order.OrderDate)}</span>
                        </div>
                      </div>

                      <div className="info-item-dp order-total">
                        <div className="info-icon">
                          <DollarSign size={16} />
                          <span className="info-label">Total</span>
                        </div>
                        <div className="info-content">
                          <span className="info-value price">${order.total.toFixed(2)}</span>
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
                    </div>
                  </div>

                  <div className="order-card-footer">
                    <button className="btn-view-details" onClick={() => openOrderDetails(order.OrderId)}>
                      <Eye size={16} />
                      Ver Detalles
                    </button>
                    {activeTab === "Pending" && (
                      <button className="btn-cancel-order" onClick={() => cancelOrder(order.OrderId)}>
                        <Trash size={16} />
                        Cancelar Pedido
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
                      <h3>No hay pedidos {config.label.toLowerCase()}</h3>
                      <p>
                        {activeTab === "Pending"
                          ? "No tienes pedidos pendientes"
                          : activeTab === "En camino"
                            ? "No tienes pedidos en camino"
                            : activeTab === "Completada"
                              ? "Aún no has completado ningún pedido"
                              : "No hay pedidos cancelados"}
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
                {(() => {
                  const currentPage = getCurrentPage(activeTab)
                  const totalPages = getTotalPages(activeTab)
                  const pages = []

                  if (totalPages <= 3) {
                    // Si hay 3 páginas o menos, mostrar todas
                    for (let i = 1; i <= totalPages; i++) {
                      pages.push(i)
                    }
                  } else {
                    // Si hay más de 3 páginas, mostrar máximo 3 con el patrón solicitado
                    if (currentPage === 1) {
                      // Si estamos en la primera página: 1, 2, última
                      pages.push(1, 2, totalPages)
                    } else if (currentPage === totalPages) {
                      // Si estamos en la última página: 1, penúltima, última
                      pages.push(1, totalPages - 1, totalPages)
                    } else {
                      // Si estamos en el medio: 1, actual, última
                      pages.push(1, currentPage, totalPages)
                    }
                  }

                  // Eliminar duplicados y ordenar
                  const uniquePages = [...new Set(pages)].sort((a, b) => a - b)

                  return uniquePages.map((pageNum, _index) => (
                    <button
                      key={pageNum}
                      className={`page-btn ${pageNum === currentPage ? "active" : ""}`}
                      onClick={() => setCurrentPage(activeTab, pageNum)}
                    >
                      {pageNum}
                    </button>
                  ))
                })()}
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

      {/* Order Details Modal */}
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
