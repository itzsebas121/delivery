import "./ProductCard.css"
import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
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

const LazyImage = ({
  src,
  alt,
  className,
  onLoad,
  onError,
}: {
  src: string
  alt: string
  className: string
  onLoad: () => void
  onError: () => void
}) => {
  const [imageSrc, setImageSrc] = useState<string>("")
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
        if (src && src.trim() !== "") {
          imgElement.onload = () => {
            setIsLoaded(true)
            setImageSrc(src)
            onLoad()
          }
          imgElement.onerror = () => {
            setHasError(true)
            onError()
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
    [src, imageRef, onLoad, onError],
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
      <div className={`image-placeholder-pcc ${className}`} style={{ backgroundColor: color }}>
        <span className="placeholder-text-pcc">{initials}</span>
      </div>
    )
  }

  // Solo mostrar iniciales si no hay src o src es null/vacío
  if (!src || src.trim() === "") {
    return generatePlaceholder()
  }

  // Si hay error al cargar pero sí hay URL, mostrar fallback normal
  if (hasError) {
    return (
      <div className="product-fallback-pcc">
        <Package size={24} />
      </div>
    )
  }

  return (
    <img
      ref={imgCallbackRef}
      src={imageSrc || "/placeholder.svg"}
      alt={alt}
      className={`${className} ${isLoaded ? "loaded-pcc" : "loading-pcc"}`}
    />
  )
}

const ProductCard: React.FC<ProductCardProps> = ({
  productId,
  productName,
  description,
  price,
  stock = 10,
  imageURL,
  categoryName,
  onAddToCart,
  isLoading = false,
  isAdded = false,
}) => {
  const [hasError, setHasError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const { showCartSuccess, showWarning, showError } = useAlert()
  const [isButtonLoading, setIsButtonLoading] = useState(false)

  // Intersection Observer para lazy loading del card completo
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: "50px" },
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
    if (isButtonLoading || isLoading) {
      return
    }

    setIsButtonLoading(true)

    try {
      if (onAddToCart) {
        // Crear una promesa que dure mínimo 2 segundos
        const minDelay = new Promise((resolve) => setTimeout(resolve, 500))
        const addToCartPromise = onAddToCart({
          ProductId: productId,
          ProductName: productName,
          Description: description,
          Price: price,
          ImageURL: imageURL,
          CategoryName: categoryName,
        })

        // Esperar tanto la operación como el delay mínimo
        await Promise.all([addToCartPromise, minDelay])

        // Mostrar alerta de éxito solo si no hay error
        showCartSuccess(productName)
      }
    } catch (error) {
      // El error ya se maneja en el componente padre, pero podemos agregar una alerta adicional aquí si es necesario
      showError("Error al agregar", "No se pudo agregar el producto al carrito. Intenta nuevamente.")
    } finally {
      setIsButtonLoading(false)
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
    <div ref={cardRef} className={`product-card-compact-pcc ${isOutOfStock ? "out-of-stock-pcc" : ""}`}>
      <div className="product-image-container-pcc">
        {!isInView ? (
          <div className="product-skeleton-pcc"></div>
        ) : (
          <>
            {!isLoaded && !hasError && <div className="product-skeleton-pcc"></div>}
            <LazyImage
              src={imageURL}
              alt={productName}
              className="product-image-pcc"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </>
        )}

        <div className="product-category-badge-pcc">{categoryName}</div>

        {/* Stock badge */}
        {isOutOfStock && <div className="product-stock-badge-pcc out-of-stock-pcc">Agotado</div>}

        {/* Quick add button con estados */}
        <button
          className={`product-quick-add-pcc ${isButtonLoading || isLoading ? "loading-pcc" : ""} ${isAdded ? "added-pcc" : ""}`}
          onClick={handleAddToCart}
          disabled={isButtonLoading || isLoading || isOutOfStock}
          title={isOutOfStock ? "Producto agotado" : "Agregar al carrito"}
        >
          {isButtonLoading || isLoading ? (
            <Loader2 size={16} className="spinning-pcc" />
          ) : isAdded ? (
            <Check size={16} />
          ) : (
            <Plus size={16} />
          )}
        </button>
      </div>

      <div className="product-content-pcc">
        <h3 className="product-name-pcc">{productName}</h3>
        <p className="product-description-pcc">{description}</p>
        <div className="product-footer-pcc">
          <span className="product-price-pcc">${price.toFixed(2)}</span>
          <button
            className={`product-add-btn-pcc ${isButtonLoading || isLoading ? "loading-pcc" : ""} ${isAdded ? "added-pcc" : ""}`}
            onClick={handleAddToCart}
            disabled={isButtonLoading || isLoading || isOutOfStock}
          >
            {isButtonLoading || isLoading ? (
              <>
                <Loader2 size={14} className="spinning-pcc" />
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
