"use client";

import { useEffect, useState } from "react";

const animations = {
  sunrise: {
    emoji: "☀️",
    background: "linear-gradient(to top, #FFE66D 0%, #FFF8F0 60%)",
    keyframes: `
      @keyframes rise {
        0% { transform: translateY(60px); opacity: 0.3; }
        100% { transform: translateY(0px); opacity: 1; }
      }
    `,
    style: { animation: "rise 1.5s ease-out forwards", fontSize: "72px" },
  },
  moon: {
    emoji: "🌙",
    background: "linear-gradient(to top, #2D3436 0%, #636E72 40%, #1a1a2e 100%)",
    keyframes: `
      @keyframes float {
        0% { transform: translateY(20px); opacity: 0; }
        50% { transform: translateY(-5px); opacity: 1; }
        100% { transform: translateY(0px); opacity: 1; }
      }
      @keyframes twinkle {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
      }
    `,
    style: { animation: "float 1.5s ease-out forwards", fontSize: "72px" },
    extras: [
      { emoji: "⭐", style: { position: "absolute", top: "15%", left: "20%", fontSize: "20px", animation: "twinkle 2s infinite" } },
      { emoji: "⭐", style: { position: "absolute", top: "25%", right: "25%", fontSize: "16px", animation: "twinkle 2s infinite 0.5s" } },
      { emoji: "⭐", style: { position: "absolute", top: "10%", right: "35%", fontSize: "14px", animation: "twinkle 2s infinite 1s" } },
    ],
  },
  wave: {
    emoji: "👋",
    background: "linear-gradient(135deg, #FFF8F0, #FFE0D0)",
    keyframes: `
      @keyframes wave {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(20deg); }
        75% { transform: rotate(-15deg); }
      }
    `,
    style: { animation: "wave 1s ease-in-out 3", fontSize: "80px" },
  },
  meet: {
    emoji: "🤝",
    background: "linear-gradient(135deg, #F8F7FF, #E8E6F0)",
    keyframes: `
      @keyframes slideLeft {
        0% { transform: translateX(-60px); opacity: 0; }
        100% { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideRight {
        0% { transform: translateX(60px); opacity: 0; }
        100% { transform: translateX(0); opacity: 1; }
      }
    `,
    style: { fontSize: "72px" },
    leftEmoji: { emoji: "🧑", style: { animation: "slideLeft 0.8s ease-out forwards", fontSize: "56px" } },
    rightEmoji: { emoji: "👧", style: { animation: "slideRight 0.8s ease-out forwards 0.3s", fontSize: "56px", opacity: 0 } },
  },
  sad: {
    emoji: "😢",
    background: "linear-gradient(to top, #DFE6E9, #F0F3F5)",
    keyframes: `
      @keyframes drip {
        0% { transform: translateY(-10px); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateY(40px); opacity: 0; }
      }
    `,
    style: { fontSize: "80px" },
    extras: [
      { emoji: "💧", style: { position: "absolute", bottom: "30%", left: "45%", fontSize: "20px", animation: "drip 2s infinite" } },
    ],
  },
  happy: {
    emoji: "😊",
    background: "linear-gradient(135deg, #FFF8F0, #FDCB6E40)",
    keyframes: `
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-15px); }
      }
    `,
    style: { animation: "bounce 0.8s ease-in-out 2", fontSize: "80px" },
  },
  eat: {
    emoji: "🍎",
    background: "linear-gradient(135deg, #FFF8F0, #FFE0D0)",
    keyframes: `
      @keyframes munch {
        0% { transform: scale(1); }
        50% { transform: scale(0.8); }
        100% { transform: scale(1); }
      }
    `,
    style: { animation: "munch 0.6s ease-in-out 3", fontSize: "72px" },
  },
  counting: {
    emoji: "🔢",
    background: "linear-gradient(135deg, #F8F7FF, #E8E6F0)",
    keyframes: `
      @keyframes popIn {
        0% { transform: scale(0); opacity: 0; }
        70% { transform: scale(1.1); }
        100% { transform: scale(1); opacity: 1; }
      }
    `,
    style: { fontSize: "72px" },
  },
  family: {
    emoji: "👨‍👩‍👧‍👦",
    background: "linear-gradient(135deg, #FFF8F0, #FFE0D0)",
    keyframes: `
      @keyframes gather {
        0% { transform: scale(0.5); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }
    `,
    style: { animation: "gather 1s ease-out forwards", fontSize: "72px" },
  },
  none: {
    emoji: "",
    background: "var(--color-bg)",
    keyframes: "",
    style: {},
  },
};

export default function VisualScene({ scene = "none", size = "large" }) {
  const config = animations[scene] || animations.none;
  const height = size === "large" ? "240px" : "160px";

  return (
    <div
      style={{
        width: "100%",
        height: height,
        borderRadius: "var(--radius-lg)",
        background: config.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{config.keyframes}</style>

      {/* Extra decorative elements */}
      {config.extras?.map((extra, i) => (
        <span key={i} style={extra.style}>
          {extra.emoji}
        </span>
      ))}

      {/* Meet animation with two characters */}
      {config.leftEmoji && config.rightEmoji ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={config.leftEmoji.style}>{config.leftEmoji.emoji}</span>
          <span style={config.style}>{config.emoji}</span>
          <span style={config.rightEmoji.style}>{config.rightEmoji.emoji}</span>
        </div>
      ) : (
        <span style={config.style}>{config.emoji}</span>
      )}
    </div>
  );
}