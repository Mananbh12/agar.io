import React from "react";

const Blob = ({ id, color, x, y, size }) => {
  const blobStyle = {
    position: "absolute",
    top: `${y}px`,
    left: `${x}px`,
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor: color,
    borderRadius: "50%",
    transform: "translate(-50%, -50%)", 
  };

  return <div id={id} style={blobStyle}></div>;
};

export default Blob;
