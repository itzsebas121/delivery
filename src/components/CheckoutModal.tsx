import React, { useEffect, useState } from "react";
import { baseURLRest } from "../config";
type CartItem = {
  ProductId: number;
  ProductName: string;
  Quantity: number;
  Price: number;
  CartId: number;
};

type CheckoutModalProps = {
  onClose: () => void;
  clientId: number;
};

const CheckoutModal: React.FC<CheckoutModalProps> = ({ onClose, clientId }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<number | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Obtener carrito activo al cargar modal
  useEffect(() => {
    async function fetchCart() {
      try {
        const res = await fetch(`${baseURLRest}/get-cart/${clientId}`);
        if (!res.ok) throw new Error("No se pudo obtener el carrito");
        const data: CartItem[] = await res.json();
        setCartItems(data);
        if (data.length > 0) {
          setCartId(data[0].CartId);
        }
      } catch (error) {
        setMessage("Error al cargar el carrito");
      }
    }
    fetchCart();
  }, [clientId]);

  const getTotal = () =>
    cartItems.reduce((acc, item) => acc + item.Price * item.Quantity, 0);

  const handlePay = async () => {
    if (!cartId) {
      setMessage("No hay carrito activo");
      return;
    }
    if (!deliveryAddress.trim()) {
      setMessage("Por favor ingresa la dirección de entrega");
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${baseURLRest}/create-order-from-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId, deliveryAddress }),
      });
      if (!res.ok) throw new Error("Error al crear la orden");
      const result = await res.json();
      setMessage(`Orden creada con éxito, ID: ${result.orderId}`);
      // Aquí podrías limpiar el carrito o redirigir, o cerrar modal
      setTimeout(() => {
        setLoading(false);
        onClose();
      }, 2500);
    } catch (error) {
      setLoading(false);
      setMessage("Error al procesar el pago");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "8px",
          width: "400px",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
        }}
      >
        <h2>Proceso de Pago - Cliente #{clientId}</h2>

        {cartItems.length === 0 && <p>Tu carrito está vacío</p>}

        {cartItems.length > 0 && (
          <>
            <ul style={{ listStyle: "none", padding: 0, marginBottom: "1rem" }}>
              {cartItems.map((item) => (
                <li key={item.ProductId} style={{ marginBottom: "8px" }}>
                  {item.ProductName} x {item.Quantity} = $
                  {(item.Price * item.Quantity).toFixed(2)}
                </li>
              ))}
            </ul>

            <div style={{ marginBottom: "1rem", fontWeight: "bold" }}>
              Total: ${getTotal().toFixed(2)}
            </div>

            <label htmlFor="addressInput" style={{ display: "block", marginBottom: "0.25rem" }}>
              Dirección de Entrega:
            </label>
            <input
              id="addressInput"
              type="text"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Ej: Calle 123, Ciudad"
              style={{ width: "100%", padding: "8px", marginBottom: "1rem" }}
            />

            <button
              onClick={handlePay}
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: loading ? "#999" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Procesando..." : "Pagar"}
            </button>
          </>
        )}

        {message && (
          <p style={{ marginTop: "1rem", color: message.startsWith("Error") ? "red" : "green" }}>
            {message}
          </p>
        )}

        <button
          onClick={onClose}
          style={{
            marginTop: "1rem",
            background: "transparent",
            border: "none",
            color: "#007bff",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default CheckoutModal;
