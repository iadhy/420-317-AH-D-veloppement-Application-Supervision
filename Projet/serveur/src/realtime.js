import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io = null;

/**
 * Attache Socket.IO au serveur HTTP et exige un jeton valide.
 *
 * Le socket est en sens unique : le serveur diffuse, les clients ecoutent.
 * Toute action (creer, modifier, desactiver un capteur) passe par l'API REST,
 * donc par protect et authorize. Le role n'a pas d'importance ici : tout
 * compte authentifie a le droit de VOIR.
 */
export function initRealtime(httpServer) {
  io = new Server(httpServer, {
    // Socket.IO a sa propre configuration CORS, distincte de celle d'Express :
    // cors() dans app.js ne protege pas ce canal.
    cors: process.env.CORS_ORIGIN ? { origin: process.env.CORS_ORIGIN } : undefined,
  });

  // Execute UNE fois par connexion, avant qu'elle soit acceptee.
  io.use((socket, next) => {
    try {
      const payload = jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET);
      socket.data.user = { id: payload.id, role: payload.role };
      next();
    } catch {
      next(new Error("Jeton absent ou invalide"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connecte : ${socket.id} (${socket.data.user.role})`);
    socket.on("disconnect", () => console.log(`Socket ferme : ${socket.id}`));
  });

  return io;
}

// Diffuse a tous les clients connectes. Sans effet tant que le serveur
// temps reel n'est pas initialise (par exemple dans les tests hors ligne).
export function emit(event, payload) {
  io?.emit(event, payload);
}
