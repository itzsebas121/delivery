import React from "react"
import type { ReactElement } from "react"
import { useState, useEffect, useCallback } from "react"
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Package,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  Power,
  PowerOff,
  CheckCircle,
  XCircle,
  Grid,
  List,
  DollarSign,
  Package2,
  Tag,
} from "lucide-react"
import { useAlert } from "../../../components/Alerts/Alert-system"
import "./Products.css"
import { baseURLRest } from "../../../config"

interface Product {
  ProductId?: number
  ProductName: string
  Description: string
  Price: number
  Stock: number
  ImageURL: string
  CategoryId?: number
  CategoryName?: string
  isAvailable?: boolean
}

interface Category {
  CategoryId: number
  CategoryName: string
}

interface ProductsResponse {
  total: number
  products: Product[]
}

// Componente de imagen con lazy loading y placeholder mejorado
const LazyImage = ({
  src,
  alt,
  className,
  placeholder,
}: { src: string; alt: string; className: string; placeholder?: string }) => {
  const [imageSrc, setImageSrc] = useState<string>(placeholder || "")
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [_hasError, setHasError] = useState(false)

  const imgCallbackRef = useCallback(
    (imgElement: HTMLImageElement | null) => {
      if (imageRef) {
        imageRef.onload = null
        imageRef.onerror = null
      }
      if (imgElement) {
        setImageRef(imgElement)
        if (src && src !== placeholder) {
          imgElement.onload = () => {
            setIsLoaded(true)
            setImageSrc(src)
          }
          imgElement.onerror = () => {
            setHasError(true)
            setImageSrc(placeholder || "/placeholder.svg?height=200&width=300")
          }
          const observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  imgElement.src = src
                  observer.unobserve(imgElement)
                }
              })
            },
            { threshold: 0.1 },
          )
          observer.observe(imgElement)
        }
      }
    },
    [src, imageRef, placeholder],
  )

  const generatePlaceholder = () => {
    const colors = [
      "var(--primary-orange)",
      "var(--primary-red)",
      "var(--primary-yellow)",
      "var(--accent-green)",
      "var(--info)",
      "var(--primary-brown)",
    ]
    const color = colors[alt.length % colors.length]
    const initials = alt
      .split(" ")
      .map((word) => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()

    return (
      <div className={`image-placeholder-pdp ${className}`} style={{ backgroundColor: color }}>
        <span className="placeholder-text-pdp">{initials}</span>
      </div>
    )
  }

  // Solo mostrar iniciales si no hay src o src es null/vacío
  if (!src || src.trim() === "") {
    return generatePlaceholder()
  }

  // Si hay error al cargar pero sí hay URL, mostrar imagen placeholder normal
  return (
    <img
      ref={imgCallbackRef}
      src={imageSrc || "/placeholder.svg"}
      alt={alt}
      className={`${className} ${isLoaded ? "loaded-pdp" : "loading-pdp"}`}
    />
  )
}

// Skeleton loader para cards
const CardSkeleton = () => (
  <div className="product-card-skeleton-pdp">
    <div className="skeleton-image-pdp"></div>
    <div className="skeleton-content-pdp">
      <div className="skeleton-title-pdp"></div>
      <div className="skeleton-description-pdp"></div>
      <div className="skeleton-category-pdp"></div>
      <div className="skeleton-stats-pdp">
        <div className="skeleton-price-pdp"></div>
        <div className="skeleton-stock-pdp"></div>
      </div>
      <div className="skeleton-actions-pdp">
        <div className="skeleton-button-pdp"></div>
        <div className="skeleton-button-pdp"></div>
        <div className="skeleton-button-pdp"></div>
      </div>
    </div>
  </div>
)

