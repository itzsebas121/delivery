import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Definir la estructura de un producto en el carrito
export interface CartItem {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  imageURL?: string;
}

// Definir la interfaz del contexto
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: CartItem) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getItemsCount: () => number;
}

// Crear el contexto
const CartContext = createContext<CartContextType | undefined>(undefined);

// Proveedor del contexto
export const CartProvider = ({ children }: { children: ReactNode }) => {
  // Estado para los items del carrito
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Cargar carrito desde localStorage al iniciar
  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    if (storedCart) {
      try {
        setCartItems(JSON.parse(storedCart));
      } catch (error) {
        console.error("Error al cargar el carrito:", error);
        localStorage.removeItem("cart");
      }
    }
  }, []);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  // Añadir producto al carrito
  const addToCart = (product: CartItem) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.productId === product.productId);
      
      if (existingItem) {
        return prevItems.map(item => 
          item.productId === product.productId 
            ? { ...item, quantity: item.quantity + product.quantity } 
            : item
        );
      } else {
        return [...prevItems, product];
      }
    });
  };

  const removeFromCart = (productId: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  // Vaciar carrito
  const clearCart = () => {
    setCartItems([]);
  };

  // Calcular total del carrito
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Obtener número total de items
  const getItemsCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  // Valores del contexto
  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getItemsCount
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// Hook personalizado para usar el contexto
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart debe ser usado dentro de un CartProvider");
  }
  return context;
};
