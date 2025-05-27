import type React from "react"
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js"

interface PayPalProps {
  total: number
  onSuccess: (details: any) => void
  onError: (error: any) => void
  onCancel: () => void
}

const PayPal: React.FC<PayPalProps> = ({ total, onSuccess, onError, onCancel }) => {
  const initialOptions = {
    clientId: "AUbkl5-3ki-Q1-oLgjsttOqH7THvYbiOkg-0EtWmzhtPMUapyDSChOtXYKXjANd0NFUHPaBqfq1SVjhi",
    currency: "USD",
    intent: "capture",
  }

  return (
    <div className="paypal-container">
      <PayPalScriptProvider options={initialOptions}>
        <PayPalButtons
          style={{
            layout: "vertical",
            color: "blue",
            shape: "rect",
            label: "paypal",
            height: 40,
          }}
          createOrder={(_data, actions) => {
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
          onApprove={(_data, actions) => {
            return actions.order!.capture().then((details) => {
              onSuccess(details)
            })
          }}
          onCancel={onCancel}
          onError={onError}
        />
      </PayPalScriptProvider>
      <div className="paypal-security">🔒 Pago seguro con PayPal</div>
    </div>
  )
}

export default PayPal
