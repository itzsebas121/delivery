// app.js o server.js
const express = require("express");
const cors = require("cors");
const { WebPubSubServiceClient } = require("@azure/web-pubsub");

const app = express();
app.use(cors());

const connectionString = "Endpoint=https://gep.webpubsub.azure.com;AccessKey=TU_CLAVE;Version=1.0;";
const hubName = "Centro";
const serviceClient = new WebPubSubServiceClient(connectionString, hubName);

// Ruta para que el frontend obtenga la URL segura
app.get("/connect", (req, res) => {
  const userId = req.query.userId; // viene desde el frontend

  if (!userId) return res.status(400).json({ error: "Falta userId" });

  const token = serviceClient.getClientAccessToken({
    userId,
    expiresAfter: 60 * 60 // 1 hora
  });

  res.json({ url: token.url });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
