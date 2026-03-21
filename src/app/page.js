"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  const { user, profile, loading, updateProfile, signOut } = useAuth();
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  function handleSelect(themeId) {
    setSelected(themeId);
    document.documentElement.setAttribute("data-theme", themeId);
  }

  async function handleContinue() {
    if (!selected) return;
    setSaving(true);
    await updateProfile({ age_track: selected });
    setSaving(false);
  }

  // Loading state
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--color-bg)",
        }}
      >
        <p style={{ color: "var(--color-text-light)", fontSize: "16px" }}>
          Loading...
        </p>
      </div>
    );
  }

  // Not logged in — show welcome screen
  if (!user) {
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
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontSize: "36px",
              fontWeight: 700,
              color: "var(--color-text)",
              marginBottom: "12px",
            }}
          >
            Kvasir
          </h1>
          <p
            style={{
              fontSize: "18px",
              color: "var(--color-text-light)",
              maxWidth: "300px",
            }}
          >
            Master English through immersive lessons and games
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            width: "100%",
            maxWidth: "320px",
          }}
        >
          <Link
            href="/signup"
            style={{
              display: "block",
              padding: "16px",
              borderRadius: "var(--radius-full)",
              background: "var(--color-primary)",
              color: "#FFFFFF",
              fontSize: "16px",
              fontWeight: 600,
              textAlign: "center",
              textDecoration: "none",
            }}
          >
            Get Started
          </Link>
          <Link
            href="/login"
            style={{
              display: "block",
              padding: "16px",
              borderRadius: "var(--radius-full)",
              border: "2px solid var(--color-primary)",
              color: "var(--color-primary)",
              fontSize: "16px",
              fontWeight: 600,
              textAlign: "center",
              textDecoration: "none",
              background: "transparent",
            }}
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  // Logged in but no age track — show selector
  if (profile && !profile.age_track) {
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
              fontSize: "28px",
              fontWeight: 700,
              color: "var(--color-text)",
              marginBottom: "8px",
            }}
          >
            Choose Your Path
          </h1>
          <p style={{ fontSize: "15px", color: "var(--color-text-light)" }}>
            This helps us personalize your experience
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
                background: "var(--color-bg-card)",
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
            onClick={handleContinue}
            disabled={saving}
            style={{
              padding: "16px 48px",
              borderRadius: "var(--radius-full)",
              border: "none",
              background: "var(--color-primary)",
              color: "#FFFFFF",
              fontSize: "18px",
              fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
              transition: "all 0.2s ease",
            }}
          >
            {saving ? "Saving..." : "Continue"}
          </button>
        )}
      </div>
    );
  }

  // Logged in with age track — main app (temporary placeholder)
  if (profile) {
    document.documentElement.setAttribute("data-theme", profile.age_track);
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          gap: "24px",
          background: "var(--color-bg)",
        }}
      >
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: "var(--color-text)",
          }}
        >
          Welcome, {profile.name || profile.email}!
        </h1>
        <p style={{ color: "var(--color-text-light)" }}>
          Age track: {profile.age_track} · Level: {profile.current_level} · XP: {profile.xp} · Tokens: {profile.tokens}
        </p>
        <button
          onClick={signOut}
          style={{
            padding: "12px 32px",
            borderRadius: "var(--radius-full)",
            border: "2px solid var(--color-error)",
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
}