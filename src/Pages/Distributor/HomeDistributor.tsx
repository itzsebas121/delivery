"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  Users,
  Package,
  DollarSign,
  ShoppingCart,
  User,
  Truck,
  Filter,
  X,
  RefreshCw,
  Info,
  BarChart3,
  Award,
  Star,
  Search,
  MousePointer,
  TrendingUp,
  Calendar,
} from "lucide-react"
import { useAuth } from "../../context/Authcontext"
import { baseURLRest } from "../../config"
import "./../../StylesGeneral/style.css"
import "./admin-dashboard.css"

interface DashboardData {
  summary: {
    TotalOrders: number
    TotalClients: number
    TotalDistributors: number
    TotalRevenue: number
  }
  topProducts: Array<{
    ProductId: number
    ProductName: string
    TotalSold: number
    TotalRevenue: number
  }>
  topDeliveries: Array<{
    UserId: number
    DistributorName: string
    CompletedDeliveries: number
  }>
  topClients: Array<{
    UserId: number
    ClientName: string
    TotalSpent: number
  }>
  revenueByDay: Array<{
    OrderDay: string
    OrdersCount: number
    Revenue: number
  }>
}

interface TooltipState {
  visible: boolean
  x: number
  y: number
  content: {
    title: string
    value: string
    date: string
  }
}