// Skeleton loader para tabla
const TableSkeleton = () => (
  <div className="table-skeleton-pdp">
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="skeleton-row-pdp">
        <div className="skeleton-cell-pdp skeleton-id-pdp"></div>
        <div className="skeleton-cell-pdp skeleton-product-pdp">
          <div className="skeleton-image-small-pdp"></div>
          <div className="skeleton-text-pdp"></div>
        </div>
        <div className="skeleton-cell-pdp skeleton-description-pdp"></div>
        <div className="skeleton-cell-pdp skeleton-category-pdp"></div>
        <div className="skeleton-cell-pdp skeleton-price-pdp"></div>
        <div className="skeleton-cell-pdp skeleton-stock-pdp"></div>
        <div className="skeleton-cell-pdp skeleton-status-pdp"></div>
        <div className="skeleton-cell-pdp skeleton-actions-pdp">
          <div className="skeleton-button-small-pdp"></div>
          <div className="skeleton-button-small-pdp"></div>
          <div className="skeleton-button-small-pdp"></div>
        </div>
      </div>
    ))}
  </div>
)

const ProductsDistributor = (): ReactElement => {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")

  // Paginación mejorada
  const [page, setPage] = useState(1)
  const [limit] = useState(12)
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Filtros
  const [nameFilter, setNameFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("view")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState<Product>({
    ProductName: "",
    Description: "",
    Price: 0,
    Stock: 0,
    ImageURL: "",
    CategoryId: 0,
  })

  const { showSuccess, showError, showConfirm } = useAlert()

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [page, nameFilter, categoryFilter])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        name: nameFilter,
        category: categoryFilter,
        role: "distributor",
      })
      const response = await fetch(`${baseURLRest}/products?${params}`)
      if (!response.ok) throw new Error("Error al cargar productos")
      const data: ProductsResponse = await response.json()
      setProducts(data.products)
      setTotalProducts(data.total)
      setTotalPages(Math.ceil(data.total / limit))
    } catch (err) {
      showError("Error", "No se pudieron cargar los productos")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${baseURLRest}/categories`)
      if (!response.ok) throw new Error("Error al cargar categorías")
      const data = await response.json()
      setCategories(data)
    } catch (err) {
      console.error("Error al cargar categorías:", err)
    }
  }

  // Función para habilitar producto
  const handleEnableProduct = async (product: Product) => {
    if (!product.ProductId) return
    setActionLoading(product.ProductId)
    try {
      const response = await fetch(`${baseURLRest}/products/${product.ProductId}/enable`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      })
      if (!response.ok) throw new Error("Error al habilitar producto")
      const data = await response.json()
      showSuccess("Producto habilitado", data.message || "El producto se ha habilitado correctamente")
      fetchProducts()
    } catch (err: any) {
      showError("Error", err.message || "No se pudo habilitar el producto")
    } finally {
      setActionLoading(null)
    }
  }

  // Función para deshabilitar producto
  const handleDisableProduct = (product: Product) => {
    showConfirm(
      "Deshabilitar producto",
      `¿Estás seguro de que deseas deshabilitar "${product.ProductName}"?`,
      async () => {
        if (!product.ProductId) return
        setActionLoading(product.ProductId)
        try {
          const response = await fetch(`${baseURLRest}/products/${product.ProductId}/disable`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
          })
          if (!response.ok) throw new Error("Error al deshabilitar producto")
          const data = await response.json()
          showSuccess("Producto deshabilitado", data.message || "El producto se ha deshabilitado correctamente")
          fetchProducts()
        } catch (err: any) {
          showError("Error", err.message || "No se pudo deshabilitar el producto")
        } finally {
          setActionLoading(null)
        }
      },
    )
  }

  const handleCreateProduct = async () => {
    if (!validateForm()) return
    try {
      const response = await fetch(`${baseURLRest}/create-products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Name: formData.ProductName,
          Description: formData.Description,
          Price: formData.Price,
          Stock: formData.Stock,
          ImageURL: formData.ImageURL,
          CategoryId: formData.CategoryId,
        }),
      })
      if (!response.ok) throw new Error("Error al crear producto")
      showSuccess("Producto creado", "El producto se ha creado exitosamente")
      closeModal()
      fetchProducts()
    } catch (err) {
      showError("Error", "No se pudo crear el producto")
    }
  }

  const validateForm = () => {
    if (
      !formData.ProductName ||
      !formData.Description ||
      !formData.Price ||
      !formData.Stock ||
      !formData.ImageURL ||
      !formData.CategoryId
    ) {
      showError("Error", "Por favor, complete todos los campos")
      return false
    }
    if (formData.Price <= 0) {
      showError("Error", "El precio debe ser mayor que cero")
      return false
    }
    if (formData.Stock <= 0) {
      showError("Error", "El stock debe ser mayor que cero")
      return false
    }
    return true
  }

  const handleUpdateProduct = async () => {
    if (!selectedProduct?.ProductId) return
    if (!validateForm()) return
    try {
      const response = await fetch(`${baseURLRest}/products`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ProductId: selectedProduct.ProductId,
          Name: formData.ProductName,
          Description: formData.Description,
          Price: formData.Price,
          Stock: formData.Stock,
          ImageURL: formData.ImageURL,
          CategoryId: formData.CategoryId,
        }),
      })
      if (!response.ok) throw new Error("Error al actualizar producto")
      showSuccess("Producto actualizado", "Los cambios se han guardado exitosamente")
      closeModal()
      fetchProducts()
    } catch (err) {
      showError("Error", "No se pudo actualizar el producto")
    }
  }

  const handleDeleteProduct = (product: Product) => {
    showConfirm("Eliminar producto", `¿Estás seguro de que deseas eliminar "${product.ProductName}"?`, async () => {
      try {
        const response = await fetch(`${baseURLRest}/products/${product.ProductId}`, {
          method: "DELETE",
        })
        const data = await response.json()
        if (data.ERROR) {
          showError("Error al eliminar", data.ERROR)
          return
        }
        showSuccess("Producto eliminado", data.message || "El producto se ha eliminado exitosamente")
        fetchProducts()
      } catch (err: any) {
        showError("Error", err.message || "No se pudo eliminar el producto")
      }
    })
  }

  const openModal = (mode: "view" | "edit" | "create", product?: Product) => {
    setModalMode(mode)
    setSelectedProduct(product || null)
    if (product) {
      setFormData({
        ProductName: product.ProductName,
        Description: product.Description,
        Price: product.Price,
        Stock: product.Stock,
        ImageURL: product.ImageURL,
        CategoryId: product.CategoryId || 0,
      })
    } else {
      setFormData({
        ProductName: "",
        Description: "",
        Price: 0,
        Stock: 0,
        ImageURL: "",
        CategoryId: 0,
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedProduct(null)
    setModalMode("view")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "Price" || name === "Stock" || name === "CategoryId" ? Number(value) : value,
    }))
  }

  const getCategoryName = (categoryId?: number) => {
    if (!categoryId) return "Sin categoría"
    const category = categories.find((cat) => cat.CategoryId === categoryId)
    return category?.CategoryName || "Sin categoría"
  }

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

  // Componente de Card de Producto
  const ProductCard = ({ product }: { product: Product }) => (
    <div className={`product-card-pdp ${!product.isAvailable ? "product-disabled-pdp" : ""}`}>
      <div className="product-image-container-pdp">
        <LazyImage
          src={product.ImageURL}
          alt={product.ProductName}
          className="product-image-pdp"
          placeholder="/placeholder.svg?height=200&width=300"
        />
        <div className="product-status-overlay-pdp">
          {product.isAvailable ? (
            <span className="status-badge-pdp status-active-pdp">
              <CheckCircle size={14} />
              Activo
            </span>
          ) : (
            <span className="status-badge-pdp status-inactive-pdp">
              <XCircle size={14} />
              Inactivo
            </span>
          )}
        </div>
      </div>

      <div className="product-content-pdp">
        <div className="product-header-pdp">
          <h3 className="product-name-pdp">{product.ProductName}</h3>
          <span className="product-id-pdp">#{product.ProductId}</span>
        </div>

        <p className="product-description-pdp">{product.Description}</p>

        <div className="product-category-pdp">
          <Tag size={14} />
          <span className="category-badge-pdp">{getCategoryName(product.CategoryId)}</span>
        </div>

        <div className="product-stats-pdp">
          <div className="stat-item-pdp">
            <DollarSign size={16} />
            <span className="price-pdp">${product.Price.toFixed(2)}</span>
          </div>
          <div className="stat-item-pdp">
            <Package2 size={16} />
            <span className={`stock-pdp ${product.Stock < 10 ? "low-stock-pdp" : ""}`}>{product.Stock} unidades</span>
          </div>
        </div>

        <div className="product-actions-pdp">
          <button
            className="btn-action-pdp btn-view-pdp"
            onClick={() => openModal("view", product)}
            title="Ver detalles"
          >
            <Eye size={16} />
          </button>
          <button className="btn-action-pdp btn-edit-pdp" onClick={() => openModal("edit", product)} title="Editar">
            <Edit size={16} />
          </button>
          {product.isAvailable ? (
            <button
              className="btn-action-pdp btn-disable-pdp"
              onClick={() => handleDisableProduct(product)}
              title="Deshabilitar"
              disabled={actionLoading === product.ProductId}
            >
              {actionLoading === product.ProductId ? (
                <div className="loading-spinner-small-pdp"></div>
              ) : (
                <PowerOff size={16} />
              )}
            </button>
          ) : (
            <button
              className="btn-action-pdp btn-enable-pdp"
              onClick={() => handleEnableProduct(product)}
              title="Habilitar"
              disabled={actionLoading === product.ProductId}
            >
              {actionLoading === product.ProductId ? (
                <div className="loading-spinner-small-pdp"></div>
              ) : (
                <Power size={16} />
              )}
            </button>
          )}
          <button
            className="btn-action-pdp btn-delete-pdp"
            onClick={() => handleDeleteProduct(product)}
            title="Eliminar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="products-admin-pdp">
      {/* Header mejorado */}
      <div className="admin-header-pdp">
        <div className="header-content-pdp">
          <div className="header-info-pdp">
            <div className="header-title-pdp">
              <Package size={28} className="header-icon-pdp" />
              <div>
                <h1>Gestión de Productos</h1>
                <span className="product-count-pdp">{totalProducts} productos en total</span>
              </div>
            </div>
          </div>
          <div className="header-actions-pdp">
            <div className="view-toggle-pdp">
              <button
                className={`view-btn-pdp ${viewMode === "grid" ? "active-pdp" : ""}`}
                onClick={() => setViewMode("grid")}
                title="Vista de tarjetas"
              >
                <Grid size={18} />
              </button>
              <button
                className={`view-btn-pdp ${viewMode === "table" ? "active-pdp" : ""}`}
                onClick={() => setViewMode("table")}
                title="Vista de tabla"
              >
                <List size={18} />
              </button>
            </div>
            <button className="btn-primary-pdp" onClick={() => openModal("create")}>
              <Plus size={20} />
              <span>Nuevo Producto</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filtros mejorados */}
      <div className="filters-section-pdp">
        <div className="filters-container-pdp">
          <div className="search-filter-pdp">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre, descripción..."
              value={nameFilter}
              onChange={(e) => {
                setNameFilter(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <div className="category-filter-pdp">
            <Filter size={18} />
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setPage(1)
              }}
            >
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category.CategoryId} value={category.CategoryName}>
                  {category.CategoryName}
                </option>
              ))}
            </select>
          </div>
          {(nameFilter || categoryFilter) && (
            <button
              className="btn-clear-pdp"
              onClick={() => {
                setNameFilter("")
                setCategoryFilter("")
                setPage(1)
              }}
            >
              <X size={16} />
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="content-section-pdp">
        {loading ? (
          viewMode === "grid" ? (
            <div className="products-grid-pdp">
              {Array.from({ length: 8 }).map((_, index) => (
                <CardSkeleton key={index} />
              ))}
            </div>
          ) : (
            <TableSkeleton />
          )
        ) : viewMode === "grid" ? (
          <div className="products-grid-pdp">
            {products.map((product) => (
              <ProductCard key={product.ProductId} product={product} />
            ))}
          </div>
        ) : (
          <div className="table-section-pdp">
            <div className="table-container-pdp">
              <table className="products-table-pdp">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Producto</th>
                    <th className="hide-mobile-pdp">Descripción</th>
                    <th>Categoría</th>
                    <th>Precio</th>
                    <th className="hide-mobile-pdp">Stock</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.ProductId} className={!product.isAvailable ? "product-disabled-pdp" : ""}>
                      <td>
                        <span className="product-id-table-pdp">#{product.ProductId}</span>
                      </td>
                      <td>
                        <div className="product-info-table-pdp">
                          <LazyImage
                            src={product.ImageURL}
                            alt={product.ProductName}
                            className="product-thumb-pdp"
                            placeholder="/placeholder.svg?height=40&width=40"
                          />
                          <div className="product-details-table-pdp">
                            <span className="product-name-table-pdp">{product.ProductName}</span>
                            <span className="product-mobile-info-pdp hide-desktop-pdp">
                              ${product.Price.toFixed(2)} • Stock: {product.Stock}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="description-cell-pdp hide-mobile-pdp">{product.Description}</td>
                      <td>
                        <span className="category-badge-table-pdp">{getCategoryName(product.CategoryId)}</span>
                      </td>
                      <td className="price-cell-pdp hide-mobile-pdp">${product.Price.toFixed(2)}</td>
                      <td className={`stock-cell-pdp hide-mobile-pdp ${product.Stock < 10 ? "low-stock-pdp" : ""}`}>
                        {product.Stock}
                      </td>
                      <td>
                        <div className="status-cell-pdp">
                          {product.isAvailable ? (
                            <span className="status-badge-pdp status-active-pdp">
                              <CheckCircle size={14} />
                              Activo
                            </span>
                          ) : (
                            <span className="status-badge-pdp status-inactive-pdp">
                              <XCircle size={14} />
                              Inactivo
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="actions-cell-pdp">
                          <button
                            className="btn-action-pdp btn-view-pdp"
                            onClick={() => openModal("view", product)}
                            title="Ver detalles"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="btn-action-pdp btn-edit-pdp"
                            onClick={() => openModal("edit", product)}
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          {product.isAvailable ? (
                            <button
                              className="btn-action-pdp btn-disable-pdp"
                              onClick={() => handleDisableProduct(product)}
                              title="Deshabilitar"
                              disabled={actionLoading === product.ProductId}
                            >
                              {actionLoading === product.ProductId ? (
                                <div className="loading-spinner-small-pdp"></div>
                              ) : (
                                <PowerOff size={16} />
                              )}
                            </button>
                          ) : (
                            <button
                              className="btn-action-pdp btn-enable-pdp"
                              onClick={() => handleEnableProduct(product)}
                              title="Habilitar"
                              disabled={actionLoading === product.ProductId}
                            >
                              {actionLoading === product.ProductId ? (
                                <div className="loading-spinner-small-pdp"></div>
                              ) : (
                                <Power size={16} />
                              )}
                            </button>
                          )}
                          <button
                            className="btn-action-pdp btn-delete-pdp"
                            onClick={() => handleDeleteProduct(product)}
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="empty-state-pdp">
            <Package size={64} />
            <h3>No hay productos</h3>
            <p>No se encontraron productos con los filtros seleccionados</p>
            <button className="btn-primary-pdp" onClick={() => openModal("create")}>
              <Plus size={18} />
              Crear primer producto
            </button>
          </div>
        )}
      </div>

      {/* Paginación mejorada */}
      {!loading && totalPages > 1 && (
        <div className="pagination-section-pdp">
          <button
            className="pagination-btn-pdp nav-btn-pdp"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            title="Página anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="page-numbers-pdp">
            {getPageNumbers().map((pageNum, index) => (
              <React.Fragment key={index}>
                {pageNum === "..." ? (
                  <span className="page-ellipsis-pdp">...</span>
                ) : (
                  <button
                    className={`page-btn-pdp ${page === pageNum ? "active-pdp" : ""}`}
                    onClick={() => handlePageChange(pageNum as number)}
                  >
                    {pageNum}
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>
          <button
            className="pagination-btn-pdp nav-btn-pdp"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            title="Página siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Modal mejorado */}
      {showModal && (
        <div className="modal-overlay-pdp" onClick={closeModal}>
          <div className="modal-container-pdp" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-pdp">
              <h2>
                {modalMode === "create" && "Crear Nuevo Producto"}
                {modalMode === "edit" && "Editar Producto"}
                {modalMode === "view" && "Detalles del Producto"}
              </h2>
              <button className="modal-close-pdp" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-content-pdp">
              {modalMode === "view" ? (
                <div className="product-details-pdp">
                  <div className="detail-image-pdp">
                    <LazyImage
                      src={selectedProduct?.ImageURL || ""}
                      alt={selectedProduct?.ProductName || "Producto"}
                      className="detail-img-pdp"
                      placeholder="/placeholder.svg?height=200&width=300"
                    />
                    {selectedProduct?.isAvailable ? (
                      <div className="detail-status-pdp status-active-pdp">
                        <CheckCircle size={16} />
                        Producto Activo
                      </div>
                    ) : (
                      <div className="detail-status-pdp status-inactive-pdp">
                        <XCircle size={16} />
                        Producto Inactivo
                      </div>
                    )}
                  </div>
                  <div className="detail-info-pdp">
                    <h3>{selectedProduct?.ProductName}</h3>
                    <p className="detail-description-pdp">{selectedProduct?.Description}</p>
                    <div className="detail-grid-pdp">
                      <div className="detail-item-pdp">
                        <label>Categoría:</label>
                        <span className="category-badge-pdp">{getCategoryName(selectedProduct?.CategoryId)}</span>
                      </div>
                      <div className="detail-item-pdp">
                        <label>Precio:</label>
                        <span className="price-pdp">${selectedProduct?.Price.toFixed(2)}</span>
                      </div>
                      <div className="detail-item-pdp">
                        <label>Stock:</label>
                        <span className={selectedProduct && selectedProduct.Stock < 10 ? "low-stock-pdp" : ""}>
                          {selectedProduct?.Stock} unidades
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form className="product-form-pdp">
                  <div className="form-grid-pdp">
                    <div className="form-group-pdp">
                      <label>Nombre del producto *</label>
                      <input
                        type="text"
                        name="ProductName"
                        value={formData.ProductName}
                        onChange={handleInputChange}
                        placeholder="Ej: Pizza Margherita, Hamburguesa BBQ..."
                        required
                      />
                    </div>
                    <div className="form-group-pdp">
                      <label>Categoría *</label>
                      <select name="CategoryId" value={formData.CategoryId} onChange={handleInputChange} required>
                        <option value={0}>Seleccionar categoría...</option>
                        {categories.map((category) => (
                          <option key={category.CategoryId} value={category.CategoryId}>
                            {category.CategoryName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group-pdp full-width-pdp">
                      <label>Descripción *</label>
                      <textarea
                        name="Description"
                        value={formData.Description}
                        onChange={handleInputChange}
                        placeholder="Describe los ingredientes, sabores y características especiales del producto..."
                        rows={3}
                        required
                      />
                    </div>
                    <div className="form-group-pdp">
                      <label>Precio ($) *</label>
                      <input
                        type="number"
                        name="Price"
                        value={formData.Price}
                        onChange={handleInputChange}
                        placeholder="15.99"
                        step="0.01"
                        min="0"
                        required
                      />
                    </div>
                    <div className="form-group-pdp">
                      <label>Stock disponible *</label>
                      <input
                        type="number"
                        name="Stock"
                        value={formData.Stock}
                        onChange={handleInputChange}
                        placeholder="50"
                        min="0"
                        required
                      />
                    </div>
                    <div className="form-group-pdp full-width-pdp">
                      <label>URL de imagen *</label>
                      <input
                        type="url"
                        name="ImageURL"
                        value={formData.ImageURL}
                        onChange={handleInputChange}
                        placeholder="https://ejemplo.com/imagen-del-producto.jpg"
                        required
                      />
                    </div>
                  </div>
                </form>
              )}
            </div>
            <div className="modal-footer-pdp">
              {modalMode === "view" ? (
                <button className="btn-secondary-pdp" onClick={closeModal}>
                  Cerrar
                </button>
              ) : (
                <>
                  <button className="btn-secondary-pdp" onClick={closeModal}>
                    Cancelar
                  </button>
                  <button
                    className="btn-primary-pdp"
                    onClick={modalMode === "create" ? handleCreateProduct : handleUpdateProduct}
                  >
                    <Save size={18} />
                    {modalMode === "create" ? "Crear Producto" : "Guardar Cambios"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductsDistributor
