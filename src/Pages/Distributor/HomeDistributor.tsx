import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  Truck,
  DollarSign,
  Calendar,
  Filter,
  X,
  RefreshCw,
  Award,
  Activity,
  Loader,
  MousePointer,
  BarChart3,
  Target,
  Star,
  Info,
  ShoppingBag,
  Clock,
} from "lucide-react"
import { useAuth } from "../../context/Authcontext"
import { baseURLRest } from "../../config"
import "./../../StylesGeneral/style.css"
import "./home-distributor.css"

interface TotalVentas {
  FechaInicioActual: string
  FechaFinActual: string
  FechaInicioAnterior: string
  FechaFinAnterior: string
  VentasActual: number
  VentasPeriodoAnterior: number
  PorcentajeCrecimiento: number | null
}

interface ClienteFrecuente {
  ClientId: number
  Name: string
  NumeroCompras: number
  MontoTotal: number
  PromedioCompra: number
}

interface RepartidorEficiente {
  DeliveryId: number
  Name: string
  TotalAsignados: number
  EntregasCompletadas: number
  EficienciaPorcentaje: number
}

interface TopProducto {
  ProductId: number
  Name: string
  CantidadVendida: number
  MontoTotalVentas: number
}

interface TooltipState {
  visible: boolean
  x: number
  y: number
  content: {
    title: string
    value: string
    extra?: string
    details?: string[]
  }
}

interface LoadingState {
  ventas: boolean
  clientes: boolean
  repartidores: boolean
  productos: boolean
}

