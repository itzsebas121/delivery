import { PayPalButtons } from "@paypal/react-paypal-js";
import './paypal.css';
interface PayPalProps {
  total: number;
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
  onCancel: () => void;
}

const PayPal: React.FC<PayPalProps> = ({ total, onSuccess, onError, onCancel }) => {
  return (
    <div className="paypal-container">
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
          });
        }}
        onApprove={(_data, actions) => {
          return actions.order!.capture().then((details) => {
            onSuccess(details);
          });
        }}
        onCancel={onCancel}
        onError={onError}
      />
      <div className="paypal-security">🔒 Pago seguro con PayPal</div>
    </div>
  );
};

export default PayPal;
