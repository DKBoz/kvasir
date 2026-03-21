"use client";

import { useAuth } from "@/context/AuthContext";

export default function GamesPage() {
  const { profile } = useAuth();

  return (
    <div style={{ padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "var(--color-text)",
          }}
        >
          Games
        </h1>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 14px",
            borderRadius: "var(--radius-full)",
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
          }}
        >
          <span style={{ fontSize: "16px" }}>🪙</span>
          <span
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "var(--color-token)",
            }}
          >
            {profile?.tokens || 0}
          </span>
        </div>
      </div>
      <div
        style={{
          marginTop: "40px",
          textAlign: "center",
          color: "var(--color-text-muted)",
        }}
      >
        Games coming soon
      </div>
    </div>
  );
}