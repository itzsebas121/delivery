const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 3000 });

let adminSocket = null;
const clients = new Map();

wss.on("connection", (ws) => {
  console.log("Cliente conectado");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "register") {
        if (data.role === "admin") {
          adminSocket = ws;
          console.log("Admin conectado");
          ws.send(JSON.stringify({ type: "info", message: "Conectado como admin" }));
        } else if (data.role === "client") {
          ws.role = "client";
          ws.userId = data.userId;
          clients.set(ws.userId, ws);
          console.log(`Cliente conectado: ${ws.userId}`);
          ws.send(JSON.stringify({ type: "info", message: `Conectado como cliente ${ws.userId}` }));
        }
        return;
      }

      // Mensaje normal
      if (ws === adminSocket) {
        // El admin debe enviar mensajes así:
        // { type: "message", to: "pepito", content: "Hola Pepito" }
        if (data.type === "message" && data.to) {
          const clientSocket = clients.get(data.to);
          if (clientSocket && clientSocket.readyState === WebSocket.OPEN) {
            clientSocket.send(JSON.stringify({
              from: "admin",
              content: data.content,
            }));
          } else {
            ws.send(JSON.stringify({ type: "error", message: `Cliente ${data.to} no conectado` }));
          }
        }
      } else {
        // Mensajes de cliente hacia admin (opcional)
        if (adminSocket && adminSocket.readyState === WebSocket.OPEN) {
          adminSocket.send(JSON.stringify({
            from: ws.userId || "cliente",
            content: data.content || message,
          }));
        }
      }
    } catch {
    }
  });

  ws.on("close", () => {
    if (ws === adminSocket) {
      adminSocket = null;
      console.log("Admin desconectado");
    } else if (ws.role === "client") {
      clients.delete(ws.userId);
      console.log(`Cliente desconectado: ${ws.userId}`);
    }
  });
});

console.log("Servidor WebSocket corriendo en ws://localhost:3000");
