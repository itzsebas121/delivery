"use client"
import { useState, useRef, useEffect } from "react"
import { Search, Filter, ChevronLeft, ChevronRight, Grid, List, Package } from "lucide-react"
import { baseURLRest } from "../../../config"
import ProductCard from "../../../components/ProductCard"
import "./Product.css"
import { useAuth } from "../../../context/Authcontext"

const Product = () => {
  const { user, loading } = useAuth()
  const clienteId = user?.rol === "Client" && "clientId" in user ? (user as any).clientId : 0;

  const [products, setProducts] = useState<any[]>([])
  const [loadingp, setLoadingp] = useState<boolean>(false)
  const [page, setPage] = useState<number>(1)
  const [limit] = useState<number>(12)
  const [nameFilter, setNameFilter] = useState<string>("")
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [addedProductId, setAddedProductId] = useState<(number) | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
    const fetchProducts = async () => {
      setLoadingp(true)
      try {
        // Simular delay mínimo para mostrar skeleton
        const [response] = await Promise.all([
          fetch(
            `${baseURLRest}/products?${new URLSearchParams({
              page: page.toString(),
              limit: limit.toString(),
              name: nameFilter,
              category: categoryFilter,
            }).toString()}`,
          ),
          new Promise((resolve) => setTimeout(resolve, 300)),
        ])

        const data = await response.json()
        setProducts(data)
      } catch (error) {
        console.error("Error al obtener productos:", error)
      } finally {
        setLoadingp(false)
      }
    }
    if (loading) return
    fetchProducts()
  }, [page, limit, nameFilter, categoryFilter, clienteId])

  useEffect(() => {
    if (addedProductId) {
      const timer = setTimeout(() => {
        setAddedProductId(null)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [addedProductId])
  if (loading) {
    return <div className="loading-spinner">Cargando...</div>
  }

  const handleAddToCart = async (product: any) => {
    try {
      setAddedProductId(product.ProductId)

      const res = await fetch(`${baseURLRest}/cart-add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ClientId: clienteId,
          ProductId: product.ProductId,
          Quantity: 1,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Error al agregar al carrito")
    } catch (err) {
      console.error(err)
      alert("Error al añadir el producto al carrito")
    }
  }

  const SkeletonCard = () => (
    <div className="product-card-compact skeleton">
      <div className="product-image-container">
        <div className="product-skeleton"></div>
      </div>
      <div className="product-content">
        <div className="skeleton-line skeleton-title"></div>
        <div className="skeleton-line skeleton-description"></div>
        <div className="skeleton-line skeleton-description short"></div>
        <div className="product-footer">
          <div className="skeleton-line skeleton-price"></div>
          <div className="skeleton-line skeleton-button"></div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="product-container-compact">
      {/* Header compacto */}
      <div ref={gridRef} className="product-header-compact">
        <div className="product-title-section">
          <h1 className="product-title-compact">Productos</h1>
          <span className="product-count">{products.length} productos</span>
        </div>

        <div className="product-controls">
          <div className="product-filters-compact">
            <div className="filter-input">
              <Search size={16} />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={nameFilter}
                onChange={(e) => {
                  setNameFilter(e.target.value)
                  setPage(1)
                }}
              />
            </div>

            <div className="filter-input">
              <Filter size={16} />
              <input
                type="text"
                placeholder="Categoría..."
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value)
                  setPage(1)
                }}
              />
            </div>
          </div>

          <div className="view-toggle">
            <button className={`view-btn ${viewMode === "grid" ? "active" : ""}`} onClick={() => setViewMode("grid")}>
              <Grid size={16} />
            </button>
            <button className={`view-btn ${viewMode === "list" ? "active" : ""}`} onClick={() => setViewMode("list")}>
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid de productos */}
      <div  className={`product-grid-compact ${viewMode}`} id="product-grid-compact">
        {loadingp ? (
          Array.from({ length: 8 }).map((_, index) => <SkeletonCard key={index} />)
        ) : products.length > 0 ? (
          products.map((product: any) => (
            <div
              key={product.ProductId}
              className={`product-wrapper ${addedProductId === product.ProductId ? "added" : ""}`}
            >
              <ProductCard
                productId={product.ProductId}
                productName={product.ProductName}
                description={product.Description}
                price={product.Price}
                imageURL={product.ImageURL}
                categoryName={product.CategoryName}
                onAddToCart={handleAddToCart}
              />
            </div>
          ))
        ) : (
          <div className="product-empty-compact">
            <Package size={48} />
            <h3>No hay productos</h3>
            <p>No se encontraron productos con los filtros seleccionados</p>
          </div>
        )}
      </div>

      {/* Paginación compacta */}
      {!loading && products.length > 0 && (
        <div className="paginationp-compact">
          <button className="paginationp-btn" onClick={() => setPage(page - 1)} disabled={page === 1}>
            <ChevronLeft size={16} />
          </button>

          <span className="paginationp-info">{page}</span>

          <button className="paginationp-btn" onClick={() => setPage(page + 1)} disabled={products.length < limit}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

export default Product
