"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { profile, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

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
        Profile
      </h1>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          padding: "32px 24px",
          borderRadius: "var(--radius-lg)",
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "var(--color-primary-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "32px",
            color: "#FFFFFF",
            fontWeight: 700,
          }}
        >
          {(profile?.name || profile?.email || "?")[0].toUpperCase()}
        </div>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "var(--color-text)",
            }}
          >
            {profile?.name || "No name set"}
          </div>
          <div
            style={{
              fontSize: "14px",
              color: "var(--color-text-light)",
              marginTop: "4px",
            }}
          >
            {profile?.email}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginTop: "8px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-xp)" }}>
              {profile?.xp || 0}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>XP</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-token)" }}>
              {profile?.tokens || 0}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Tokens</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-primary)" }}>
              {profile?.streak_current || 0}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Streak</div>
          </div>
        </div>
      </div>

      <button
        onClick={handleSignOut}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-error)",
          background: "transparent",
          color: "var(--color-error)",
          fontSize: "15px",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Sign Out
      </button>
    </div>
  );
}