"use client";

import { useState } from "react";

const themes = [
  {
    id: "kids",
    label: "Kids",
    ages: "5–10",
    emoji: "🎨",
    description: "Fun and colorful",
  },
  {
    id: "teens",
    label: "Teens",
    ages: "11–17",
    emoji: "⚡",
    description: "Bold and energetic",
  },
  {
    id: "adults",
    label: "Adults",
    ages: "18+",
    emoji: "🎯",
    description: "Clean and focused",
  },
];

export default function Home() {
  const [selected, setSelected] = useState(null);

  function handleSelect(themeId) {
    setSelected(themeId);
    document.documentElement.setAttribute("data-theme", themeId);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        gap: "40px",
        background: "var(--color-bg)",
        transition: "background 0.3s ease",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "var(--font-weight-heading)",
            color: "var(--color-text)",
            fontFamily: "var(--font-heading)",
            marginBottom: "8px",
          }}
        >
          Welcome to Kvasir
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: "var(--color-text-light)",
          }}
        >
          Choose your path to start learning English
        </p>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          width: "100%",
          maxWidth: "360px",
        }}
      >
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => handleSelect(theme.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "20px",
              borderRadius: "var(--radius-md)",
              border:
                selected === theme.id
                  ? "2px solid var(--color-primary)"
                  : "2px solid var(--color-border)",
              background:
                selected === theme.id
                  ? "var(--color-bg-card)"
                  : "var(--color-bg-card)",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow:
                selected === theme.id
                  ? "0 4px 12px rgba(0,0,0,0.1)"
                  : "none",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: "32px" }}>{theme.emoji}</span>
            <div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "var(--color-text)",
                }}
              >
                {theme.label}
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 400,
                    color: "var(--color-text-muted)",
                    marginLeft: "8px",
                  }}
                >
                  {theme.ages}
                </span>
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "var(--color-text-light)",
                  marginTop: "2px",
                }}
              >
                {theme.description}
              </div>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <button
          style={{
            padding: "16px 48px",
            borderRadius: "var(--radius-full)",
            border: "none",
            background: "var(--color-primary)",
            color: "#FFFFFF",
            fontSize: "18px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          Continue
        </button>
      )}
    </div>
  );
}