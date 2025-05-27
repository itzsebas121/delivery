"use client"

import "./ProductCard.css"
import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Package, ShoppingCart, Plus, Loader2, Check } from "lucide-react"
import { useAlert } from "./Alerts/Alert-system"

interface ProductCardProps {
  productId: number
  productName: string
  description: string
  price: number
  stock?: number
  imageURL: string
  categoryName: string
  onAddToCart?: (product: any) => void
  isLoading?: boolean
  isAdded?: boolean
}

const ProductCard: React.FC<ProductCardProps> = ({
  productId,
  productName,
  description,
  price,
  stock = 10, // valor por defecto
  imageURL,
  categoryName,
  onAddToCart,
  isLoading = false,
  isAdded = false,
}) => {
  const [hasError, setHasError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const { showCartSuccess, showWarning, showError } = useAlert()

  // Intersection Observer para lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleAddToCart = async () => {
    // Verificar stock antes de agregar
    if (stock <= 0) {
      showWarning("Producto agotado", "Este producto no está disponible en este momento.")
      return
    }

    // Verificar si ya se está procesando
    if (isLoading) {
      return
    }

    try {
      if (onAddToCart) {
        await onAddToCart({
          ProductId: productId,
          ProductName: productName,
          Description: description,
          Price: price,
          Stock: stock,
          ImageURL: imageURL,
          CategoryName: categoryName,
        })

        // Mostrar alerta de éxito solo si no hay error
        showCartSuccess(productName)
      }
    } catch (error) {
      // El error ya se maneja en el componente padre, pero podemos agregar una alerta adicional aquí si es necesario
      showError("Error al agregar", "No se pudo agregar el producto al carrito. Intenta nuevamente.")
    }
  }

  const handleImageLoad = () => {
    setIsLoaded(true)
  }

  const handleImageError = () => {
    setHasError(true)
    setIsLoaded(true)
  }

  const isOutOfStock = stock <= 0

  return (
    <div ref={cardRef} className={`product-card-compact ${isOutOfStock ? "out-of-stock" : ""}`}>
      <div className="product-image-container">
        {!isInView ? (
          <div className="product-skeleton"></div>
        ) : hasError ? (
          <div className="product-fallback">
            <Package size={24} />
          </div>
        ) : (
          <>
            {!isLoaded && <div className="product-skeleton"></div>}
            <img
              ref={imgRef}
              src={imageURL || "/placeholder.svg"}
              alt={productName}
              className={`product-image ${isLoaded ? "loaded" : ""}`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="lazy"
            />
          </>
        )}

        <div className="product-category-badge">{categoryName}</div>

        {/* Stock badge */}
        {isOutOfStock && <div className="product-stock-badge out-of-stock">Agotado</div>}

        {/* Quick add button con estados */}
        <button
          className={`product-quick-add ${isLoading ? "loading" : ""} ${isAdded ? "added" : ""}`}
          onClick={handleAddToCart}
          disabled={isLoading || isOutOfStock}
        >
          {isLoading ? <Loader2 size={16} className="spinning" /> : isAdded ? <Check size={16} /> : <Plus size={16} />}
        </button>
      </div>

      <div className="product-content">
        <h3 className="product-name">{productName}</h3>
        <p className="product-description">{description}</p>

        {/* Información de stock */}
        <div className="product-stock-info">
          <span className={`stock-indicator ${isOutOfStock ? "out-of-stock" : stock <= 5 ? "low-stock" : "in-stock"}`}>
            {isOutOfStock ? "Sin stock" : `${stock} disponibles`}
          </span>
        </div>

        <div className="product-footer">
          <span className="product-price">${price.toFixed(2)}</span>
          <button
            className={`product-add-btn ${isLoading ? "loading" : ""} ${isAdded ? "added" : ""}`}
            onClick={handleAddToCart}
            disabled={isLoading || isOutOfStock}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="spinning" />
                Agregando...
              </>
            ) : isAdded ? (
              <>
                <Check size={14} />
                Agregado
              </>
            ) : (
              <>
                <ShoppingCart size={14} />
                {isOutOfStock ? "Agotado" : "Agregar"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductCard
