import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { documentContentRouter } from "./collaboration/document-content.routes.js";
import { registerCollaborationHandlers } from "./collaboration/collaboration.socket.js";

const app = express();
const PORT = 5000;

// Express et Socket.IO > HTTP server.
const httpServer = createServer(app);
const io = new Server(httpServer);


app.use(express.json());
app.use(express.static("public"));
// app.use("/api/documents", documentContentRouter);

// app.get("/", (_req, res) => {
//   res.json({
//     message: "BACKEND Lorenzo/Alban/NGUYEN"
//   });
// });

// app.listen(PORT, () => {
//   console.log(`Serveur démarré sur http://localhost:${PORT}`);
// });
app.get("/", (_req, res) => {
  res.json({
    message: "BACKEND Lorenzo/Alban/NGUYEN"
  });
});

app.use("/api/documents", documentContentRouter);

registerCollaborationHandlers(io);

// app.listen -> httpServer.listen.
httpServer.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});