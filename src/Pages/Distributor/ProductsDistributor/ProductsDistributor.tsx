"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Search, Filter, Plus, Eye, Edit, Trash2, Package, ChevronLeft, ChevronRight, X, Save } from "lucide-react"
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
}

interface Category {
  CategoryId: number
  CategoryName: string
}

// Componente de imagen con lazy loading y placeholder
const LazyImage = ({
  src,
  alt,
  className,
  placeholder,
}: { src: string; alt: string; className: string; placeholder?: string }) => {
  const [imageSrc, setImageSrc] = useState<string>(placeholder || "")
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

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
            setImageSrc(placeholder || "/placeholder.svg?height=40&width=40")
          }

          // Solo cargar si la imagen está en el viewport
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

  // Generar placeholder dinámico basado en el nombre
  const generatePlaceholder = () => {
    const colors = ["#ff6b35", "#e74c3c", "#f39c12", "#27ae60", "#3498db", "#9b59b6"]
    const color = colors[alt.length % colors.length]
    const initials = alt
      .split(" ")
      .map((word) => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()

    return (
      <div className={`image-placeholder ${className}`} style={{ backgroundColor: color }}>
        <span className="placeholder-text">{initials}</span>
      </div>
    )
  }

  if (hasError || !src) {
    return generatePlaceholder()
  }

  return (
    <img
      ref={imgCallbackRef}
      src={imageSrc || "/placeholder.svg"}
      alt={alt}
      className={`${className} ${isLoaded ? "loaded" : "loading"}`}
    />
  )
}

// Skeleton loader para la tabla
const TableSkeleton = () => (
  <div className="table-skeleton">
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="skeleton-row">
        <div className="skeleton-cell skeleton-id"></div>
        <div className="skeleton-cell skeleton-product">
          <div className="skeleton-image"></div>
          <div className="skeleton-text"></div>
        </div>
        <div className="skeleton-cell skeleton-description"></div>
        <div className="skeleton-cell skeleton-category"></div>
        <div className="skeleton-cell skeleton-price"></div>
        <div className="skeleton-cell skeleton-stock"></div>
        <div className="skeleton-cell skeleton-actions">
          <div className="skeleton-button"></div>
          <div className="skeleton-button"></div>
          <div className="skeleton-button"></div>
        </div>
      </div>
    ))}
  </div>
)

