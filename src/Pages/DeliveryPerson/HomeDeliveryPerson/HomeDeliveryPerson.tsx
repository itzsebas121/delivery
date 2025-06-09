import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Package, CheckCircle, XCircle, DollarSign, MapPin, Clock, Filter, X, BarChart3, TrendingUp, Calendar, Truck, Info, RefreshCw } from 'lucide-react'
import { useAuth } from "../../../context/Authcontext"
import { baseURLRest } from "../../../config"
import "../../../StylesGeneral/style.css"
import "./dashboard.css"

interface DashboardData {
  resumen: {
    TotalOrders: number
    CompletedOrders: number
    FailedOrders: number
    TotalRevenue: number
  }
  ordenes: Array<{
    OrderId: number
    OrderDate: string
    Status: string
    DiscountedTotal: number
    DeliveryAddress: string
    DeliveryAddressName: string
    DeliveryLatitude: number
    DeliveryLongitude: number
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

export function HomeDeliveryPerson() {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [error, setError] = useState("")
  const [activeChart, setActiveChart] = useState<"orders" | "revenue">("orders")
  const [barTooltip, setBarTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: { title: "", value: "", date: "" },
  })
  const [lineTooltip, setLineTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: { title: "", value: "", date: "" },
  })
  const [refreshing, setRefreshing] = useState(false)
  const [chartView, setChartView] = useState<"daily" | "weekly">("daily")

  const barChartRef = useRef<HTMLDivElement>(null)
  const lineChartRef = useRef<HTMLDivElement>(null)

  const token = localStorage.getItem("token") || ""

