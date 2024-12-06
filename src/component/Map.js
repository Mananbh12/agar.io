import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import Blob from "./Blob";

const Map = () => {
  const [players, setPlayers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [backgroundPosition, setBackgroundPosition] = useState({ x: 0, y: 0 });
  const [foodItems, setFoodItems] = useState([]); 

  useEffect(() => {
    const newSocket = io("http://localhost:3001");
    setSocket(newSocket);

    const screenCenter = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };

    newSocket.on("connect", () => {
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
      blobFeeds();
    });

    newSocket.on("player-move", ({ id, x, y }) => {
      setPlayers((prevPlayers) =>
        prevPlayers.map((player) =>
          player.id === id ? { ...player, x, y } : player
        )
      );
      blobFeeds();
    });

    const checkPlayerCollision = (blobA, blobB) => {
      
      const dx = blobA.x/1000 - blobB.x/1000;
      const dy = blobA.y/1000 - blobB.y/1000;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < (blobA.width/2  + blobB.width/2);
    };

    const checkCollisionWithFood = (player, food) => {
      const dx = player.x/1000 - food.x/1000;
      const dy = player.y/1000 - food.y/1000;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < (player.width/2 + food.width/2) ;
    };

    const blobFeeds = () => {
      console.log("entrée fonction feed")
      setPlayers((prevPlayers) => {
        const updatedPlayers = [...prevPlayers];
        const foodToRemove = []; 

        updatedPlayers.forEach((blobA) => {
          foodItems.forEach((blobB, index) => {
            console.log("entrée if feed")
            if (blobB.id.includes("food") && checkCollisionWithFood(blobA, blobB)) {
              blobA.width += 5; 
              blobA.height +=5;
              foodToRemove.push(index); 
            }
          });
          
          updatedPlayers.forEach((blobB) => {
            console.log("entrée fonction joueur")
            if (checkPlayerCollision(blobA, blobB)) {
              console.log("entrée if joueur")
              const biggerBlob = blobA.width > blobB.width ? blobA : blobB;
              const smallerBlob = blobA.width <= blobB.width ? blobA : blobB;

              
              setPlayers((prevPlayers) =>
                prevPlayers.filter((player) => player.id !== smallerBlob.id)
              );
              
              biggerBlob.width += smallerBlob.width;
            }
          });
        });

        
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
  }, []); 

  
  useEffect(() => {
    const generateFood = () => {
      return Array.from({ length: 200 }, (_, index) => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        color: "#" + Math.floor(Math.random() * 16777215).toString(16), 
        id: `food-${index}`,
        size: 10, 
      }));
    };
    setFoodItems(generateFood());
  }, []); 

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
        transform: "translate(-50%, -50%)", 
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
          <Blob
            key={`main-${player.id}`}
            id={player.id}
            color={player.color}
            x={player.x || 0}
            y={player.y || 0}
            size={player.size || 50} 
          />
  
          {foodItems.map((foodItem) => (
            <Blob
              key={foodItem.id}
              id={foodItem.id}
              color={foodItem.color}
              x={foodItem.x}
              y={foodItem.y}
              size={foodItem.size} 
            />
          ))}
        </>
      ))}
    </div>
  );
};

export default Map;
