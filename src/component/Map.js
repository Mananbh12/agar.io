import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import Blob from "./Blob";

const Map = () => {
  const [players, setPlayers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [backgroundPosition, setBackgroundPosition] = useState({ x: 0, y: 0 });
  const [foodItems, setFoodItems] = useState([]); // Stocker les positions fixes des blobs "food"

  useEffect(() => {
    // Initialisation de la connexion au serveur
    const newSocket = io("http://localhost:3001");
    setSocket(newSocket);

    // Enregistrer l'utilisateur après la connexion
    newSocket.on("connect", () => {
      newSocket.emit("register"); // Envoi du signal "register"
    });

    // Confirmation d'enregistrement
    newSocket.on("register-ok", (data) => {
      console.log("Registration successful:", data);
    });

    // Mise à jour de la liste des joueurs après l'arrivée d'un nouveau joueur
    newSocket.on("new-player", ({ players: updatedPlayers }) => {
      setPlayers(updatedPlayers);
    });

    // Gestion des mouvements des ennemis
    newSocket.on("ennemy-move", ({ id, x, y }) => {
      console.log("Enemy move received:", { id, x, y });
      setPlayers((prevPlayers) =>
        prevPlayers.map((player) =>
          player.id === id ? { ...player, x, y } : player
        )
      );
    });

    // Gestion des mouvements du joueur (réception de la position depuis le serveur)
    newSocket.on("player-move", ({ id, x, y }) => {
      setPlayers((prevPlayers) =>
        prevPlayers.map((player) =>
          player.id === id ? { ...player, x, y } : player
        )
      );
    });

    // Nettoyage lors du démontage
    return () => {
      newSocket.disconnect();
      setSocket(null); // Réinitialiser l'état du socket
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

    // Initialisation des positions et couleurs
    setFoodItems(generateFood());
  }, []); // Exécuté uniquement lors du montage

  const handleMouseMove = (e) => {
    const gridWidth = window.innerWidth;
    const gridHeight = window.innerHeight;

    // Calculer la position relative en fonction du mouvement de la souris
    const newBackgroundX = (e.clientX / gridWidth) * 1000;
    const newBackgroundY = (e.clientY / gridHeight) * 1000;

    // Mettre à jour l'arrière-plan en fonction du mouvement de la souris
    setBackgroundPosition({ x: newBackgroundX, y: newBackgroundY });

    // Émettre les coordonnées relatives au serveur
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
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#f0f0f0",
        backgroundPosition: `${backgroundPosition.x}px ${backgroundPosition.y}px`, // Déplacement du fond
        backgroundSize: "cover", // Assurez-vous que l'image de fond couvre toute la zone
        transition: "background-position 0.1s ease-out", // Animation du déplacement du fond
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
            x={player.x || 0} // Position du Blob Joueur (fixé au centre)
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