  const fetchDashboardData = async (start?: string, end?: string) => {
    if (!user?.id) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`${baseURLRest}/dashboardDeliveryPerson/${user.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          startDate: start || null,
          endDate: end || null,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al obtener los datos")
      }

      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setError("Error al cargar los datos del dashboard")
    } finally {
      setLoading(false)
    }
  }

  const refreshData = () => {
    setRefreshing(true)
    fetchDashboardData(startDate, endDate).then(() => {
      setTimeout(() => setRefreshing(false), 500)
    })
  }

  useEffect(() => {
    fetchDashboardData()
  }, [user?.id])

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchDashboardData(startDate, endDate)
  }

  const clearFilters = () => {
    setStartDate("")
    setEndDate("")
    fetchDashboardData()
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
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "completada":
        return "dd_status_completed"
      case "en camino":
        return "dd_status_in_progress"
      case "cancelada":
        return "dd_status_cancelled"
      default:
        return "dd_status_default"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completada":
        return <CheckCircle size={16} />
      case "en camino":
        return <Truck size={16} />
      case "cancelada":
        return <XCircle size={16} />
      default:
        return <Clock size={16} />
    }
  }

  const prepareChartData = () => {
    if (!dashboardData?.ordenes) return []

    const dailyData = dashboardData.ordenes.reduce(
      (acc, order) => {
        const date = formatDate(order.OrderDate, "short")

        const existing = acc.find((item) => item.date === date)
        if (existing) {
          existing.orders += 1
          existing.revenue += order.DiscountedTotal
        } else {
          acc.push({
            date,
            orders: 1,
            revenue: order.DiscountedTotal,
            fullDate: order.OrderDate,
          })
        }
        return acc
      },
      [] as Array<{ date: string; orders: number; revenue: number; fullDate: string }>,
    )

    // Sort by date
    dailyData.sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())

    return dailyData.slice(-7) // Últimos 7 días
  }

  const prepareWeeklyChartData = () => {
    if (!dashboardData?.ordenes) return []

    const weeklyData = dashboardData.ordenes.reduce(
      (acc, order) => {
        const orderDate = new Date(order.OrderDate)
        const weekStart = new Date(orderDate)
        weekStart.setDate(orderDate.getDate() - orderDate.getDay())
        const weekKey = formatDate(weekStart.toISOString(), "short")

        const existing = acc.find((item) => item.date === weekKey)
        if (existing) {
          existing.orders += 1
          existing.revenue += order.DiscountedTotal
        } else {
          acc.push({
            date: weekKey,
            orders: 1,
            revenue: order.DiscountedTotal,
            fullDate: weekStart.toISOString(),
          })
        }
        return acc
      },
      [] as Array<{ date: string; orders: number; revenue: number; fullDate: string }>,
    )

    // Sort by date
    weeklyData.sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())

    return weeklyData.slice(-5) // Últimas 5 semanas
  }

  const chartData = chartView === "daily" ? prepareChartData() : prepareWeeklyChartData()
  const maxOrders = Math.max(...chartData.map((d) => d.orders), 1)
  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 1)

  const handleBarMouseEnter = (data: any, _index: number, event: React.MouseEvent) => {
    if (!barChartRef.current) return

    const rect = barChartRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    setBarTooltip({
      visible: true,
      x,
      y,
      content: {
        title: "Órdenes",
        value: data.orders.toString(),
        date: data.date,
      },
    })
  }

  const handleBarMouseLeave = () => {
    setBarTooltip((prev) => ({ ...prev, visible: false }))
  }

  const handleLineMouseEnter = (data: any, _index: number, event: React.MouseEvent) => {
    if (!lineChartRef.current) return

    const rect = lineChartRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    setLineTooltip({
      visible: true,
      x,
      y,
      content: {
        title: "Ingresos",
        value: formatCurrency(data.revenue),
        date: data.date,
      },
    })
  }

  const handleLineMouseLeave = () => {
    setLineTooltip((prev) => ({ ...prev, visible: false }))
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

  if (loading) {
    return (
      <div className="dd_dashboard_container">
        <div className="dd_loading_spinner">
          <div className="dd_spinner"></div>
          <p>Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dd_dashboard_container">
        <div className="dd_error_message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => fetchDashboardData()} className="dd_btn_retry">
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="dd_dashboard_container">
      {/* Header */}
      <header className="dd_dashboard_header">
        <h1 className="dd_dashboard_title">Dashboard de Delivery</h1>
        <p className="dd_dashboard_subtitle">Bienvenido, {user?.nombre || "Delivery Person"}</p>
      </header>

      {/* Stats Cards - Más compactas */}
      <section className="dd_stats_section">
        <div className="dd_stats_grid">
          <div className="dd_stat_card dd_stat_card_1">
            <div className="dd_stat_icon_wrapper">
              <Package className="dd_stat_icon" />
            </div>
            <div className="dd_stat_content">
              <p className="dd_stat_number">{dashboardData?.resumen.TotalOrders || 0}</p>
              <span className="dd_stat_label">Total Órdenes</span>
            </div>
          </div>

          <div className="dd_stat_card dd_stat_card_2">
            <div className="dd_stat_icon_wrapper">
              <CheckCircle className="dd_stat_icon" />
            </div>
            <div className="dd_stat_content">
              <p className="dd_stat_number">{dashboardData?.resumen.CompletedOrders || 0}</p>
              <span className="dd_stat_label">Completadas</span>
            </div>
          </div>

          <div className="dd_stat_card dd_stat_card_3">
            <div className="dd_stat_icon_wrapper">
              <XCircle className="dd_stat_icon" />
            </div>
            <div className="dd_stat_content">
              <p className="dd_stat_number">{dashboardData?.resumen.FailedOrders || 0}</p>
              <span className="dd_stat_label">Fallidas</span>
            </div>
          </div>

          <div className="dd_stat_card dd_stat_card_4">
            <div className="dd_stat_icon_wrapper">
              <DollarSign className="dd_stat_icon" />
            </div>
            <div className="dd_stat_content">
              <p className="dd_stat_number">{formatCurrency(dashboardData?.resumen.TotalRevenue || 0)}</p>
              <span className="dd_stat_label">Ingresos</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filtros */}
      <section className="dd_filters_section">
        <div className="dd_card">
          <h3 className="dd_card_title">
            <Filter className="dd_icon" />
            Filtros de Fecha
          </h3>
          <form onSubmit={handleFilterSubmit} className="dd_filters_form">
            <div className="dd_form_group">
              <label htmlFor="startDate">Fecha Inicio</label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="dd_form_input"
              />
            </div>
            <div className="dd_form_group">
              <label htmlFor="endDate">Fecha Fin</label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="dd_form_input"
              />
            </div>
            <div className="dd_filter_buttons">
              <button type="submit" className="dd_btn_primary">
                Aplicar Filtros
              </button>
              <button type="button" onClick={clearFilters} className="dd_btn_secondary">
                <X size={16} />
                Limpiar
              </button>
            </div>
          </form>
          <div className="dd_filter_info">
            <Info size={14} />
            <span>Mostrando: {getFilterDateRange()}</span>
            <button onClick={refreshData} className={`dd_btn_refresh ${refreshing ? "dd_refreshing" : ""}`}>
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Charts */}
      <section className="dd_charts_section">
        <div className="dd_charts_grid">
          {/* Bar Chart */}
          <div className="dd_card dd_chart_card">
            <div className="dd_chart_header">
              <h3 className="dd_card_title">
                <BarChart3 className="dd_icon" />
                Órdenes por {chartView === "daily" ? "Día" : "Semana"}
              </h3>
              <div className="dd_chart_controls">
                <button
                  className={`dd_chart_control ${chartView === "daily" ? "dd_active" : ""}`}
                  onClick={() => setChartView("daily")}
                >
                  Diario
                </button>
                <button
                  className={`dd_chart_control ${chartView === "weekly" ? "dd_active" : ""}`}
                  onClick={() => setChartView("weekly")}
                >
                  Semanal
                </button>
              </div>
            </div>
            <div className="dd_chart_container" ref={barChartRef}>
              <div className="dd_chart_y_axis">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="dd_chart_y_label">
                    {Math.round((maxOrders / 4) * (4 - i))}
                  </div>
                ))}
              </div>
              <div className="dd_bar_chart">
                {chartData.map((data, index) => (
                  <div
                    key={index}
                    className="dd_bar_item"
                    onMouseEnter={(e) => handleBarMouseEnter(data, index, e)}
                    onMouseLeave={handleBarMouseLeave}
                  >
                    <div
                      className="dd_bar"
                      style={{
                        height: `${(data.orders / maxOrders) * 100}%`,
                        animationDelay: `${index * 0.1}s`,
                      }}
                    >
                      <span className="dd_bar_value">{data.orders}</span>
                    </div>
                    <span className="dd_bar_label">{data.date}</span>
                  </div>
                ))}
                {barTooltip.visible && (
                  <div
                    className="dd_chart_tooltip"
                    style={{
                      left: `${barTooltip.x}px`,
                      top: `${barTooltip.y - 70}px`,
                    }}
                  >
                    <div className="dd_tooltip_title">{barTooltip.content.title}</div>
                    <div className="dd_tooltip_value">{barTooltip.content.value}</div>
                    <div className="dd_tooltip_date">{barTooltip.content.date}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Line Chart */}
          <div className="dd_card dd_chart_card">
            <div className="dd_chart_header">
              <h3 className="dd_card_title">
                <TrendingUp className="dd_icon" />
                Ingresos por {chartView === "daily" ? "Día" : "Semana"}
              </h3>
              <div className="dd_chart_tabs">
                <button
                  className={`dd_chart_tab ${activeChart === "orders" ? "dd_active" : ""}`}
                  onClick={() => setActiveChart("orders")}
                >
                  Órdenes
                </button>
                <button
                  className={`dd_chart_tab ${activeChart === "revenue" ? "dd_active" : ""}`}
                  onClick={() => setActiveChart("revenue")}
                >
                  Ingresos
                </button>
              </div>
            </div>
            <div className="dd_chart_container" ref={lineChartRef}>
              <div className="dd_chart_y_axis">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="dd_chart_y_label">
                    {activeChart === "revenue"
                      ? formatCurrency(Math.round((maxRevenue / 4) * (4 - i)))
                      : Math.round((maxOrders / 4) * (4 - i))}
                  </div>
                ))}
              </div>
              <div className="dd_line_chart">
                <svg viewBox="0 0 300 150" className="dd_line_svg">
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
                  <path
                    d={`
                      M ${chartData.length > 0 ? 10 : 0},150 
                      ${chartData
                        .map(
                          (data, index) =>
                            `L ${(index / (chartData.length - 1)) * 280 + 10},${
                              150 -
                              ((activeChart === "revenue" ? data.revenue : data.orders) /
                                (activeChart === "revenue" ? maxRevenue : maxOrders)) *
                                120 -
                              10
                            }`,
                        )
                        .join(" ")} 
                      L ${chartData.length > 0 ? (chartData.length - 1) / (chartData.length - 1) * 280 + 10 : 300},150 Z
                    `}
                    fill="url(#lineGradient)"
                    className="dd_area_path"
                  />

                  {/* Line */}
                  <polyline
                    points={chartData
                      .map(
                        (data, index) =>
                          `${(index / (chartData.length - 1)) * 280 + 10},${
                            150 -
                            ((activeChart === "revenue" ? data.revenue : data.orders) /
                              (activeChart === "revenue" ? maxRevenue : maxOrders)) *
                              120 -
                            10
                          }`,
                      )
                      .join(" ")}
                    fill="none"
                    stroke="var(--primary-orange)"
                    strokeWidth="3"
                    className="dd_line_path"
                  />

                  {/* Points */}
                  {chartData.map((data, index) => (
                    <g
                      key={index}
                      className="dd_point_group"
                      onMouseEnter={(e) => handleLineMouseEnter(data, index, e as any)}
                      onMouseLeave={handleLineMouseLeave}
                    >
                      <circle
                        cx={(index / (chartData.length - 1)) * 280 + 10}
                        cy={
                          150 -
                          ((activeChart === "revenue" ? data.revenue : data.orders) /
                            (activeChart === "revenue" ? maxRevenue : maxOrders)) *
                            120 -
                          10
                        }
                        r="6"
                        fill="var(--white)"
                        stroke="var(--primary-orange)"
                        strokeWidth="2"
                        className="dd_line_point"
                        style={{ animationDelay: `${index * 0.2}s` }}
                      />
                      <circle
                        cx={(index / (chartData.length - 1)) * 280 + 10}
                        cy={
                          150 -
                          ((activeChart === "revenue" ? data.revenue : data.orders) /
                            (activeChart === "revenue" ? maxRevenue : maxOrders)) *
                            120 -
                          10
                        }
                        r="12"
                        fill="transparent"
                        className="dd_line_point_hover"
                      />
                    </g>
                  ))}
                </svg>

                {lineTooltip.visible && (
                  <div
                    className="dd_chart_tooltip"
                    style={{
                      left: `${lineTooltip.x}px`,
                      top: `${lineTooltip.y - 70}px`,
                    }}
                  >
                    <div className="dd_tooltip_title">{lineTooltip.content.title}</div>
                    <div className="dd_tooltip_value">{lineTooltip.content.value}</div>
                    <div className="dd_tooltip_date">{lineTooltip.content.date}</div>
                  </div>
                )}

                <div className="dd_line_labels">
                  {chartData.map((data, index) => (
                    <span key={index} className="dd_line_label">
                      {data.date}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Orders Cards */}
      <section className="dd_orders_section">
        <div className="dd_card">
          <h3 className="dd_card_title">
            <Package className="dd_icon" />
            Historial de Órdenes ({dashboardData?.ordenes.length || 0})
          </h3>
          <div className="dd_orders_grid">
            {dashboardData?.ordenes.map((order, index) => (
              <div key={order.OrderId} className="dd_order_card" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="dd_order_header">
                  <div className="dd_order_id">
                    <Package size={16} />#{order.OrderId}
                  </div>
                  <div className={`dd_status_badge ${getStatusClass(order.Status)}`}>
                    {getStatusIcon(order.Status)}
                    {order.Status}
                  </div>
                </div>

                <div className="dd_order_info">
                  <div className="dd_order_date">
                    <Calendar size={14} />
                    {formatDate(order.OrderDate)}
                  </div>

                  <div className="dd_order_address">
                    <MapPin size={14} />
                    <span title={order.DeliveryAddress}>
                      {order.DeliveryAddressName.length > 60
                        ? `${order.DeliveryAddressName.substring(0, 60)}...`
                        : order.DeliveryAddressName}
                    </span>
                  </div>
                </div>

                <div className="dd_order_footer">
                  <div className="dd_order_total">
                    <DollarSign size={16} />
                    {formatCurrency(order.DiscountedTotal)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
