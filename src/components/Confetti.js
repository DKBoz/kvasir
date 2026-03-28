"use client";

export default function Confetti() {
  const pieces = ["🎉", "⭐", "✨", "🌟", "💫"];
  const animations = [
    "confettiLeft",
    "confettiRight",
    "confettiCenter",
    "confettiLeft",
    "confettiRight",
  ];

  return (
    <div
      style={{
        position: "fixed",
        top: "40%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        zIndex: 999,
      }}
    >
      {pieces.map((piece, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            fontSize: "24px",
            animation: `${animations[i]} 0.8s ease-out forwards`,
            animationDelay: `${i * 0.05}s`,
          }}
        >
          {piece}
        </span>
      ))}
    </div>
  );
}