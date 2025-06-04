import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/Authcontext";
import { AlertProvider } from "./components/Alerts/Alert-system";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
     <PayPalScriptProvider
      options={{
        clientId: "AUbkl5-3ki-Q1-oLgjsttOqH7THvYbiOkg-0EtWmzhtPMUapyDSChOtXYKXjANd0NFUHPaBqfq1SVjhi",
        currency: "USD",
        intent: "capture",
      }}
    >
    <AlertProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </AlertProvider>
    </PayPalScriptProvider>
  </React.StrictMode>
);
