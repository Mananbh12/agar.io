const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// Configuration CORS pour autoriser les connexions WebSocket et HTTP depuis localhost:3000
const corsOptions = {
  origin: "http://localhost:3000", // Frontend React
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
  credentials: true,
};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

app.use(cors(corsOptions)); // Appliquer le middleware CORS

// Créer une instance de socket.io avec configuration CORS
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

let players = []; // Tableau pour garder la liste des joueurs et ennemis

// Gérer la connexion d'un joueur
io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Enregistrer un nouveau joueur avec une position initiale
  socket.on("register", ({ initialX, initialY }) => {
    const newPlayer = {
      id: socket.id,
      x: initialX,
      y: initialY,
      color: "#" + Math.floor(Math.random() * 16777215).toString(16),
      isPlayer: true,
    };

    const newEnemy = {
      id: `enemy-${Math.floor(Math.random() * 10000)}`,
      x: Math.random() * 1000,
      y: Math.random() * 1000,
      color: "#" + Math.floor(Math.random() * 16777215).toString(16),
      isPlayer: false,
    };

    players.push(newPlayer, newEnemy); // Ajouter le joueur et l'ennemi au tableau
    io.emit("new-player", { players }); // Diffuser la liste des joueurs
  });

  // Mettre à jour la position du joueur
  socket.on("move", ({ x, y }) => {
    players = players.map((player) =>
      player.id === socket.id
        ? { ...player, x: x || player.x, y: y || player.y }
        : player
    );

    io.emit("player-move", { id: socket.id, x, y }); // Diffuser les nouvelles positions
  });

  // Mouvements des ennemis (mouvements aléatoires toutes les 2 secondes)
  setInterval(() => {
    players.forEach((player) => {
      if (!player.isPlayer) {
        const randomDirection = Math.floor(Math.random() * 4);
        let newX = player.x;
        let newY = player.y;

        if (randomDirection === 0) newX += getRandomInt(1, 7);
        if (randomDirection === 1) newX -= getRandomInt(1, 7);
        if (randomDirection === 2) newY += getRandomInt(1, 7);
        if (randomDirection === 3) newY -= getRandomInt(1, 7);

        player.x = newX;
        player.y = newY;

        io.emit("ennemy-move", { id: player.id, x: newX, y: newY });
      }
    });
  }, 200);

  // Déconnexion
  socket.on("disconnect", () => {
    players = players.filter((player) => player.id !== socket.id);
    io.emit("new-player", { players });
    console.log(`Player disconnected: ${socket.id}`);
  });
});

// Lancer le serveur sur le port 3001
server.listen(3001, () => {
  console.log("Server running on port 3001");
});
