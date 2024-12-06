import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import Blob from "./Blob";

const Map = () => {
  const [players, setPlayers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [backgroundPosition, setBackgroundPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const newSocket = io("http://localhost:3001");
    setSocket(newSocket);

    if (socket) {
      socket.emit("register");
    }
    newSocket.on("register-ok", (data) => {
      console.log("Registration successful:", data);
    });

    newSocket.on("new-player", ({ players: updatedPlayers }) => {
      setPlayers(updatedPlayers);
    });

    newSocket.on("ennemy-move", ({ id, x, y }) => {
      console.log("Enemy move received:", { id, x, y });
      setPlayers((prevPlayers) => {
        const updatedPlayers = prevPlayers.map((player) =>
          player.id === id ? { ...player, x, y } : player
        );
        console.log("Updated players:", updatedPlayers);
        return updatedPlayers;
      });
    });

    return () => newSocket.disconnect();
  }, []);

  // Fonction pour gérer le déplacement de l'image de fond (grille)
  const handleMouseMove = (e) => {
    const x = e.clientX;
    const y = e.clientY;
    const gridWidth = window.innerWidth;  // Largeur de la fenêtre
    const gridHeight = window.innerHeight;  // Hauteur de la fenêtre

    // Calculer la nouvelle position de l'image de fond en fonction de la souris
    const newBackgroundX = (x / gridWidth) * 1000;  // Déplacement relatif horizontal
    const newBackgroundY = (y / gridHeight) * 1000;  // Déplacement relatif vertical

    setBackgroundPosition({ x: newBackgroundX, y: newBackgroundY });
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#f0f0f0",
        backgroundPosition: `${backgroundPosition.x}px ${backgroundPosition.y}px`, // Déplacement du fond
        backgroundSize: "cover", // Assurez-vous que l'image de fond couvre toute la zone
        transition: "background-position 0.1s ease-out",  // Animation du déplacement du fond
      }}
      onMouseMove={handleMouseMove}
    >
      {players.map((player) => (
        <Blob
          key={player.id}
          id={player.id}
          color={player.color}
          x={player.x || 0}
          y={player.y || 0} // Position du Blob Joueur au centre
          size={50} // Taille du Blob
        />
      ))}
    </div>
  );
};

export default Map;
