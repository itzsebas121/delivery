"use client"

import { useState } from "react"
import Login from "./Login"
import Registro from "./Registro"
import "./Login.css"

export default function Page() {
  const [showLogin, setShowLogin] = useState(true)

  return (
    <div>
      {showLogin ? <Login /> : <Registro />}

      {/* Botón para alternar entre formularios (solo para demostración) */}
      <div style={{ position: "fixed", bottom: "20px", right: "20px" }}>
        <button
          onClick={() => setShowLogin(!showLogin)}
          style={{
            background: "#6366f1",
            color: "white",
            border: "none",
            padding: "10px 15px",
            borderRadius: "8px",
            cursor: "pointer",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
        >
          Cambiar a {showLogin ? "Registro" : "Login"}
        </button>
      </div>
    </div>
  )
}
