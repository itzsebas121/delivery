import { useState, useEffect } from "react"
import { baseURLRest } from "../../config"
import "./Styles/orders-distributor.css"
import AssignDeliveryModal from "./AssignDeliveryModal"
import OrderDetailsModal from "./order-details-modal"

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

  // Filtrar órdenes por estado seleccionado
  const filteredOrders = statusFilter === "All" 
    ? orders 
    : orders.filter(order => order.Status === statusFilter)

  // Filtrar órdenes por estado para las secciones
  const pendingOrders = orders.filter((order) => order.Status === "Pending")
  const inTransitOrders = orders.filter((order) => order.Status === "En camino")
  const completedOrders = orders.filter((order) => order.Status === "Completed")
  const canceledOrders = orders.filter((order) => order.Status === "Canceled")

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
  const handleDeliveryAssigned = (orderId: number) => {
    // Actualizar el estado local
    setOrders((prevOrders) =>
      prevOrders.map((order) => (order.OrderId === orderId ? { ...order, Status: "En camino" } : order)),
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

  // Renderizar una tarjeta de orden
  const renderOrderCard = (order: Order) => {
    return (
      <div className="order-card" key={order.OrderId}>
        <div className="order-card-header">
          <h3>Orden #{order.OrderId}</h3>
          <span className={`order-status order-status-${order.Status.toLowerCase().replace(" ", "-")}`}>
            {order.Status}
          </span>
        </div>

        <div className="order-card-body">
          <div className="order-info">
            <p>
              <strong>Cliente:</strong> {order.ClientName}
            </p>
            <p>
              <strong>Fecha:</strong> {new Date(order.OrderDate).toLocaleString()}
            </p>
            <p>
              <strong>Dirección:</strong> {order.DeliveryAddress}
            </p>
            <p>
              <strong>Total:</strong> ${order.DiscountedTotal.toFixed(2)}
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
          <h2 className="section-title">Órdenes {statusFilter}</h2>
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

    // Si no hay filtro, mostrar todas las secciones
    return (
      <>
        <div className="orders-section">
          <h2 className="section-title">Órdenes Pendientes</h2>
          <div className="orders-container">
            {pendingOrders.length > 0 ? (
              pendingOrders.map((order) => renderOrderCard(order))
            ) : (
              <div className="empty-orders">
                <p>No hay órdenes pendientes</p>
              </div>
            )}
          </div>
        </div>

        <div className="orders-section">
          <h2 className="section-title">Órdenes En Camino</h2>
          <div className="orders-container">
            {inTransitOrders.length > 0 ? (
              inTransitOrders.map((order) => renderOrderCard(order))
            ) : (
              <div className="empty-orders">
                <p>No hay órdenes en camino</p>
              </div>
            )}
          </div>
        </div>

        <div className="orders-section">
          <h2 className="section-title">Órdenes Completadas</h2>
          <div className="orders-container">
            {completedOrders.length > 0 ? (
              completedOrders.map((order) => renderOrderCard(order))
            ) : (
              <div className="empty-orders">
                <p>No hay órdenes completadas</p>
              </div>
            )}
          </div>
        </div>

        <div className="orders-section">
          <h2 className="section-title">Órdenes Canceladas</h2>
          <div className="orders-container">
            {canceledOrders.length > 0 ? (
              canceledOrders.map((order) => renderOrderCard(order))
            ) : (
              <div className="empty-orders">
                <p>No hay órdenes canceladas</p>
              </div>
            )}
          </div>
        </div>
      </>
    )
  }

  if (loading) {
    return (
      <div className="orders-loading">
        <div className="orders-loader"></div>
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
            <span className="summary-count">{pendingOrders.length}</span>
          </div>
          <div className="summary-card">
            <h3>En camino</h3>
            <span className="summary-count">{inTransitOrders.length}</span>
          </div>
          <div className="summary-card">
            <h3>Completadas</h3>
            <span className="summary-count">{completedOrders.length}</span>
          </div>
          <div className="summary-card">
            <h3>Canceladas</h3>
            <span className="summary-count">{canceledOrders.length}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-filters">
        <div className="filter-group">
          <label htmlFor="statusFilter">Filtrar por estado:</label>
          <select 
            id="statusFilter" 
            value={statusFilter} 
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="All">Todos los estados</option>
            <option value="Pending">Pendientes</option>
            <option value="En camino">En camino</option>
            <option value="Completed">Completadas</option>
            <option value="Canceled">Canceladas</option>
          </select>
        </div>
      </div>

      <div className="dashboard-content">
        {renderOrders()}
      </div>

      {showAssignModal && selectedOrderId && (
        <AssignDeliveryModal
          orderId={selectedOrderId}
          onClose={() => setShowAssignModal(false)}
          onAssigned={() => handleDeliveryAssigned(selectedOrderId)}
        />
      )}

      {showDetailsModal && selectedOrderId && (
        <OrderDetailsModal
          orderId={selectedOrderId}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  )
}