const ProductsDistributor = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)

  // Paginación
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

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
      })

      const response = await fetch(`${baseURLRest}/products?${params}`)
      if (!response.ok) throw new Error("Error al cargar productos")

      const data = await response.json()
      setProducts(data)
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

  const handleCreateProduct = async () => {
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

  const handleUpdateProduct = async () => {
    if (!selectedProduct?.ProductId) return

    try {
      const response = await fetch(`${baseURLRest}/products/${selectedProduct.ProductId}`, {
        method: "PUT",
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

        if (!response.ok) throw new Error("Error al eliminar producto")

        showSuccess("Producto eliminado", "El producto se ha eliminado exitosamente")
        fetchProducts()
      } catch (err) {
        showError("Error", "No se pudo eliminar el producto")
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

  return (
    <div className="products-admin">
      {/* Header compacto */}
      <div className="admin-header">
        <div className="header-content">
          <div className="header-info">
            <h1>
              <Package size={24} /> Gestión de Productos
            </h1>
            <span className="product-count">{products.length} productos</span>
          </div>
          <button className="btn-primary" onClick={() => openModal("create")}>
            <Plus size={18} />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="search-filter">
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

        <div className="category-filter">
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
            className="btn-clear"
            onClick={() => {
              setNameFilter("")
              setCategoryFilter("")
              setPage(1)
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla de productos */}
      <div className="table-section">
        {loading ? (
          <TableSkeleton />
        ) : (
          <table className="products-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Producto</th>
                <th>Descripción</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.ProductId}>
                  <td>#{product.ProductId}</td>
                  <td>
                    <div className="product-info">
                      <LazyImage
                        src={product.ImageURL}
                        alt={product.ProductName}
                        className="product-thumb"
                        placeholder="/placeholder.svg?height=40&width=40"
                      />
                      <span className="product-name">{product.ProductName}</span>
                    </div>
                  </td>
                  <td className="description-cell">{product.Description}</td>
                  <td>
                    <span className="category-badge">{getCategoryName(product.CategoryId)}</span>
                  </td>
                  <td className="price-cell">${product.Price.toFixed(2)}</td>
                  <td className={`stock-cell ${product.Stock < 10 ? "low-stock" : ""}`}>{product.Stock}</td>
                  <td>
                    <div className="actions-cell">
                      <button
                        className="btn-action btn-view"
                        onClick={() => openModal("view", product)}
                        title="Ver detalles"
                      >
                        <Eye size={16} />
                      </button>
                      <button className="btn-action btn-edit" onClick={() => openModal("edit", product)} title="Editar">
                        <Edit size={16} />
                      </button>
                      <button
                        className="btn-action btn-delete"
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
        )}

        {!loading && products.length === 0 && (
          <div className="empty-state">
            <Package size={48} />
            <h3>No hay productos</h3>
            <p>No se encontraron productos con los filtros seleccionados</p>
          </div>
        )}
      </div>

      {/* Paginación simple */}
      {!loading && products.length > 0 && (
        <div className="pagination-section">
          <button className="pagination-btn nav-btn" onClick={() => setPage(page - 1)} disabled={page === 1}>
            <ChevronLeft size={18} />
          </button>

          <div className="page-numbers">
            <button className="page-btn active">{page}</button>
          </div>

          <button
            className="pagination-btn nav-btn"
            onClick={() => setPage(page + 1)}
            disabled={products.length < limit}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {modalMode === "create" && "Crear Producto"}
                {modalMode === "edit" && "Editar Producto"}
                {modalMode === "view" && "Detalles del Producto"}
              </h2>
              <button className="modal-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-content">
              {modalMode === "view" ? (
                <div className="product-details">
                  <div className="detail-image">
                    <LazyImage
                      src={selectedProduct?.ImageURL || ""}
                      alt={selectedProduct?.ProductName || "Producto"}
                      className="detail-img"
                      placeholder="/placeholder.svg?height=200&width=300"
                    />
                  </div>
                  <div className="detail-info">
                    <h3>{selectedProduct?.ProductName}</h3>
                    <p className="detail-description">{selectedProduct?.Description}</p>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>Categoría:</label>
                        <span>{getCategoryName(selectedProduct?.CategoryId)}</span>
                      </div>
                      <div className="detail-item">
                        <label>Precio:</label>
                        <span className="price">${selectedProduct?.Price.toFixed(2)}</span>
                      </div>
                      <div className="detail-item">
                        <label>Stock:</label>
                        <span className={selectedProduct && selectedProduct.Stock < 10 ? "low-stock" : ""}>
                          {selectedProduct?.Stock}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form className="product-form">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Nombre del producto</label>
                      <input
                        type="text"
                        name="ProductName"
                        value={formData.ProductName}
                        onChange={handleInputChange}
                        placeholder="Ej: Pizza Margherita, Hamburguesa BBQ..."
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Categoría</label>
                      <select name="CategoryId" value={formData.CategoryId} onChange={handleInputChange} required>
                        <option value={0}>Seleccionar categoría...</option>
                        {categories.map((category) => (
                          <option key={category.CategoryId} value={category.CategoryId}>
                            {category.CategoryName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group full-width">
                      <label>Descripción</label>
                      <textarea
                        name="Description"
                        value={formData.Description}
                        onChange={handleInputChange}
                        placeholder="Describe los ingredientes, sabores y características especiales del producto..."
                        rows={3}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Precio ($)</label>
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

                    <div className="form-group">
                      <label>Stock disponible</label>
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

                    <div className="form-group full-width">
                      <label>URL de imagen</label>
                      <input
                        type="url"
                        name="ImageURL"
                        value={formData.ImageURL}
                        onChange={handleInputChange}
                        placeholder="https://ejemplo.com/imagen-del-producto.jpg"
                      />
                    </div>
                  </div>
                </form>
              )}
            </div>

            <div className="modal-footer">
              {modalMode === "view" ? (
                <button className="btn-secondary" onClick={closeModal}>
                  Cerrar
                </button>
              ) : (
                <>
                  <button className="btn-secondary" onClick={closeModal}>
                    Cancelar
                  </button>
                  <button
                    className="btn-primary"
                    onClick={modalMode === "create" ? handleCreateProduct : handleUpdateProduct}
                  >
                    <Save size={16} />
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
