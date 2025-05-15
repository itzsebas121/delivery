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
    cartItems.reduce((acc, item) => acc + (item.Price ?? 0) * (item.Quantity ?? 0), 0);

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
      setMessage(`✅ Orden creada con éxito, ID: ${result.orderId}`);
      setTimeout(() => {
        setLoading(false);
        onClose();
      }, 2500);
    } catch (error) {
      setLoading(false);
      setMessage("❌ Error al procesar el pago");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkoutTitle"
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "24px 32px",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "420px",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2 id="checkoutTitle" style={{ marginBottom: "1rem", textAlign: "center", color: "#222" }}>
          Proceso de Pago - Cliente #{clientId}
        </h2>

        {cartItems.length === 0 ? (
          <p style={{ textAlign: "center", fontStyle: "italic", color: "#666" }}>
            Tu carrito está vacío
          </p>
        ) : (
          <>
            <ul style={{ listStyle: "none", padding: 0, marginBottom: "1rem" }}>
              {cartItems.map((item) => (
                <li
                  key={item.ProductId}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px solid #eee",
                    fontSize: "1rem",
                    color: "#444",
                  }}
                >
                  <span>{item.ProductName} x {item.Quantity}</span>
                  <span>${((item.Price ?? 0) * (item.Quantity ?? 0)).toFixed(2)}</span>
                </li>
              ))}
            </ul>

            <div
              style={{
                fontWeight: "700",
                fontSize: "1.2rem",
                marginBottom: "1.5rem",
                textAlign: "right",
                color: "#111",
              }}
            >
              Total: ${getTotal().toFixed(2)}
            </div>

            <label
              htmlFor="addressInput"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "600",
                color: "#333",
              }}
            >
              Dirección de Entrega:
            </label>
            <input
              id="addressInput"
              type="text"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Ej: Calle 123, Ciudad"
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: "1rem",
                borderRadius: "6px",
                border: "1.5px solid #ccc",
                marginBottom: "1.5rem",
                transition: "border-color 0.3s",
              }}
              disabled={loading}
              autoFocus
            />

            <button
              onClick={handlePay}
              disabled={loading}
              style={{
                backgroundColor: loading ? "#999" : "#007bff",
                color: "#fff",
                padding: "12px 0",
                borderRadius: "8px",
                fontSize: "1.1rem",
                fontWeight: "600",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 4px 12px rgba(0,123,255,0.5)",
                transition: "background-color 0.3s",
              }}
            >
              {loading ? "Procesando..." : "Pagar"}
            </button>
          </>
        )}

        {message && (
          <p
            role="alert"
            style={{
              marginTop: "1rem",
              color: message.startsWith("❌") ? "#d9534f" : "#28a745",
              fontWeight: "600",
              textAlign: "center",
            }}
          >
            {message}
          </p>
        )}

        <button
          onClick={onClose}
          style={{
            marginTop: "2rem",
            background: "transparent",
            border: "none",
            color: "#007bff",
            cursor: "pointer",
            textDecoration: "underline",
            fontSize: "1rem",
            alignSelf: "center",
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default CheckoutModal;
