const WebSocket = require("ws");

const port = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port });

const clients = new Map();
const distributors = new Set();

wss.on("connection", (ws) => {

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.type === "register") {
        ws.role = data.role;
        ws.userId = data.userId;

        if (ws.role === "distributor") {
          distributors.add(ws);
        } else if (ws.role === "client") {
          clients.set(ws.userId, ws);
          console.log(`Client ${ws.userId} connected`);
        }

        return;
      }

      if (ws.role === "client") {
        for (const dist of distributors) {
          if (dist.readyState === WebSocket.OPEN) {
            dist.send(JSON.stringify({
              from: ws.userId,
              contenido: data.contenido,
              estado: data.estado,
              icono: data.icono,
            }));
          }
        }
      }

      if (ws.role === "distributor" && data.toUserId) {
        const clientSocket = clients.get(data.toUserId);
        if (clientSocket && clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(JSON.stringify({
            from: "distribuidor",
            contenido: data.contenido,
            estado: data.estado,
            icono: data.icono,
          }));
          console.log(`Mensaje enviado a ${data.toUserId}`);
        } else {
          ws.send(JSON.stringify({
            type: "error",
            message: `Cliente ${data.toUserId} no conectado`
          }));
        }
      }

    } catch (e) {
      console.error("❌ Error al procesar mensaje:", e.message);
    }
  });

  ws.on("close", () => {
    if (ws.role === "distributor") distributors.delete(ws);
    if (ws.role === "client") clients.delete(ws.userId);
  });
});

