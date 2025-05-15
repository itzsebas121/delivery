"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Definir la estructura de un producto en el carrito
export interface CartItem {
  productId: number
  productName: string
  price: number
  quantity: number
  imageURL?: string
}

// Definir la interfaz del contexto
interface CartContextType {
  cartItems: CartItem[]
  addToCart: (product: CartItem) => void
  removeFromCart: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  getCartTotal: () => number
  getItemsCount: () => number
}

// Crear el contexto
const CartContext = createContext<CartContextType | undefined>(undefined)

// Proveedor del contexto
export const CartProvider = ({ children }: { children: ReactNode }) => {
  // Estado para los items del carrito
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  // Cargar carrito desde localStorage al iniciar
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem("cart")
      if (storedCart) {
        const parsedCart = JSON.parse(storedCart)
        setCartItems(parsedCart)
      }
    } catch (error) {
      console.error("Error al cargar el carrito:", error)
      localStorage.removeItem("cart")
    }
  }, [])

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(cartItems))
    } catch (error) {
      console.error("Error al guardar el carrito:", error)
    }
  }, [cartItems])

  // Añadir producto al carrito
  const addToCart = (product: CartItem) => {

    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex((item) => item.productId === product.productId)

      if (existingItemIndex !== -1) {
        // Si el producto ya existe, actualizar cantidad
        const updatedItems = [...prevItems]
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + product.quantity,
        }
        return updatedItems
      } else {
        // Si es un producto nuevo, añadirlo al carrito
        return [...prevItems, product]
      }
    })
  }

  // Eliminar producto del carrito
  const removeFromCart = (productId: number) => {

    setCartItems((prevItems) => prevItems.filter((item) => item.productId !== productId))
  }

  // Actualizar cantidad de un producto
  const updateQuantity = (productId: number, quantity: number) => {

    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCartItems((prevItems) => prevItems.map((item) => (item.productId === productId ? { ...item, quantity } : item)))
  }

  // Vaciar carrito
  const clearCart = () => {
    setCartItems([])
  }

  // Calcular total del carrito
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  // Obtener número total de items
  const getItemsCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0)
  }

  // Valores del contexto
  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getItemsCount,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// Hook personalizado para usar el contexto
export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart debe ser usado dentro de un CartProvider")
  }
  return context
}
