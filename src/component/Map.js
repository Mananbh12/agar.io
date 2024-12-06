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
      // Mettre à jour la position du joueur et vérifier les collisions après
      setPlayers((prevPlayers) =>
        prevPlayers.map((player) =>
          player.id === id ? { ...player, x, y } : player
        )
      );
      blobFeeds();
    });

    newSocket.on("player-move", ({ id, x, y }) => {
      // Mettre à jour la position du joueur et vérifier les collisions après
      setPlayers((prevPlayers) =>
        prevPlayers.map((player) =>
          player.id === id ? { ...player, x, y } : player
        )
      );
      blobFeeds();
    });

    const checkPlayerCollision = (blobA, blobB) => {
      const dx = blobA.x - blobB.x;
      const dy = blobA.y - blobB.y;
      const distance = Math.sqrt(dx * dx + dy * dy) / 1000;
      console.log(distance)
      console.log(distance < (blobA.size + blobB.size) /2)
      // Vérifier si la distance est inférieure à la somme des rayons des deux blobs
      return distance < (blobA.size + blobB.size) / 2;
    };

    const checkCollisionWithFood = (player, food) => {
      // Calculer la distance entre le joueur et la nourriture
      const dx = player.x - food.x;
      const dy = player.y - food.y;
      const distance = Math.sqrt(dx * dx + dy * dy) / 1000;
      console.log("Distance:", distance);  // Log de distance pour vérifier
      // Vérifier si la distance est inférieure à la somme des rayons (taille / 2)
      return distance < (player.size / 2 + 5 / 2); // Taille du joueur / 2 + Taille de la nourriture / 2
    };

    const blobFeeds = () => {
      setPlayers((prevPlayers) => {
        const updatedPlayers = [...prevPlayers];
        const foodToRemove = []; // Tableau pour collecter les indices des éléments à supprimer

        updatedPlayers.forEach((blobA) => {
          // Vérifier les collisions avec la nourriture
          foodItems.forEach((blobB, index) => {
            if (checkCollisionWithFood(blobA, blobB) && blobB.id.includes("food")) {
              // Si un blob mange de la nourriture
              blobA.size += 5; // Augmenter la taille du blob
              foodToRemove.push(index); // Ajouter l'index à supprimer
              console.log("Nourriture supprimée");
            }
          });

          // Vérifier les collisions entre les blobs joueurs
          updatedPlayers.forEach((blobB) => {
            if (blobA.id !== blobB.id && checkPlayerCollision(blobA, blobB)) {
              // Si deux blobs se rencontrent, le plus grand mange le plus petit
              const biggerBlob = blobA.size > blobB.size ? blobA : blobB;
              const smallerBlob = blobA.size <= blobB.size ? blobA : blobB;

              // Supprimer le plus petit blob
              setPlayers((prevPlayers) =>
                prevPlayers.filter((player) => player.id !== smallerBlob.id)
              );
              // Augmenter la taille du blob plus grand
              biggerBlob.size += smallerBlob.size;
            }
          });
        });

        // Supprimer la nourriture après la boucle
        setFoodItems((prevFoodItems) =>
          prevFoodItems.filter((item, i) => !foodToRemove.includes(i))
        );

        return updatedPlayers;
      });
    };

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, []); // Le useEffect ne dépend plus de players et foodItems, il est exécuté uniquement au montage

  // Générer des positions fixes pour les Blobs secondaires (food)
  useEffect(() => {
    const generateFood = () => {
      return Array.from({ length: 200 }, (_, index) => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        color: "#" + Math.floor(Math.random() * 16777215).toString(16), // Couleur aléatoire
        id: `food-${index}`,
      }));
    };
    setFoodItems(generateFood());
  }, []); // Exécuté uniquement lors du montage

  const handleMouseMove = (e) => {
    const gridWidth = window.innerWidth / 2;
    const gridHeight = window.innerHeight / 2;

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
            size={player.size || 50} // Taille du Blob principal
          />
  
          {/* 200 Blobs secondaires - Food */}
          {foodItems.map((foodItem) => (
            <Blob
              key={foodItem.id}
              id={foodItem.id}
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
