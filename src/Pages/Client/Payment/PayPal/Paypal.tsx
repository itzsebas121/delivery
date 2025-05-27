"use client"

import type React from "react"
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js"
import { useAlert } from "../../../../components/Alerts/Alert-system"

interface PayPalProps {
  total: number
  onSuccess: (details: any) => void
  onError: (error: any) => void
  onCancel: () => void
}

const PayPal: React.FC<PayPalProps> = ({ total, onSuccess, onError, onCancel }) => {
  console.log("🎨 Renderizando componente PayPal con total:", total)

  const { showSuccess, showError, showWarning, showInfo } = useAlert()

  const initialOptions = {
    clientId: "AUbkl5-3ki-Q1-oLgjsttOqH7THvYbiOkg-0EtWmzhtPMUapyDSChOtXYKXjANd0NFUHPaBqfq1SVjhi",
    currency: "USD",
    intent: "capture",
  }

  return (
    <div style={{ width: "100%" }}>
      <PayPalScriptProvider options={initialOptions}>
        <PayPalButtons
          style={{
            layout: "vertical",
            color: "blue",
            shape: "rect",
            label: "paypal",
            height: 45,
          }}
          createOrder={(_data, actions) => {
            console.log("📝 Creando orden PayPal...")
            console.log("💵 Monto a cobrar:", total.toFixed(2), "USD")

            showInfo("Procesando pago", "Creando orden de PayPal...")

            return actions.order.create({
              intent: "CAPTURE",
              purchase_units: [
                {
                  amount: {
                    currency_code: "USD",
                    value: total.toFixed(2),
                  },
                  description: `Compra en tienda online - Total: ${total.toFixed(2)}`,
                },
              ],
            })
          }}
          onApprove={(data, actions) => {
            console.log("📋 Datos de aprobación:", data)

            showInfo("Procesando pago", "Capturando pago de PayPal...")

            return actions.order!.capture().then((details) => {
              console.log("💳 Detalles del pago capturado:", details)

              const payerName = details.payer?.name?.given_name || "Cliente"
              console.log("👤 Nombre del pagador:", payerName)

              // Llamar al callback de éxito con todos los detalles
              onSuccess(details)

              // Mostrar alerta de éxito personalizada
              showSuccess(
                "¡Pago realizado exitosamente!",
                `Gracias ${payerName}, tu pago ha sido procesado correctamente.`,
              )
            })
          }}
          onCancel={(data) => {
            console.log("🚫 Pago cancelado por el usuario:", data)
            onCancel()
            showWarning(
              "Pago cancelado",
              "Has cancelado el proceso de pago. Puedes intentarlo nuevamente cuando gustes.",
            )
          }}
          onError={(err) => {
            console.error("❌ Error en el pago PayPal:", err)
            onError(err)
            showError(
              "Error en el pago",
              "Hubo un problema al procesar tu pago con PayPal. Por favor, verifica tu información e intenta nuevamente.",
            )
          }}
        />
      </PayPalScriptProvider>

      <div
        style={{
          marginTop: "0.5rem",
          fontSize: "0.8rem",
          color: "#666",
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.25rem",
        }}
      >
        🔒 Pago seguro con PayPal
      </div>
    </div>
  )
}

export default PayPal