export default function HomeDistributor() {
  const { user } = useAuth()
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [clientId, setClientId] = useState("")
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)

  const [totalVentas, setTotalVentas] = useState<TotalVentas | null>(null)
  const [clientesFrecuentes, setClientesFrecuentes] = useState<ClienteFrecuente[]>([])
  const [repartidoresEficientes, setRepartidoresEficientes] = useState<RepartidorEficiente[]>([])
  const [topProductos, setTopProductos] = useState<TopProducto[]>([])

  const [loading, setLoading] = useState<LoadingState>({
    ventas: false,
    clientes: false,
    repartidores: false,
    productos: false,
  })

  const [ventasTooltip, setVentasTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: { title: "", value: "" },
  })

  const [productosTooltip, setProductosTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: { title: "", value: "" },
  })

  const [clienteTooltip, setClienteTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: { title: "", value: "" },
  })

  const [donutTooltip, setDonutTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: { title: "", value: "" },
  })

  const [repartidorTooltip, setRepartidorTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: { title: "", value: "" },
  })

  const ventasChartRef = useRef<HTMLDivElement>(null)
  const productosChartRef = useRef<HTMLDivElement>(null)
  const donutChartRef = useRef<HTMLDivElement>(null)

  const token = localStorage.getItem("token") || ""

  // Fetch functions
  const fetchTotalVentas = async () => {
    setLoading((prev) => ({ ...prev, ventas: true }))
    try {
      const params = new URLSearchParams()
      if (fechaInicio) params.append("fechaInicio", fechaInicio)
      if (fechaFin) params.append("fechaFin", fechaFin)
      if (selectedClientId || clientId) params.append("clientId", (selectedClientId || clientId).toString())

      const response = await fetch(`${baseURLRest}/analytics/total-ventas?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Error al obtener ventas")
      const data = await response.json()
      setTotalVentas(data)
    } catch (error) {
      console.error("Error fetching ventas:", error)
      setTotalVentas(null)
    } finally {
      setLoading((prev) => ({ ...prev, ventas: false }))
    }
  }

  const fetchClientesFrecuentes = async () => {
    setLoading((prev) => ({ ...prev, clientes: true }))
    try {
      const params = new URLSearchParams()
      if (fechaInicio) params.append("fechaInicio", fechaInicio)
      if (fechaFin) params.append("fechaFin", fechaFin)

      const response = await fetch(`${baseURLRest}/analytics/clientes-frecuentes?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Error al obtener clientes")
      const data = await response.json()
      setClientesFrecuentes(data)
    } catch (error) {
      console.error("Error fetching clientes:", error)
      setClientesFrecuentes([])
    } finally {
      setLoading((prev) => ({ ...prev, clientes: false }))
    }
  }

  const fetchRepartidoresEficientes = async () => {
    setLoading((prev) => ({ ...prev, repartidores: true }))
    try {
      const params = new URLSearchParams()
      if (fechaInicio) params.append("fechaInicio", fechaInicio)
      if (fechaFin) params.append("fechaFin", fechaFin)
      if (selectedClientId || clientId) params.append("clientId", (selectedClientId || clientId).toString())

      const response = await fetch(`${baseURLRest}/analytics/repartidores-eficientes?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Error al obtener repartidores")
      const data = await response.json()
      setRepartidoresEficientes(data)
    } catch (error) {
      console.error("Error fetching repartidores:", error)
      setRepartidoresEficientes([])
    } finally {
      setLoading((prev) => ({ ...prev, repartidores: false }))
    }
  }

  const fetchTopProductos = async () => {
    setLoading((prev) => ({ ...prev, productos: true }))
    try {
      const params = new URLSearchParams()
      if (fechaInicio) params.append("fechaInicio", fechaInicio)
      if (fechaFin) params.append("fechaFin", fechaFin)
      if (selectedClientId || clientId) params.append("clientId", (selectedClientId || clientId).toString())

      const response = await fetch(`${baseURLRest}/analytics/top-productos?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Error al obtener productos")
      const data = await response.json()
      setTopProductos(data)
    } catch (error) {
      console.error("Error fetching productos:", error)
      setTopProductos([])
    } finally {
      setLoading((prev) => ({ ...prev, productos: false }))
    }
  }

  const fetchTotalVentasWithClient = async (clienteId: number) => {
    setLoading((prev) => ({ ...prev, ventas: true }))
    try {
      const params = new URLSearchParams()
      if (fechaInicio) params.append("fechaInicio", fechaInicio)
      if (fechaFin) params.append("fechaFin", fechaFin)
      params.append("clientId", clienteId.toString())

      const response = await fetch(`${baseURLRest}/analytics/total-ventas?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Error al obtener ventas")
      const data = await response.json()
      setTotalVentas(data)
    } catch (error) {
      console.error("Error fetching ventas:", error)
      setTotalVentas(null)
    } finally {
      setLoading((prev) => ({ ...prev, ventas: false }))
    }
  }

  const fetchRepartidoresEficientesWithClient = async (clienteId: number) => {
    setLoading((prev) => ({ ...prev, repartidores: true }))
    try {
      const params = new URLSearchParams()
      if (fechaInicio) params.append("fechaInicio", fechaInicio)
      if (fechaFin) params.append("fechaFin", fechaFin)
      params.append("clientId", clienteId.toString())

      const response = await fetch(`${baseURLRest}/analytics/repartidores-eficientes?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Error al obtener repartidores")
      const data = await response.json()
      setRepartidoresEficientes(data)
    } catch (error) {
      console.error("Error fetching repartidores:", error)
      setRepartidoresEficientes([])
    } finally {
      setLoading((prev) => ({ ...prev, repartidores: false }))
    }
  }

  const fetchTopProductosWithClient = async (clienteId: number) => {
    setLoading((prev) => ({ ...prev, productos: true }))
    try {
      const params = new URLSearchParams()
      if (fechaInicio) params.append("fechaInicio", fechaInicio)
      if (fechaFin) params.append("fechaFin", fechaFin)
      params.append("clientId", clienteId.toString())

      const response = await fetch(`${baseURLRest}/analytics/top-productos?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Error al obtener productos")
      const data = await response.json()
      setTopProductos(data)
    } catch (error) {
      console.error("Error fetching productos:", error)
      setTopProductos([])
    } finally {
      setLoading((prev) => ({ ...prev, productos: false }))
    }
  }

  const loadAllData = () => {
    fetchTotalVentas()
    fetchClientesFrecuentes()
    fetchRepartidoresEficientes()
    fetchTopProductos()
  }

  useEffect(() => {
    loadAllData()

    if (!fechaInicio) {
      const today = new Date()
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      setFechaInicio(firstDay.toISOString().split("T")[0])
    }

    if (!fechaFin) {
      const today = new Date();
      setFechaFin(today.toISOString().split("T")[0]);
    }

  }, [])

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loadAllData()
  }

  const handleClientClick = (cliente: ClienteFrecuente) => {
    if (selectedClientId === cliente.ClientId) {
      // Si ya está seleccionado, deseleccionar
      setSelectedClientId(null)
      setClientId("")
      // Actualizar inmediatamente con filtros vacíos
      setTimeout(() => {
        fetchTotalVentas()
        fetchRepartidoresEficientes()
        fetchTopProductos()
      }, 50)
    } else {
      // Seleccionar nuevo cliente
      setSelectedClientId(cliente.ClientId)
      setClientId(cliente.ClientId.toString())
      // Actualizar inmediatamente con el nuevo cliente
      setTimeout(() => {
        fetchTotalVentasWithClient(cliente.ClientId)
        fetchRepartidoresEficientesWithClient(cliente.ClientId)
        fetchTopProductosWithClient(cliente.ClientId)
      }, 50)
    }
  }

  const clearFilters = () => {
    setFechaInicio("")
    setFechaFin("")
    setClientId("")
    setSelectedClientId(null)

    setTimeout(loadAllData, 100)
  }


  const refreshVentas = () => {
    if (selectedClientId) {
      fetchTotalVentasWithClient(selectedClientId)
    } else {
      fetchTotalVentas()
    }
  }

  const refreshClientes = () => {
    fetchClientesFrecuentes()
  }

  const refreshRepartidores = () => {
    if (selectedClientId) {
      fetchRepartidoresEficientesWithClient(selectedClientId)
    } else {
      fetchRepartidoresEficientes()
    }
  }

  const refreshProductos = () => {
    if (selectedClientId) {
      fetchTopProductosWithClient(selectedClientId)
    } else {
      fetchTopProductos()
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    date.setDate(date.getDate() + 1);
    return date.toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "short",
    });
  }


  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-EC", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getCrecimientoIcon = (porcentaje: number | null) => {
    if (porcentaje === null) return <Activity size={20} />
    return porcentaje >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />
  }

  const getCrecimientoColor = (porcentaje: number | null) => {
    if (porcentaje === null) return "var(--medium-gray)"
    return porcentaje >= 0 ? "var(--accent-green)" : "var(--error)"
  }

  // Tooltip handlers
  const handleVentasMouseEnter = (event: React.MouseEvent, type: "actual" | "anterior") => {
    if (!ventasChartRef.current || !totalVentas) return

    const rect = ventasChartRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const isActual = type === "actual"
    const valor = isActual ? totalVentas.VentasActual : totalVentas.VentasPeriodoAnterior
    const fechaInicio = isActual ? totalVentas.FechaInicioActual : totalVentas.FechaInicioAnterior
    const fechaFin = isActual ? totalVentas.FechaFinActual : totalVentas.FechaFinAnterior

    setVentasTooltip({
      visible: true,
      x,
      y,
      content: {
        title: isActual ? "Período Actual" : "Período Anterior",
        value: formatCurrency(valor),
        extra: `${formatFullDate(fechaInicio)} - ${formatFullDate(fechaFin)}`,
        details: [
          `Total de ventas: ${formatCurrency(valor)}`,
          `Período: ${formatFullDate(fechaInicio)} - ${formatFullDate(fechaFin)}`,
          selectedClientId ? `Cliente: ${getSelectedClientName()}` : "Todos los clientes",
        ],
      },
    })
  }

  const handleVentasMouseLeave = () => {
    setVentasTooltip((prev) => ({ ...prev, visible: false }))
  }

  const handleProductoMouseEnter = (event: React.MouseEvent, producto: TopProducto, index: number) => {
    if (!productosChartRef.current) return

    const rect = productosChartRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    setProductosTooltip({
      visible: true,
      x,
      y,
      content: {
        title: producto.Name,
        value: formatCurrency(producto.MontoTotalVentas),
        extra: `${producto.CantidadVendida} unidades vendidas`,
        details: [
          `Ranking: #${index + 1}`,
          `Ventas totales: ${formatCurrency(producto.MontoTotalVentas)}`,
          `Unidades vendidas: ${producto.CantidadVendida}`,
          `Precio promedio: ${formatCurrency(producto.MontoTotalVentas / producto.CantidadVendida)}`,
          selectedClientId ? `Cliente: ${getSelectedClientName()}` : "Todos los clientes",
        ],
      },
    })
  }

  const handleProductoMouseLeave = () => {
    setProductosTooltip((prev) => ({ ...prev, visible: false }))
  }

  const handleClienteMouseEnter = (event: React.MouseEvent, cliente: ClienteFrecuente, index: number) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    setClienteTooltip({
      visible: true,
      x: x + rect.left,
      y: y + rect.top - 100,
      content: {
        title: cliente.Name,
        value: formatCurrency(cliente.MontoTotal),
        extra: `${cliente.NumeroCompras} compras`,
        details: [
          `Ranking: #${index + 1}`,
          `Total gastado: ${formatCurrency(cliente.MontoTotal)}`,
          `Número de compras: ${cliente.NumeroCompras}`,
          `Promedio por compra: ${formatCurrency(cliente.PromedioCompra)}`,
          `ID Cliente: ${cliente.ClientId}`,
          `Click para filtrar por este cliente`,
        ],
      },
    })
  }

  const handleClienteMouseLeave = () => {
    setClienteTooltip((prev) => ({ ...prev, visible: false }))
  }

  const handleDonutMouseEnter = (event: React.MouseEvent, cliente: ClienteFrecuente, percentage: number) => {
    if (!donutChartRef.current) return

    const rect = donutChartRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    setDonutTooltip({
      visible: true,
      x,
      y,
      content: {
        title: cliente.Name,
        value: formatCurrency(cliente.MontoTotal),
        extra: `${percentage.toFixed(1)}% del total`,
        details: [
          `Porcentaje: ${percentage.toFixed(1)}%`,
          `Monto: ${formatCurrency(cliente.MontoTotal)}`,
          `Compras: ${cliente.NumeroCompras}`,
        ],
      },
    })
  }

  const handleDonutMouseLeave = () => {
    setDonutTooltip((prev) => ({ ...prev, visible: false }))
  }

  const handleRepartidorMouseEnter = (event: React.MouseEvent, repartidor: RepartidorEficiente) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    setRepartidorTooltip({
      visible: true,
      x: x + rect.left,
      y: y + rect.top - 100,
      content: {
        title: repartidor.Name,
        value: `${repartidor.EficienciaPorcentaje.toFixed(0)}%`,
        extra: `${repartidor.EntregasCompletadas}/${repartidor.TotalAsignados}`,
        details: [
          `Eficiencia: ${repartidor.EficienciaPorcentaje.toFixed(1)}%`,
          `Entregas completadas: ${repartidor.EntregasCompletadas}`,
          `Total asignadas: ${repartidor.TotalAsignados}`,
          `Pendientes: ${repartidor.TotalAsignados - repartidor.EntregasCompletadas}`,
          `ID Repartidor: ${repartidor.DeliveryId}`,
        ],
      },
    })
  }

  const handleRepartidorMouseLeave = () => {
    setRepartidorTooltip((prev) => ({ ...prev, visible: false }))
  }

  const getSelectedClientName = () => {
    if (!selectedClientId) return null
    const cliente = clientesFrecuentes.find((c) => c.ClientId === selectedClientId)
    return cliente?.Name || `Cliente ${selectedClientId}`
  }

  const getEficienciaColor = (porcentaje: number) => {
    if (porcentaje >= 90) return "var(--accent-green)"
    if (porcentaje >= 70) return "var(--primary-orange)"
    return "var(--error)"
  }

  return (
    <div className="hd_dashboard_container">
      {/* Header */}
      <header className="hd_dashboard_header">
        <div className="hd_header_content">
          <h1 className="hd_dashboard_title">¡Bienvenido, {user?.nombre}!</h1>
          <p className="hd_dashboard_subtitle">
            {selectedClientId ? `Análisis para: ${getSelectedClientName()}` : "Reporte de ventas"}
          </p>
        </div>
      </header>

      {/* Filtros */}
      <section className="hd_filters_section">
        <form onSubmit={handleFilterSubmit} className="hd_filters_form">
          <div className="hd_filter_group">
            <Calendar size={14} />
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="hd_form_input"
              placeholder="Fecha inicio"
            />
          </div>
          <div className="hd_filter_group">
            <Calendar size={14} />
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="hd_form_input"
              placeholder="Fecha fin"
            />
          </div>
          <button type="submit" className="hd_btn_apply">
            <Filter size={14} />
            Aplicar
          </button>
          <button type="button" onClick={clearFilters} className="hd_btn_clear">
            <X size={14} />
            Limpiar
          </button>
        </form>
        {selectedClientId && (
          <div className="hd_selected_client_info">
            <Star size={14} />
            <span>Filtrando por: {getSelectedClientName()}</span>
            <button onClick={() => handleClientClick({ ClientId: selectedClientId } as ClienteFrecuente)}>
              <X size={12} />
            </button>
          </div>
        )}
      </section>

      {/* Main Layout */}
      <div className="hd_main_layout">
        {/* Sidebar Izquierda - Clientes */}
        <aside className="hd_sidebar_left">
          <div className="hd_clientes_section">
            <div className="hd_section_header">
              <h3>
                <Users size={16} />
                Top Clientes
                <MousePointer size={12} className="hd_click_hint" />
              </h3>
              <div className="hd_section_actions">
                {loading.clientes && <Loader className="hd_spinner" size={14} />}
                <button onClick={refreshClientes} className="hd_btn_refresh_section" title="Actualizar clientes">
                  <RefreshCw size={12} />
                </button>
              </div>
            </div>

            {clientesFrecuentes.length > 0 ? (
              <div className="hd_clientes_list">
                {clientesFrecuentes.slice(0, 5).map((cliente, index) => (
                  <div
                    key={cliente.ClientId}
                    className={`hd_cliente_card ${selectedClientId === cliente.ClientId ? "hd_selected" : ""}`}
                    onClick={() => handleClientClick(cliente)}
                    onMouseEnter={(e) => handleClienteMouseEnter(e, cliente, index)}
                    onMouseLeave={handleClienteMouseLeave}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="hd_cliente_rank">#{index + 1}</div>
                    <div className="hd_cliente_info">
                      <h4 className="hd_cliente_name">{cliente.Name}</h4>
                      <div className="hd_cliente_stats">
                        <div className="hd_stat_item">
                          <ShoppingBag size={12} />
                          <span>{cliente.NumeroCompras} compras</span>
                        </div>
                        <div className="hd_stat_item">
                          <DollarSign size={12} />
                          <span>{formatCurrency(cliente.MontoTotal)}</span>
                        </div>
                        <div className="hd_stat_item">
                          <Target size={12} />
                          <span>Prom: {formatCurrency(cliente.PromedioCompra)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="hd_cliente_indicator">
                      {selectedClientId === cliente.ClientId ? "✓" : <MousePointer size={12} />}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="hd_no_data">
                <Users size={24} />
                <span>No hay datos de clientes</span>
              </div>
            )}

            {/* Gráfico de Clientes */}
            {clientesFrecuentes.length > 0 && (
              <div className="hd_clientes_chart">
                <h4>Distribución por Monto</h4>
                <div className="hd_donut_chart" ref={donutChartRef}>
                  <svg viewBox="0 0 100 100" className="hd_donut_svg">
                    {clientesFrecuentes.slice(0, 5).map((cliente, index) => {
                      const total = clientesFrecuentes.reduce((sum, c) => sum + c.MontoTotal, 0)
                      const percentage = (cliente.MontoTotal / total) * 100
                      const startAngle = clientesFrecuentes
                        .slice(0, index)
                        .reduce((sum, c) => sum + (c.MontoTotal / total) * 360, 0)
                      const endAngle = startAngle + (percentage * 360) / 100

                      const startAngleRad = (startAngle * Math.PI) / 180
                      const endAngleRad = (endAngle * Math.PI) / 180

                      const largeArcFlag = percentage > 50 ? 1 : 0
                      const x1 = 50 + 35 * Math.cos(startAngleRad)
                      const y1 = 50 + 35 * Math.sin(startAngleRad)
                      const x2 = 50 + 35 * Math.cos(endAngleRad)
                      const y2 = 50 + 35 * Math.sin(endAngleRad)

                      const colors = [
                        "var(--primary-orange)",
                        "var(--accent-green)",
                        "var(--info)",
                        "var(--warning)",
                        "var(--accent-blue)",
                      ]

                      return (
                        <path
                          key={cliente.ClientId}
                          d={`M 50 50 L ${x1} ${y1} A 35 35 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                          fill={colors[index]}
                          className={`hd_donut_slice ${selectedClientId === cliente.ClientId ? "hd_highlighted" : ""}`}
                          style={{ animationDelay: `${index * 0.2}s` }}
                          onMouseEnter={(e) => handleDonutMouseEnter(e, cliente, percentage)}
                          onMouseLeave={handleDonutMouseLeave}
                        />
                      )
                    })}
                    <circle cx="50" cy="50" r="20" fill="var(--white)" />
                  </svg>
                  <div className="hd_donut_center">
                    <span className="hd_donut_total">
                      {formatCurrency(clientesFrecuentes.reduce((sum, c) => sum + c.MontoTotal, 0))}
                    </span>
                    <span className="hd_donut_label">Total</span>
                  </div>
                </div>
                <div className="hd_donut_legend">
                  {clientesFrecuentes.slice(0, 5).map((cliente, index) => {
                    const total = clientesFrecuentes.reduce((sum, c) => sum + c.MontoTotal, 0)
                    const percentage = (cliente.MontoTotal / total) * 100
                    const colors = [
                      "var(--primary-orange)",
                      "var(--accent-green)",
                      "var(--info)",
                      "var(--warning)",
                      "var(--accent-blue)",
                    ]

                    return (
                      <div
                        key={cliente.ClientId}
                        className={`hd_legend_item ${selectedClientId === cliente.ClientId ? "hd_selected" : ""}`}
                        onClick={() => handleClientClick(cliente)}
                      >
                        <div className="hd_legend_color" style={{ backgroundColor: colors[index] }}></div>
                        <div className="hd_legend_text">
                          <span className="hd_legend_name">{cliente.Name}</span>
                          <span className="hd_legend_value">{percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Contenido Principal */}
        <main className="hd_main_content">
          {/* Ventas Section */}
          <section className="hd_ventas_section">
            <div className="hd_section_header">
              <h3>
                <DollarSign size={16} />
                Análisis de Ventas
              </h3>
              <div className="hd_section_actions">
                {loading.ventas && <Loader className="hd_spinner" size={14} />}
                <button onClick={refreshVentas} className="hd_btn_refresh_section" title="Actualizar ventas">
                  <RefreshCw size={12} />
                </button>
              </div>
            </div>

            {totalVentas ? (
              <div className="hd_ventas_content">
                <div className="hd_ventas_cards">
                  <div className="hd_venta_card hd_venta_actual">
                    <div className="hd_venta_header">
                      <h4>Período Actual</h4>
                      <span className="hd_venta_periodo">
                        {formatDate(totalVentas.FechaInicioActual)} - {formatDate(totalVentas.FechaFinActual)}
                      </span>
                    </div>
                    <div className="hd_venta_valor">{formatCurrency(totalVentas.VentasActual)}</div>
                    <div className="hd_venta_info">
                      <Info size={12} />
                      <span>Click en las barras para más detalles</span>
                    </div>
                  </div>

                  <div className="hd_venta_card hd_venta_anterior">
                    <div className="hd_venta_header">
                      <h4>Período Anterior</h4>
                      <span className="hd_venta_periodo">
                        {formatDate(totalVentas.FechaInicioAnterior)} - {formatDate(totalVentas.FechaFinAnterior)}
                      </span>
                    </div>
                    <div className="hd_venta_valor">{formatCurrency(totalVentas.VentasPeriodoAnterior)}</div>
                    <div className="hd_venta_info">
                      <Clock size={12} />
                      <span>Período de comparación</span>
                    </div>
                  </div>

                  <div className="hd_venta_card hd_venta_crecimiento">
                    <div className="hd_venta_header">
                      <h4>Crecimiento</h4>
                      <div
                        className="hd_crecimiento_icon"
                        style={{ color: getCrecimientoColor(totalVentas.PorcentajeCrecimiento) }}
                      >
                        {getCrecimientoIcon(totalVentas.PorcentajeCrecimiento)}
                      </div>
                    </div>
                    <div
                      className="hd_venta_valor"
                      style={{ color: getCrecimientoColor(totalVentas.PorcentajeCrecimiento) }}
                    >
                      {totalVentas.PorcentajeCrecimiento !== null
                        ? `${totalVentas.PorcentajeCrecimiento.toFixed(1)}%`
                        : "N/A"}
                    </div>
                    <div className="hd_venta_info">
                      <Activity size={12} />
                      <span>Comparado con período anterior</span>
                    </div>
                  </div>
                </div>

                {/* Gráfico de Comparación */}
                <div className="hd_ventas_chart" ref={ventasChartRef}>
                  <h4>Comparación Visual</h4>
                  <div className="hd_comparison_chart">
                    <div className="hd_chart_bars">
                      <div
                        className="hd_bar_actual"
                        style={{
                          height: `${Math.max((totalVentas.VentasActual / Math.max(totalVentas.VentasActual, totalVentas.VentasPeriodoAnterior)) * 100, 10)}%`,
                        }}
                        onMouseEnter={(e) => handleVentasMouseEnter(e, "actual")}
                        onMouseLeave={handleVentasMouseLeave}
                      >
                        <span className="hd_bar_label">Actual</span>
                        <span className="hd_bar_value">{formatCurrency(totalVentas.VentasActual)}</span>
                      </div>
                      <div
                        className="hd_bar_anterior"
                        style={{
                          height: `${Math.max((totalVentas.VentasPeriodoAnterior / Math.max(totalVentas.VentasActual, totalVentas.VentasPeriodoAnterior)) * 100, 10)}%`,
                        }}
                        onMouseEnter={(e) => handleVentasMouseEnter(e, "anterior")}
                        onMouseLeave={handleVentasMouseLeave}
                      >
                        <span className="hd_bar_label">Anterior</span>
                        <span className="hd_bar_value">{formatCurrency(totalVentas.VentasPeriodoAnterior)}</span>
                      </div>
                    </div>
                  </div>

                  {ventasTooltip.visible && (
                    <div
                      className="hd_tooltip hd_enhanced_tooltip"
                      style={{
                        left: `${ventasTooltip.x}px`,
                        top: `${ventasTooltip.y - 80}px`,
                      }}
                    >
                      <div className="hd_tooltip_title">{ventasTooltip.content.title}</div>
                      <div className="hd_tooltip_value">{ventasTooltip.content.value}</div>
                      {ventasTooltip.content.extra && (
                        <div className="hd_tooltip_extra">{ventasTooltip.content.extra}</div>
                      )}
                      {ventasTooltip.content.details && (
                        <div className="hd_tooltip_details">
                          {ventasTooltip.content.details.map((detail, index) => (
                            <div key={index} className="hd_tooltip_detail_item">
                              {detail}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="hd_no_data">
                <BarChart3 size={24} />
                <span>No hay datos de ventas disponibles</span>
              </div>
            )}
          </section>

          {/* Bottom Grid */}
          <div className="hd_bottom_grid">
            {/* Productos Section */}
            <section className="hd_productos_section">
              <div className="hd_section_header">
                <h3>
                  <Award size={16} />
                  Top Productos
                </h3>
                <div className="hd_section_actions">
                  {loading.productos && <Loader className="hd_spinner" size={14} />}
                  <button onClick={refreshProductos} className="hd_btn_refresh_section" title="Actualizar productos">
                    <RefreshCw size={12} />
                  </button>
                </div>
              </div>

              {topProductos.length > 0 ? (
                <div className="hd_productos_content" ref={productosChartRef}>
                  <div className="hd_productos_chart">
                    {topProductos.slice(0, 5).map((producto, index) => {
                      const maxVentas = Math.max(...topProductos.map((p) => Math.abs(p.MontoTotalVentas)))
                      const percentage = (Math.abs(producto.MontoTotalVentas) / maxVentas) * 100

                      return (
                        <div
                          key={producto.ProductId}
                          className="hd_producto_bar"
                          onMouseEnter={(e) => handleProductoMouseEnter(e, producto, index)}
                          onMouseLeave={handleProductoMouseLeave}
                        >
                          <div className="hd_producto_info">
                            <span className="hd_producto_rank">#{index + 1}</span>
                            <span className="hd_producto_name">{producto.Name}</span>
                          </div>
                          <div className="hd_producto_bar_container">
                            <div
                              className={`hd_producto_bar_fill ${producto.MontoTotalVentas < 0 ? "hd_negative" : ""}`}
                              style={{
                                width: `${Math.max(percentage, 10)}%`,
                                animationDelay: `${index * 0.1}s`,
                              }}
                            >
                              <span className="hd_producto_value">{formatCurrency(producto.MontoTotalVentas)}</span>
                            </div>
                          </div>
                          <div className="hd_producto_cantidad">
                            <Package size={12} />
                            <span>{producto.CantidadVendida}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {productosTooltip.visible && (
                    <div
                      className="hd_tooltip hd_enhanced_tooltip"
                      style={{
                        left: `${productosTooltip.x}px`,
                        top: `${productosTooltip.y - 80}px`,
                      }}
                    >
                      <div className="hd_tooltip_title">{productosTooltip.content.title}</div>
                      <div className="hd_tooltip_value">{productosTooltip.content.value}</div>
                      {productosTooltip.content.extra && (
                        <div className="hd_tooltip_extra">{productosTooltip.content.extra}</div>
                      )}
                      {productosTooltip.content.details && (
                        <div className="hd_tooltip_details">
                          {productosTooltip.content.details.map((detail, index) => (
                            <div key={index} className="hd_tooltip_detail_item">
                              {detail}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="hd_no_data">
                  <Package size={24} />
                  <span>No hay datos de productos</span>
                </div>
              )}
            </section>

            {/* Repartidores Section */}
            <section className="hd_repartidores_section">
              <div className="hd_section_header">
                <h3>
                  <Truck size={16} />
                  Eficiencia Repartidores
                </h3>
                <div className="hd_section_actions">
                  {loading.repartidores && <Loader className="hd_spinner" size={14} />}
                  <button
                    onClick={refreshRepartidores}
                    className="hd_btn_refresh_section"
                    title="Actualizar repartidores"
                  >
                    <RefreshCw size={12} />
                  </button>
                </div>
              </div>

              {repartidoresEficientes.length > 0 ? (
                <div className="hd_repartidores_content">
                  {repartidoresEficientes.slice(0, 4).map((repartidor, index) => (
                    <div
                      key={repartidor.DeliveryId}
                      className="hd_repartidor_card"
                      onMouseEnter={(e) => handleRepartidorMouseEnter(e, repartidor)}
                      onMouseLeave={handleRepartidorMouseLeave}
                    >
                      <div className="hd_repartidor_info">
                        <h4 className="hd_repartidor_name">{repartidor.Name}</h4>
                        <div className="hd_repartidor_stats">
                          <span>
                            {repartidor.EntregasCompletadas}/{repartidor.TotalAsignados}
                          </span>
                        </div>
                      </div>
                      <div className="hd_eficiencia_circle">
                        <svg viewBox="0 0 36 36" className="hd_circular_chart">
                          <path
                            className="hd_circle_bg"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="hd_circle"
                            strokeDasharray={`${repartidor.EficienciaPorcentaje}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            style={{
                              stroke: getEficienciaColor(repartidor.EficienciaPorcentaje),
                              animationDelay: `${index * 0.2}s`,
                            }}
                          />
                        </svg>
                        <div
                          className="hd_percentage"
                          style={{ color: getEficienciaColor(repartidor.EficienciaPorcentaje) }}
                        >
                          {repartidor.EficienciaPorcentaje.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="hd_no_data">
                  <Truck size={24} />
                  <span>No hay datos de repartidores</span>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      {/* Tooltips globales */}
      {clienteTooltip.visible && (
        <div
          className="hd_tooltip hd_global_tooltip hd_enhanced_tooltip"
          style={{
            left: `${clienteTooltip.x}px`,
            top: `${clienteTooltip.y}px`,
          }}
        >
          <div className="hd_tooltip_title">{clienteTooltip.content.title}</div>
          <div className="hd_tooltip_value">{clienteTooltip.content.value}</div>
          {clienteTooltip.content.extra && <div className="hd_tooltip_extra">{clienteTooltip.content.extra}</div>}
          {clienteTooltip.content.details && (
            <div className="hd_tooltip_details">
              {clienteTooltip.content.details.map((detail, index) => (
                <div key={index} className="hd_tooltip_detail_item">
                  {detail}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {donutTooltip.visible && (
        <div
          className="hd_tooltip hd_enhanced_tooltip"
          style={{
            left: `${donutTooltip.x}px`,
            top: `${donutTooltip.y - 80}px`,
          }}
        >
          <div className="hd_tooltip_title">{donutTooltip.content.title}</div>
          <div className="hd_tooltip_value">{donutTooltip.content.value}</div>
          {donutTooltip.content.extra && <div className="hd_tooltip_extra">{donutTooltip.content.extra}</div>}
          {donutTooltip.content.details && (
            <div className="hd_tooltip_details">
              {donutTooltip.content.details.map((detail, index) => (
                <div key={index} className="hd_tooltip_detail_item">
                  {detail}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {repartidorTooltip.visible && (
        <div
          className="hd_tooltip hd_global_tooltip hd_enhanced_tooltip"
          style={{
            left: `${repartidorTooltip.x}px`,
            top: `${repartidorTooltip.y}px`,
          }}
        >
          <div className="hd_tooltip_title">{repartidorTooltip.content.title}</div>
          <div className="hd_tooltip_value">{repartidorTooltip.content.value}</div>
          {repartidorTooltip.content.extra && <div className="hd_tooltip_extra">{repartidorTooltip.content.extra}</div>}
          {repartidorTooltip.content.details && (
            <div className="hd_tooltip_details">
              {repartidorTooltip.content.details.map((detail, index) => (
                <div key={index} className="hd_tooltip_detail_item">
                  {detail}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
