import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import Blob from "./Blob";

const Map = () => {
  const [players, setPlayers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [backgroundPosition, setBackgroundPosition] = useState({ x: 0, y: 0 });
  const [foodItems, setFoodItems] = useState([]); // Stocker les positions fixes des blobs "food"

  useEffect(() => {
    const newSocket = io("http://localhost:3001");
    setSocket(newSocket);

    // Calculer la position centrale de l'écran
    const screenCenter = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };

    newSocket.on("connect", () => {
      // Enregistrer avec la position centrale comme position initiale
      newSocket.emit("register", { initialX: screenCenter.x, initialY: screenCenter.y });
    });

    newSocket.on("register-ok", (data) => {
      console.log("Registration successful:", data);
    });

    newSocket.on("new-player", ({ players: updatedPlayers }) => {
      setPlayers(updatedPlayers);
    });

    newSocket.on("ennemy-move", ({ id, x, y }) => {
      setPlayers((prevPlayers) =>
        prevPlayers.map((player) =>
          player.id === id ? { ...player, x, y } : player
        )
      );
    });

    newSocket.on("player-move", ({ id, x, y }) => {
      setPlayers((prevPlayers) =>
        prevPlayers.map((player) =>
          player.id === id ? { ...player, x, y } : player
        )
      );
    });

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, []);

  // Générer des positions fixes pour les Blobs secondaires (food)
  useEffect(() => {
    const generateFood = () => {
      return Array.from({ length: 200 }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        color: "#" + Math.floor(Math.random() * 16777215).toString(16), // Couleur aléatoire
      }));
    };
    setFoodItems(generateFood());
  }, []); // Exécuté uniquement lors du montage

  const handleMouseMove = (e) => {
    const gridWidth = window.innerWidth/2;
    const gridHeight = window.innerHeight/2;

    const newBackgroundX = (e.clientX / gridWidth) * 1000;
    const newBackgroundY = (e.clientY / gridHeight) * 1000;

    setBackgroundPosition({ x: newBackgroundX, y: newBackgroundY });

    if (socket) {
      socket.emit("move", {
        x: newBackgroundX,
        y: newBackgroundY,
      });
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)", // Centre le div horizontalement et verticalement
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#f0f0f0",
        backgroundPosition: `${backgroundPosition.x}px ${backgroundPosition.y}px`,
        backgroundSize: "cover",
        transition: "background-position 0.1s ease-out",
      }}
      onMouseMove={handleMouseMove}
    >
      {players.map((player) => (
        <>
          {/* Blob principal - Joueur */}
          <Blob
            key={`main-${player.id}`}
            id={player.id}
            color={player.color}
            x={player.x || 0}
            y={player.y || 0}
            size={50} // Taille du Blob principal
          />
  
          {/* 200 Blobs secondaires - Food */}
          {foodItems.map((foodItem, index) => (
            <Blob
              key={`food-${index}`}
              id={`food-${index}`}
              color={foodItem.color}
              x={foodItem.x}
              y={foodItem.y}
              size={10} // Taille des Blobs "food"
            />
          ))}
        </>
      ))}
    </div>
  );
  
};

export default Map;
