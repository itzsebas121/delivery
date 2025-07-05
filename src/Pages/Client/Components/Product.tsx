"use client"
import { useState, useRef, useEffect } from "react"
import React from "react"
import { Search, Filter, ChevronLeft, ChevronRight, Package, ChevronDown } from "lucide-react"
import { baseURLRest } from "../../../config"
import ProductCard from "../../../components/ProductCard"
import "./Product.css"
import { useAuth } from "../../../context/Authcontext"

interface ProductsResponse {
  total: number
  products: any[]
}

interface Category {
  CategoryId: number
  CategoryName: string
}

const Product = () => {
  const { user, loading } = useAuth()
  const clienteId = user?.rol === "Client" && "clientId" in user ? (user as any).clientId : 0

  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingp, setLoadingp] = useState<boolean>(false)
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true)

  const [page, setPage] = useState<number>(1)
  const [limit] = useState<number>(12)
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Filtros
  const [nameFilter, setNameFilter] = useState<string>("")
  const [categoryFilter, setCategoryFilter] = useState<string>("") // Ahora guarda CategoryName
  const [showCategoryDropdown, setShowCategoryDropdown] = useState<boolean>(false)

  // UI Estados
  const [addedProductId, setAddedProductId] = useState<number | null>(null)

  // Referencias
  const containerRef = useRef<HTMLDivElement>(null)
  const categoryDropdownRef = useRef<HTMLDivElement>(null)

  // Cargar categorías al montar el componente
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true)
        const response = await fetch(`https://api-rest-delivery.vercel.app/categories`)
        const data = await response.json()
        setCategories(data || []) // Las categorías vienen directamente como array
      } catch (error) {
        console.error("Error al obtener categorías:", error)
      } finally {
        setLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  // Cargar productos
  useEffect(() => {
    if (loading) return

    const fetchProducts = async () => {
      setLoadingp(true)
      try {
        const response = await fetch(
          `${baseURLRest}/products?${new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            name: nameFilter,
            category: categoryFilter, // Envía CategoryName
            role: "client",
          }).toString()}`,
        )
        const data: ProductsResponse = await response.json()
        setProducts(data.products)
        setTotalProducts(data.total)
        setTotalPages(Math.ceil(data.total / limit))
      } catch (error) {
        console.error("Error al obtener productos:", error)
      } finally {
        setLoadingp(false)
      }
    }

    fetchProducts()
  }, [page, limit, nameFilter, categoryFilter, clienteId, loading])

  // Scroll al top cuando cambie la página
  useEffect(() => {
    if (containerRef.current && page > 1) {
      containerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }, [page])


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Limpiar animación de producto agregado
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

  const handleCategorySelect = (category: Category | null) => {
    if (category) {
      setCategoryFilter(category.CategoryName) // Enviar CategoryName
    } else {
      setCategoryFilter("")
    }
    setPage(1)
    setShowCategoryDropdown(false)
  }

  const getSelectedCategoryName = () => {
    if (!categoryFilter) return "Todas las categorías"
    const category = categories.find((cat) => cat.CategoryName === categoryFilter)
    return category ? category.CategoryName : "Categoría seleccionada"
  }

  // Función para generar los números de página a mostrar
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(totalPages)
      } else if (page >= totalPages - 2) {
        pages.push(1)
        pages.push("...")
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push("...")
        for (let i = page - 1; i <= page + 1; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(totalPages)
      }
    }
    return pages
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      setPage(newPage)
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
    <div className="product-container-compact" ref={containerRef}>
      {/* Header compacto */}
      <div className="product-header-compact">
        <div className="product-title-section">
          <h1 className="product-title-compact">Productos</h1>
          <span className="product-count">{totalProducts} productos en total</span>
        </div>
        <div className="product-controls">
          <div className="product-filters-compact">
            {/* Filtro por nombre */}
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

            <div className="filter-dropdown" ref={categoryDropdownRef}>
              <div className="filter-dropdown-trigger" onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}>
                <Filter size={16} />
                <span>{getSelectedCategoryName()}</span>
                <ChevronDown size={16} className={`dropdown-icon ${showCategoryDropdown ? "rotated" : ""}`} />
              </div>

              {showCategoryDropdown && (
                <div className="filter-dropdown-content">
                  <div
                    className={`dropdown-option ${!categoryFilter ? "selected" : ""}`}
                    onClick={() => handleCategorySelect(null)}
                  >
                    Todas las categorías
                  </div>
                  {loadingCategories ? (
                    <div className="dropdown-option disabled">Cargando categorías...</div>
                  ) : (
                    categories.map((category) => (
                      <div
                        key={category.CategoryId}
                        className={`dropdown-option ${categoryFilter === category.CategoryName ? "selected" : ""}`}
                        onClick={() => handleCategorySelect(category)}
                      >
                        {category.CategoryName}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Grid de productos */}
      <div className={`product-grid-compact grid`} id="product-grid-compact">
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

      {/* Paginación mejorada */}
      {!loadingp && totalPages > 1 && (
        <div className="pagination-section">
          <button className="pagination-btn nav-btn" onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
            <ChevronLeft size={16} />
          </button>

          <div className="page-numbers">
            {getPageNumbers().map((pageNum, index) => (
              <React.Fragment key={index}>
                {typeof pageNum === "number" ? (
                  <button
                    className={`page-btn ${page === pageNum ? "active" : ""}`}
                    onClick={() => handlePageChange(pageNum as number)}
                  >
                    {pageNum}
                  </button>
                ) : (
                  <span className="page-ellipsis">{pageNum}</span>
                )}
              </React.Fragment>
            ))}
          </div>

          <button
            className="pagination-btn nav-btn"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
export default Product
