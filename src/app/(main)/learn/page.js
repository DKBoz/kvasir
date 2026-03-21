"use client";

import { useAuth } from "@/context/AuthContext";

export default function LearnPage() {
  const { profile } = useAuth();

  return (
    <div style={{ padding: "24px" }}>
      <h1
        style={{
          fontSize: "24px",
          fontWeight: 700,
          color: "var(--color-text)",
          marginBottom: "8px",
        }}
      >
        Skill Tree
      </h1>
      <p style={{ color: "var(--color-text-light)" }}>
        Level: {profile?.current_level?.toUpperCase()} · {profile?.age_track}
      </p>
      <div
        style={{
          marginTop: "40px",
          textAlign: "center",
          color: "var(--color-text-muted)",
        }}
      >
        Skill tree coming soon
      </div>
    </div>
  );
}