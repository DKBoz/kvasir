"use client";

import { useAuth } from "@/context/AuthContext";

export default function ProgressPage() {
  const { profile } = useAuth();

  return (
    <div style={{ padding: "24px" }}>
      <h1
        style={{
          fontSize: "24px",
          fontWeight: 700,
          color: "var(--color-text)",
          marginBottom: "24px",
        }}
      >
        Progress
      </h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
        }}
      >
        <div
          style={{
            padding: "20px",
            borderRadius: "var(--radius-md)",
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-xp)" }}>
            {profile?.xp || 0}
          </div>
          <div style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Total XP
          </div>
        </div>
        <div
          style={{
            padding: "20px",
            borderRadius: "var(--radius-md)",
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-token)" }}>
            {profile?.tokens || 0}
          </div>
          <div style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Tokens
          </div>
        </div>
        <div
          style={{
            padding: "20px",
            borderRadius: "var(--radius-md)",
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-primary)" }}>
            {profile?.streak_current || 0}
          </div>
          <div style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Day Streak
          </div>
        </div>
        <div
          style={{
            padding: "20px",
            borderRadius: "var(--radius-md)",
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "var(--color-text)",
              textTransform: "uppercase",
            }}
          >
            {profile?.current_level || "—"}
          </div>
          <div style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Level
          </div>
        </div>
      </div>
    </div>
  );
}