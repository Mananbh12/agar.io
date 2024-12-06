const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: "http://localhost:3000", 
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
  credentials: true,
};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

app.use(cors(corsOptions)); 

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

let players = []; 

io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);

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

    players.push(newPlayer, newEnemy); 
    io.emit("new-player", { players }); 
  });

  socket.on("move", ({ x, y }) => {
    players = players.map((player) =>
      player.id === socket.id
        ? { ...player, x: x || player.x, y: y || player.y }
        : player
    );

    io.emit("player-move", { id: socket.id, x, y }); 
  });

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

  socket.on("disconnect", () => {
    players = players.filter((player) => player.id !== socket.id);
    io.emit("new-player", { players });
    console.log(`Player disconnected: ${socket.id}`);
  });
});

server.listen(3001, () => {
  console.log("Server running on port 3001");
});