export default function HomeDistributor() {
  const { user, loading } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [clientId, setClientId] = useState("")
  const [deliveryId, setDeliveryId] = useState("")
  const [clientSearch, setClientSearch] = useState("")
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
  const [selectedDistributorId, setSelectedDistributorId] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [activeView, setActiveView] = useState<"orders" | "revenue">("orders")
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null)
  const [chartTooltip, setChartTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: { title: "", value: "", date: "" },
  })

  const chartRef = useRef<HTMLDivElement>(null)
  const token = localStorage.getItem("token") || ""

  const fetchDashboardData = async (
    filters: {
      startDate?: string
      endDate?: string
      clientName?: string
      deliveryId?: string
    } = {},
  ) => {
    setDataLoading(true)
    setError("")

    try {
      const response = await fetch(`${baseURLRest}/dashboardAdmin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          startDate: filters.startDate || null,
          endDate: filters.endDate || null,
          clientName: filters.clientName || null,
          deliveryId: filters.deliveryId ? Number.parseInt(filters.deliveryId) : null,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al obtener los datos")
      }

      const data = await response.json()

      // Transformar los datos según la estructura esperada
      const transformedData: DashboardData = {
        summary: data.data.summary || {
          TotalOrders: 0,
          TotalClients: 0,
          TotalDistributors: 0,
          TotalRevenue: 0,
        },
        topProducts: data.data.topProducts || [],
        topDeliveries: data.data.topDeliveries || [],
        topClients: data.data.topClients || [],
        revenueByDay: data.data.revenueByDay || [],
      }

      setDashboardData(transformedData)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setError("Error al cargar los datos del dashboard")
    } finally {
      setDataLoading(false)
    }
  }

  const refreshData = () => {
    setRefreshing(true)
    fetchDashboardData({
      startDate,
      endDate,
      clientName: clientSearch,
      deliveryId: selectedDistributorId?.toString() || deliveryId,
    }).then(() => {
      setTimeout(() => setRefreshing(false), 500)
    })
  }

  useEffect(() => {
    if (!loading) {
      fetchDashboardData()
    }
  }, [loading])

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchDashboardData({
      startDate,
      endDate,
      clientName: clientSearch,
      deliveryId: selectedDistributorId?.toString() || deliveryId,
    })
  }

  const handleClientClick = (client: { UserId: number; ClientName: string; TotalSpent: number }) => {
    setSelectedClientId(client.UserId)
    setClientSearch(client.ClientName)

    // Auto-aplicar el filtro usando el nombre del cliente
    fetchDashboardData({
      startDate,
      endDate,
      clientName: client.ClientName, // Cambiar a clientName
      deliveryId: selectedDistributorId?.toString() || deliveryId,
    })
  }

  const handleDistributorClick = (distributor: {
    UserId: number
    DistributorName: string
    CompletedDeliveries: number
  }) => {
    setSelectedDistributorId(distributor.UserId)
    setDeliveryId(distributor.UserId.toString())

    // Auto-aplicar el filtro
    fetchDashboardData({
      startDate,
      endDate,
      clientName: clientSearch,
      deliveryId: distributor.UserId.toString(),
    })
  }

  const clearFilters = () => {
    setStartDate("")
    setEndDate("")
    setClientId("")
    setDeliveryId("")
    setClientSearch("")
    setSelectedClientId(null)
    setSelectedDistributorId(null)
    fetchDashboardData()
  }

  const clearClientFilter = () => {
    setClientId("")
    setClientSearch("")
    setSelectedClientId(null)
    fetchDashboardData({
      startDate,
      endDate,
      deliveryId: selectedDistributorId?.toString() || deliveryId,
    })
  }

  const clearDistributorFilter = () => {
    setDeliveryId("")
    setSelectedDistributorId(null)
    fetchDashboardData({
      startDate,
      endDate,
      clientName: clientSearch,
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string, format: "short" | "long" = "long") => {
    if (format === "short") {
      return new Date(dateString).toLocaleDateString("es-EC", {
        month: "short",
        day: "numeric",
      })
    }
    return new Date(dateString).toLocaleDateString("es-EC", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getFilterDateRange = () => {
    if (startDate && endDate) {
      return `${new Date(startDate).toLocaleDateString("es-EC")} - ${new Date(endDate).toLocaleDateString("es-EC")}`
    } else if (startDate) {
      return `Desde ${new Date(startDate).toLocaleDateString("es-EC")}`
    } else if (endDate) {
      return `Hasta ${new Date(endDate).toLocaleDateString("es-EC")}`
    }
    return "Todos los datos"
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (startDate) count++
    if (endDate) count++
    if (selectedClientId || clientId) count++
    if (selectedDistributorId || deliveryId) count++
    return count
  }

  const prepareChartData = () => {
    if (!dashboardData?.revenueByDay) return []

    return dashboardData.revenueByDay
      .map((item) => ({
        date: formatDate(item.OrderDay, "short"),
        orders: item.OrdersCount,
        revenue: item.Revenue,
        fullDate: item.OrderDay,
      }))
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
  }

  const chartData = prepareChartData()
  const maxOrders = Math.max(...chartData.map((d) => d.orders), 1)
  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 1)

  const handleChartMouseEnter = (data: any, index: number, event: React.MouseEvent) => {
    if (!chartRef.current) return

    const rect = chartRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    setChartTooltip({
      visible: true,
      x,
      y,
      content: {
        title: activeView === "orders" ? "Órdenes" : "Ingresos",
        value: activeView === "orders" ? data.orders.toString() : formatCurrency(data.revenue),
        date: data.date,
      },
    })
  }

  const handleChartMouseLeave = () => {
    setChartTooltip((prev) => ({ ...prev, visible: false }))
  }

  const filteredClients =
    dashboardData?.topClients.filter((client) =>
      client.ClientName.toLowerCase().includes(clientSearch.toLowerCase()),
    ) || []

  if (loading) {
    return (
      <div className="ad_dashboard_container">
        <div className="ad_loading_spinner">
          <div className="ad_spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  if (dataLoading) {
    return (
      <div className="ad_dashboard_container">
        <div className="ad_loading_spinner">
          <div className="ad_spinner"></div>
          <p>Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="ad_dashboard_container">
        <div className="ad_error_message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => fetchDashboardData()} className="ad_btn_retry">
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="ad_dashboard_container">
      {/* Header */}
      <header className="ad_dashboard_header">
        <h1 className="ad_dashboard_title">Dashboard Administrativo</h1>
        <p className="ad_dashboard_subtitle">Bienvenido, {user?.nombre || "Administrador"}</p>
      </header>

      {/* Stats Cards */}
      <section className="ad_stats_section">
        <div className="ad_stats_grid">
          <div className="ad_stat_card ad_stat_card_1">
            <div className="ad_stat_icon_wrapper">
              <ShoppingCart className="ad_stat_icon" />
            </div>
            <div className="ad_stat_content">
              <p className="ad_stat_number">{dashboardData?.summary.TotalOrders || 0}</p>
              <span className="ad_stat_label">Total Órdenes</span>
            </div>
          </div>

          <div className="ad_stat_card ad_stat_card_2">
            <div className="ad_stat_icon_wrapper">
              <Users className="ad_stat_icon" />
            </div>
            <div className="ad_stat_content">
              <p className="ad_stat_number">{dashboardData?.summary.TotalClients || 0}</p>
              <span className="ad_stat_label">Clientes</span>
            </div>
          </div>

          <div className="ad_stat_card ad_stat_card_3">
            <div className="ad_stat_icon_wrapper">
              <Truck className="ad_stat_icon" />
            </div>
            <div className="ad_stat_content">
              <p className="ad_stat_number">{dashboardData?.summary.TotalDistributors || 0}</p>
              <span className="ad_stat_label">Distribuidores</span>
            </div>
          </div>

          <div className="ad_stat_card ad_stat_card_4">
            <div className="ad_stat_icon_wrapper">
              <DollarSign className="ad_stat_icon" />
            </div>
            <div className="ad_stat_content">
              <p className="ad_stat_number">{formatCurrency(dashboardData?.summary.TotalRevenue || 0)}</p>
              <span className="ad_stat_label">Ingresos Totales</span>
            </div>
          </div>
        </div>
      </section>

      {/* Top Clients Section - Moved to top */}
      <section className="ad_top_clients_section">
        <div className="ad_card">
          <div className="ad_clients_header">
            <h3 className="ad_card_title">
              <Star className="ad_icon" />
              Clientes Top - Haz click para filtrar
              <MousePointer className="ad_click_hint" size={16} />
            </h3>
            <div className="ad_client_search_wrapper">
              <Search className="ad_search_icon" size={16} />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="ad_client_search"
              />
              {(selectedClientId || clientId) && (
                <button onClick={clearClientFilter} className="ad_clear_client_btn">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="ad_clients_grid">
            {filteredClients.slice(0, 5).map((client, index) => (
              <div
                key={client.UserId}
                className={`ad_client_banner ${selectedClientId === client.UserId ? "ad_selected" : ""}`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => handleClientClick(client)}
              >
                <div className="ad_client_rank">#{index + 1}</div>
                <div className="ad_client_avatar">
                  <User size={20} />
                </div>
                <div className="ad_client_info">
                  <h4 className="ad_client_name">{client.ClientName}</h4>
                  <div className="ad_client_spent">
                    <DollarSign size={14} />
                    {formatCurrency(client.TotalSpent)}
                  </div>
                  <div className="ad_client_id">ID: {client.UserId}</div>
                </div>
                <div className="ad_click_indicator">
                  <MousePointer size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filtros */}
      <section className="ad_filters_section">
        <div className="ad_card">
          <div className="ad_filters_header">
            <h3 className="ad_card_title">
              <Filter className="ad_icon" />
              Filtros Avanzados
              {getActiveFiltersCount() > 0 && <span className="ad_filters_badge">{getActiveFiltersCount()}</span>}
            </h3>
            <div className="ad_quick_actions">
              <button onClick={refreshData} className={`ad_btn_refresh ${refreshing ? "ad_refreshing" : ""}`}>
                <RefreshCw size={14} />
                Actualizar
              </button>
            </div>
          </div>

          <form onSubmit={handleFilterSubmit} className="ad_filters_form">
            <div className="ad_form_row">
              <div className="ad_form_group">
                <label htmlFor="startDate">
                  <Calendar size={14} />
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="ad_form_input"
                />
              </div>
              <div className="ad_form_group">
                <label htmlFor="endDate">
                  <Calendar size={14} />
                  Fecha Fin
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="ad_form_input"
                />
              </div>
            </div>
            <div className="ad_form_row">
              <div className="ad_form_group">
                <label htmlFor="clientName">
                  <User size={14} />
                  Nombre Cliente
                  {selectedClientId && <span className="ad_selected_indicator">Seleccionado</span>}
                </label>
                <input
                  type="text"
                  id="clientName"
                  value={clientSearch}
                  onChange={(e) => {
                    setClientSearch(e.target.value)
                    setSelectedClientId(null)
                  }}
                  className="ad_form_input"
                  placeholder="Buscar por nombre de cliente..."
                />
              </div>
              <div className="ad_form_group">
                <label htmlFor="deliveryId">
                  <Truck size={14} />
                  ID Distribuidor
                  {selectedDistributorId && <span className="ad_selected_indicator">Seleccionado</span>}
                </label>
                <input
                  type="number"
                  id="deliveryId"
                  value={selectedDistributorId?.toString() || deliveryId}
                  onChange={(e) => {
                    setDeliveryId(e.target.value)
                    setSelectedDistributorId(null)
                  }}
                  className="ad_form_input"
                  placeholder="Filtrar por distribuidor..."
                />
              </div>
            </div>
            <div className="ad_filter_buttons">
              <button type="submit" className="ad_btn_primary">
                <Filter size={16} />
                Aplicar Filtros
              </button>
              <button type="button" onClick={clearFilters} className="ad_btn_secondary">
                <X size={16} />
                Limpiar Todo
              </button>
            </div>
          </form>

          <div className="ad_filter_info">
            <Info size={14} />
            <span>Mostrando: {getFilterDateRange()}</span>
            {(selectedClientId || selectedDistributorId) && (
              <div className="ad_active_filters">
                {selectedClientId && (
                  <span className="ad_filter_tag">
                    Cliente: {dashboardData?.topClients.find((c) => c.UserId === selectedClientId)?.ClientName}
                    <button onClick={clearClientFilter}>
                      <X size={12} />
                    </button>
                  </span>
                )}
                {selectedDistributorId && (
                  <span className="ad_filter_tag">
                    Distribuidor:{" "}
                    {dashboardData?.topDeliveries.find((d) => d.UserId === selectedDistributorId)?.DistributorName}
                    <button onClick={clearDistributorFilter}>
                      <X size={12} />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Chart */}
      <section className="ad_chart_section">
        <div className="ad_card">
          <div className="ad_chart_header">
            <h3 className="ad_card_title">
              <BarChart3 className="ad_icon" />
              Tendencias Diarias
              <TrendingUp className="ad_trend_icon" size={16} />
            </h3>
            <div className="ad_chart_tabs">
              <button
                className={`ad_chart_tab ${activeView === "orders" ? "ad_active" : ""}`}
                onClick={() => setActiveView("orders")}
              >
                <ShoppingCart size={14} />
                Órdenes
              </button>
              <button
                className={`ad_chart_tab ${activeView === "revenue" ? "ad_active" : ""}`}
                onClick={() => setActiveView("revenue")}
              >
                <DollarSign size={14} />
                Ingresos
              </button>
            </div>
          </div>
          <div className="ad_chart_container" ref={chartRef}>
            <div className="ad_chart_y_axis">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="ad_chart_y_label">
                  {activeView === "revenue"
                    ? formatCurrency(Math.round((maxRevenue / 4) * (4 - i)))
                    : Math.round((maxOrders / 4) * (4 - i))}
                </div>
              ))}
            </div>
            <div className="ad_line_chart">
              <svg viewBox="0 0 300 150" className="ad_line_svg">
                {/* Grid lines */}
                {[...Array(5)].map((_, i) => (
                  <line
                    key={i}
                    x1="0"
                    y1={30 * i + 10}
                    x2="300"
                    y2={30 * i + 10}
                    stroke="#e5e5e5"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                  />
                ))}

                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="var(--primary-orange)" stopOpacity="1" />
                    <stop offset="100%" stopColor="var(--primary-orange)" stopOpacity="0.1" />
                  </linearGradient>
                </defs>

                {/* Area under the line */}
                {chartData.length > 0 && (
                  <path
                    d={`
                      M 10,150 
                      ${chartData
                        .map(
                          (data, index) =>
                            `L ${(index / (chartData.length - 1)) * 280 + 10},${
                              150 -
                              ((activeView === "revenue" ? data.revenue : data.orders) /
                                (activeView === "revenue" ? maxRevenue : maxOrders)) *
                                120 -
                              10
                            }`,
                        )
                        .join(" ")} 
                      L ${((chartData.length - 1) / (chartData.length - 1)) * 280 + 10},150 Z
                    `}
                    fill="url(#lineGradient)"
                    className="ad_area_path"
                  />
                )}

                {/* Line */}
                {chartData.length > 0 && (
                  <polyline
                    points={chartData
                      .map(
                        (data, index) =>
                          `${(index / (chartData.length - 1)) * 280 + 10},${
                            150 -
                            ((activeView === "revenue" ? data.revenue : data.orders) /
                              (activeView === "revenue" ? maxRevenue : maxOrders)) *
                              120 -
                            10
                          }`,
                      )
                      .join(" ")}
                    fill="none"
                    stroke="var(--primary-orange)"
                    strokeWidth="3"
                    className="ad_line_path"
                  />
                )}

                {/* Points */}
                {chartData.map((data, index) => (
                  <g
                    key={index}
                    className="ad_point_group"
                    onMouseEnter={(e) => handleChartMouseEnter(data, index, e as any)}
                    onMouseLeave={handleChartMouseLeave}
                  >
                    <circle
                      cx={(index / (chartData.length - 1)) * 280 + 10}
                      cy={
                        150 -
                        ((activeView === "revenue" ? data.revenue : data.orders) /
                          (activeView === "revenue" ? maxRevenue : maxOrders)) *
                          120 -
                        10
                      }
                      r="6"
                      fill="var(--white)"
                      stroke="var(--primary-orange)"
                      strokeWidth="2"
                      className="ad_line_point"
                      style={{ animationDelay: `${index * 0.2}s` }}
                    />
                    <circle
                      cx={(index / (chartData.length - 1)) * 280 + 10}
                      cy={
                        150 -
                        ((activeView === "revenue" ? data.revenue : data.orders) /
                          (activeView === "revenue" ? maxRevenue : maxOrders)) *
                          120 -
                        10
                      }
                      r="12"
                      fill="transparent"
                      className="ad_line_point_hover"
                    />
                  </g>
                ))}
              </svg>

              {chartTooltip.visible && (
                <div
                  className="ad_chart_tooltip"
                  style={{
                    left: `${chartTooltip.x}px`,
                    top: `${chartTooltip.y - 70}px`,
                  }}
                >
                  <div className="ad_tooltip_title">{chartTooltip.content.title}</div>
                  <div className="ad_tooltip_value">{chartTooltip.content.value}</div>
                  <div className="ad_tooltip_date">{chartTooltip.content.date}</div>
                </div>
              )}

              <div className="ad_line_labels">
                {chartData.map((data, index) => (
                  <span key={index} className="ad_line_label">
                    {data.date}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data Grids */}
      <section className="ad_data_section">
        <div className="ad_data_grid">
          {/* Top Products */}
          <div className="ad_card">
            <h3 className="ad_card_title">
              <Award className="ad_icon" />
              Productos Top ({dashboardData?.topProducts.length || 0})
            </h3>
            <div className="ad_products_list">
              {dashboardData?.topProducts.slice(0, 5).map((product, index) => (
                <div
                  key={product.ProductId}
                  className={`ad_product_item ${hoveredProduct === product.ProductId ? "ad_hovered" : ""}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onMouseEnter={() => setHoveredProduct(product.ProductId)}
                  onMouseLeave={() => setHoveredProduct(null)}
                >
                  <div className="ad_product_rank">#{index + 1}</div>
                  <div className="ad_product_info">
                    <h4 className="ad_product_name">{product.ProductName}</h4>
                    <div className="ad_product_stats">
                      <span className="ad_product_sold">
                        <Package size={14} />
                        {product.TotalSold} vendidos
                      </span>
                      <span className="ad_product_revenue">
                        <DollarSign size={14} />
                        {formatCurrency(product.TotalRevenue)}
                      </span>
                    </div>
                  </div>
                  <div className="ad_product_trend">
                    <TrendingUp size={16} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Distributors */}
          <div className="ad_card">
            <h3 className="ad_card_title">
              <Truck className="ad_icon" />
              Distribuidores - Haz click para filtrar
              <MousePointer className="ad_click_hint" size={16} />
            </h3>
            <div className="ad_distributors_list">
              {dashboardData?.topDeliveries.map((distributor, index) => (
                <div
                  key={distributor.UserId}
                  className={`ad_distributor_item ${selectedDistributorId === distributor.UserId ? "ad_selected" : ""}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => handleDistributorClick(distributor)}
                >
                  <div className="ad_distributor_avatar">
                    <Truck size={20} />
                  </div>
                  <div className="ad_distributor_info">
                    <h4 className="ad_distributor_name">{distributor.DistributorName}</h4>
                    <div className="ad_distributor_deliveries">
                      <Package size={14} />
                      {distributor.CompletedDeliveries} entregas
                    </div>
                  </div>
                  <div className="ad_distributor_id">ID: {distributor.UserId}</div>
                  <div className="ad_click_indicator">
                    <MousePointer size={14} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
