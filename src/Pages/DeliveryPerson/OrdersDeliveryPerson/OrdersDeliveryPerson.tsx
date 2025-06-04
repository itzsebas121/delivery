"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../../context/Authcontext"
import {
  Package,
  MapPin,
  Phone,
  DollarSign,
  CheckCircle,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Route,
  Truck,
  Calendar,
  User,
} from "lucide-react"
import { useAlert } from "../../../components/Alerts/Alert-system"
import OrderDeliveryModal from "./OrderDeliveryModal"
import { baseURLRest } from "../../../config"
import "./OrderDelivery.css"

interface Order {
  OrderId: number
  OrderDate: string
  DeliveryAddressName?: string
  DeliveryAddress: string
  DeliveryCoordinates?: string
  StartCoordinates?: string
  ClientName: string
  ClientPhone?: string
  Status: "En camino" | "Completada" | "Cancelada"
  Total: number
  IsRouteStarted?: boolean
  CompletionDate?: string
}

export function OrdersDeliveryPerson() {
  const { user, loading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingp, setLoading] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<"En camino" | "Completada" | "Cancelada">("En camino")
  const deliveryId = user?.rol === "Delivery" && "deliveryId" in user ? (user as any).deliveryId : 0

  // Modal states
  const [showOrderModal, setShowOrderModal] = useState<boolean>(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // Pagination states for each status
  const [enCaminoPage, setEnCaminoPage] = useState<number>(1)
  const [completadaPage, setCompletadaPage] = useState<number>(1)
  const [canceladaPage, setCanceladaPage] = useState<number>(1)

  // Search states
  const [searchQuery, setSearchQuery] = useState<string>("")

  const ordersPerPage = 3

  const { showSuccess, showError, showConfirm } = useAlert()

  const fetchAllOrders = async () => {
    if (!deliveryId || loading) return

    setLoading(true)
    try {
      // Fetch only assigned orders (En camino)
      const pendingResponse = await fetch(`${baseURLRest}/delivery/${deliveryId}/pending-orders`)
      const pendingData = pendingResponse.ok ? await pendingResponse.json() : []

      // Fetch completed/cancelled orders
      const historyResponse = await fetch(`${baseURLRest}/delivery/${deliveryId}/completed-cancelled-orders`)
      const historyData = historyResponse.ok ? await historyResponse.json() : []

      // Combine all orders - only show assigned orders (En camino, Completada, Cancelada)
      const allOrders = [...pendingData, ...historyData].filter(
        (order) => order.Status === "En camino" || order.Status === "Completada" || order.Status === "Cancelada",
      )

      setOrders(allOrders)
    } catch (error) {
      console.error("Error fetching orders:", error)
      showError("Error", "No se pudieron cargar las órdenes")
    } finally {
      setLoading(false)
    }
  }

  // Fetch all orders
  useEffect(() => {
    if (deliveryId) {
      fetchAllOrders()
    }
  }, [deliveryId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin" />
      </div>
    )
  }

  const handleStartRoute = async (orderId: number, startLatitude: number, startLongitude: number) => {
    if (!deliveryId) return

    try {
      const response = await fetch(`${baseURLRest}/delivery/${deliveryId}/start-route/${orderId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startLatitude,
          startLongitude,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al iniciar la ruta")
      }

      showSuccess("Ruta iniciada", "La ruta ha sido iniciada exitosamente")

      // Update local state
      setOrders((prev) =>
        prev.map((order) =>
          order.OrderId === orderId
            ? { ...order, IsRouteStarted: true, StartCoordinates: `${startLatitude}, ${startLongitude}` }
            : order,
        ),
      )

      // Update selected order if it's the same
      if (selectedOrder?.OrderId === orderId) {
        setSelectedOrder((prev) =>
          prev
            ? {
              ...prev,
              IsRouteStarted: true,
              StartCoordinates: `${startLatitude}, ${startLongitude}`,
            }
            : null,
        )
      }
    } catch (error) {
      console.error("Error starting route:", error)
      showError("Error", "No se pudo iniciar la ruta")
    }
  }

  const handleCompleteOrder = async (orderId: number) => {
    showConfirm("Completar orden", "¿Estás seguro de que deseas marcar esta orden como completada?", async () => {
      try {
        const response = await fetch(`${baseURLRest}/complete-order/${orderId}`, {
          method: "PATCH",
        })

        if (!response.ok) {
          throw new Error("Error al completar la orden")
        }

        showSuccess("Orden completada", "La orden ha sido marcada como completada")

        // Update local state
        setOrders((prev) =>
          prev.map((order) =>
            order.OrderId === orderId
              ? { ...order, Status: "Completada", CompletionDate: new Date().toISOString() }
              : order,
          ),
        )

        // Close modal if it's the completed order
        if (selectedOrder?.OrderId === orderId) {
          setShowOrderModal(false)
          setSelectedOrder(null)
        }

        // Switch to completed tab to show the completed order
        setActiveTab("Completada")
      } catch (error) {
        console.error("Error completing order:", error)
        showError("Error", "No se pudo completar la orden")
      }
    })
  }

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setShowOrderModal(true)
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

  // Filter orders by status and search
  const getFilteredOrders = (status: string) => {
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
  const getPaginatedOrders = (status: string) => {
    const filteredOrders = getFilteredOrders(status)
    const currentPage = status === "En camino" ? enCaminoPage : status === "Completada" ? completadaPage : canceladaPage

    const startIndex = (currentPage - 1) * ordersPerPage
    const endIndex = startIndex + ordersPerPage
    return filteredOrders.slice(startIndex, endIndex)
  }

  // Get total pages for current tab
  const getTotalPages = (status: string) => {
    const filteredOrders = getFilteredOrders(status)
    return Math.ceil(filteredOrders.length / ordersPerPage)
  }

  // Get current page for status
  const getCurrentPage = (status: string) => {
    return status === "En camino" ? enCaminoPage : status === "Completada" ? completadaPage : canceladaPage
  }

  // Set current page for status
  const setCurrentPage = (status: string, page: number) => {
    if (status === "En camino") setEnCaminoPage(page)
    else if (status === "Completada") setCompletadaPage(page)
    else if (status === "Cancelada") setCanceladaPage(page)
  }

  // Get status icon and color
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "En camino":
        return { icon: Truck, color: "info", label: "En Camino" }
      case "Completada":
        return { icon: CheckCircle, color: "success", label: "Completadas" }
      case "Cancelada":
        return { icon: XCircle, color: "danger", label: "Canceladas" }
      default:
        return { icon: Package, color: "secondary", label: "Órdenes" }
    }
  }

  // Get order counts
  const getOrderCounts = () => {
    return {
      "En camino": getFilteredOrders("En camino").length,
      Completada: getFilteredOrders("Completada").length,
      Cancelada: getFilteredOrders("Cancelada").length,
    }
  }

  const orderCounts = getOrderCounts()

  if (loadingp) {
    return (
      <div className="delivery-orders-loading">
        <div className="loading-spinner">
          <Loader2 size={50} className="animate-spin" />
        </div>
        <h3>Cargando órdenes...</h3>
        <p>Obteniendo tus entregas asignadas</p>
      </div>
    )
  }

  return (
    <div className="delivery-orders-dashboard">
      {/* Professional Header */}
      <div className="delivery-header">
        <div className="header-content">
          <div className="header-title">
            <Package size={32} />
            <div>
              <h1>Panel de Entregas</h1>
              <p>Gestiona tus entregas de manera eficiente</p>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-card">
              <div className="stat-number">{orderCounts["En camino"]}</div>
              <div className="stat-label">En Camino</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{orderCounts.Completada}</div>
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
        {(["En camino", "Completada", "Cancelada"] as const).map((status) => {
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
                    <div className="order-info-grid">
                      <div className="info-item-dp customer-name">
                        <div className="info-icon ">
                          <User size={16} />
                          <span className="info-label">Cliente</span>
                        </div>
                        <div className="info-content">
                          <span className="info-value">{order.ClientName}</span>
                        </div>
                      </div>

                      {order.ClientPhone && (
                        <div className="info-item-dp customer-phone">
                          <div className="info-icon">
                            <Phone size={16} />
                            <span className="info-label">Teléfono</span>
                          </div>
                          <div className="info-content">
                            <span className="info-value">{order.ClientPhone}</span>
                          </div>
                        </div>
                      )}

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
                          <span className="info-value price">{formatCurrency(order.Total)}</span>
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

                      {order.IsRouteStarted && (
                        <div className="info-item-dp route-started order-status">
                          <div className="info-icon">
                            <Route size={16} />
                            <span className="info-label">Estado</span>
                          </div>
                          <div className="info-content">
                            <span className="info-value">Ruta iniciada</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="order-card-footer">
                    <button className="btn-view-details" onClick={() => handleViewOrderDetails(order)}>
                      <Eye size={16} />
                      Ver Detalles
                    </button>
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
                        {activeTab === "En camino"
                          ? "No tienes órdenes asignadas para entregar"
                          : activeTab === "Completada"
                            ? "Aún no has completado ninguna orden"
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
                <span className="btn-text">Anterior</span>
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
                <span className="btn-text">Siguiente</span>
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <OrderDeliveryModal
          order={selectedOrder}
          onClose={() => {
            setShowOrderModal(false)
            setSelectedOrder(null)
          }}
          onStartRoute={handleStartRoute}
          onCompleteOrder={handleCompleteOrder}
          deliveryId={deliveryId!}
        />
      )}
    </div>
  )
}
