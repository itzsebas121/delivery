import React, { createContext, useContext, useEffect, useRef, useState } from "react";

type Role = "client" | "distributor";

export interface Message {
  type?: string;
  role?: Role;
  userId?: string | number;
  contenido?: string;
  estado?: string;
  toUserId?: string | number;
  from?: string | number | "distribuidor";
  [key: string]: any;
}

interface PedidoWebSocketContextValue {
  conectado: boolean;
  completarOrdenWS: (toUserId:number, contenido: string ) => void;
  cancelarOrdenWS: (toUserId:number, contenido: string, ) => void;
  aceptarOrdenWS: (toUserId:number, contenido: string ) => void;
  crearOrdenWS: ( contenido: string ) => void;
}

const PedidoWebSocketContext = createContext<PedidoWebSocketContextValue | undefined>(undefined);

interface PedidoWebSocketProviderProps {
  role: Role;
  userId: number;
  onNotification?: (msg: Message) => void;
  children: React.ReactNode;
}

export const PedidoWebSocketProvider: React.FC<PedidoWebSocketProviderProps> = ({
  role,
  userId,
  onNotification,
  children,
}) => {
  const ws = useRef<WebSocket | null>(null);
  const [conectado, setConectado] = useState(false);

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    ws.current = new WebSocket("ws://localhost:3000");

    ws.current.onopen = () => {
      ws.current?.send(JSON.stringify({ type: "register", role, userId }));
      setConectado(true);
    };

    ws.current.onmessage = (event) => {
      try {
        const data: Message = JSON.parse(event.data);

        if ("Notification" in window 
            && Notification.permission === "granted"
            && data.type !== "register") {
          new Notification(`${data.estado ?? "Información"}`, {
            body: data.contenido ?? "Tienes una nueva notificación",
            icon: data.icono??"https://cdn-icons-png.flaticon.com/512/1077/1077012.png",
          });
        }
        if (onNotification) onNotification(data);
      } catch {
      }
    };

    ws.current.onclose = () => {
      setConectado(false);
    };

    ws.current.onerror = (_e) => {
    };

    return () => {
      ws.current?.close();
    };
  }, [role, userId, onNotification]);

  function crearOrdenWS(contenido: string) {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const msg: Message = { contenido, estado:"Nueva Orden", from: userId, type: "global", icono:"https://cdn-icons-png.freepik.com/512/10112/10112452.png" };
      ws.current.send(JSON.stringify(msg));
    } else {
    }
  }

  function aceptarOrdenWS(toUserId: string | number, contenido: string) {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const msg: Message = { toUserId, contenido, estado:"Orden aceptada", from: userId, type: "personal" ,icono:"https://cdn-icons-png.flaticon.com/512/4676/4676038.png"};
      ws.current.send(JSON.stringify(msg));
    } else {
    }
  }
  function cancelarOrdenWS(toUserId: string | number, contenido: string) {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const msg: Message = { toUserId, contenido, estado:"Orden cancelada", from: userId, type: "personal", icono:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSViT0ZqWsoaJGfzXG0Za3nLcUOv94GboL5VA&s" };
      ws.current.send(JSON.stringify(msg));
      console.log("Mensaje enviado:", msg);
    } else {
    }
  }
  function completarOrdenWS(toUserId: string | number, contenido: string) {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const msg: Message = { toUserId, contenido, estado:"Orden Completada", from: userId, type: "personal", icono:"https://img.freepik.com/vector-premium/orden-diseno-vectorial-estilo-icono-completado_822882-18109.jpg" };
      ws.current.send(JSON.stringify(msg));
    } else {
    }
  }

  return (
    <PedidoWebSocketContext.Provider value={{ conectado, crearOrdenWS, aceptarOrdenWS, cancelarOrdenWS, completarOrdenWS }}>
      {children}
    </PedidoWebSocketContext.Provider>
  );
};

export function usePedidoWebSocket() {
  const context = useContext(PedidoWebSocketContext);
  if (!context) {
    throw new Error("usePedidoWebSocket debe usarse dentro de PedidoWebSocketProvider");
  }
  return context;
}
