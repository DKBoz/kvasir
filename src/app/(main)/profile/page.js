"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

const avatars = ["😊", "😎", "🤓", "🦊", "🐱", "🐶", "🦁", "🐼", "🦄", "🐸", "🌟", "🚀", "🎨", "🎵", "⚡", "🔥"];

export default function ProfilePage() {
  const { profile, signOut, updateProfile } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.name || "");
  const [selectedAvatar, setSelectedAvatar] = useState(profile?.avatar || "😊");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await updateProfile({ name: name.trim(), avatar: selectedAvatar });
    setSaving(false);
    setEditing(false);
  }

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  const displayName = profile?.name || "Learner";
  const displayAvatar = profile?.avatar || "😊";
  const ageTrackLabel = profile?.age_track === "kids" ? "Kids" : profile?.age_track === "teens" ? "Teens" : "Adults";
  const levelLabel = profile?.current_level?.toUpperCase() || "PRE-A1";

  // Editing mode
  if (editing) {
    return (
      <div style={{ padding: "24px", paddingBottom: "100px" }}>
        <button onClick={() => setEditing(false)} className="animate-fade-in" style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", color: "var(--color-primary)", fontSize: "15px", fontWeight: 600, padding: "0", marginBottom: "24px" }}>
          ← Cancel
        </button>

        <h1 className="animate-fade-in" style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text)", marginBottom: "32px" }}>Edit Profile</h1>

        {/* Avatar picker */}
        <div className="animate-slide-up" style={{ marginBottom: "32px" }}>
          <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text)", marginBottom: "16px" }}>Choose Avatar</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            {avatars.map((av) => (
              <button
                key={av}
                onClick={() => setSelectedAvatar(av)}
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  border: selectedAvatar === av ? "3px solid var(--color-primary)" : "2px solid var(--color-border)",
                  background: selectedAvatar === av ? "var(--color-primary-light)" : "var(--color-bg-card)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "28px",
                  transition: "all 0.2s ease",
                  boxShadow: selectedAvatar === av ? "0 4px 12px rgba(108, 92, 231, 0.2)" : "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                {av}
              </button>
            ))}
          </div>
        </div>

        {/* Name input */}
        <div className="animate-slide-up" style={{ marginBottom: "32px" }}>
          <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text)", marginBottom: "12px" }}>Display Name</p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What should we call you?"
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: "var(--radius-md)",
              border: "2px solid var(--color-border)",
              background: "var(--color-bg-card)",
              fontSize: "16px",
              color: "var(--color-text)",
              outline: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          />
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="animate-slide-up"
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "var(--radius-full)",
            border: "none",
            background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
            color: "#FFFFFF",
            fontSize: "16px",
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    );
  }

  // View mode
  return (
    <div style={{ padding: "24px", paddingBottom: "100px" }}>
      <h1 className="animate-fade-in" style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text)", marginBottom: "24px" }}>Profile</h1>

      {/* Profile card */}
      <div className="animate-slide-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "32px 24px", borderRadius: "var(--radius-lg)", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", marginBottom: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ width: "88px", height: "88px", borderRadius: "50%", background: "var(--color-primary-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "44px", boxShadow: "0 4px 16px rgba(108, 92, 231, 0.2)" }}>
          {displayAvatar}
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text)" }}>{displayName}</div>
          <div style={{ fontSize: "14px", color: "var(--color-text-light)", marginTop: "4px" }}>{profile?.email}</div>
        </div>

        {/* Badges row */}
        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          <span style={{ padding: "4px 12px", borderRadius: "var(--radius-full)", background: "var(--color-primary-light)", color: "var(--color-primary-dark)", fontSize: "13px", fontWeight: 600 }}>{ageTrackLabel}</span>
          <span style={{ padding: "4px 12px", borderRadius: "var(--radius-full)", background: "var(--color-border)", color: "var(--color-text)", fontSize: "13px", fontWeight: 600 }}>{levelLabel}</span>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "24px", marginTop: "12px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-xp)" }}>{profile?.xp || 0}</div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>XP</div>
          </div>
          <div style={{ width: "1px", background: "var(--color-border)" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-token)" }}>{profile?.tokens || 0}</div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Tokens</div>
          </div>
          <div style={{ width: "1px", background: "var(--color-border)" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-primary)" }}>{profile?.streak_current || 0}</div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Streak</div>
          </div>
        </div>
      </div>

      {/* Edit button */}
      <button
        onClick={() => setEditing(true)}
        className="animate-slide-up"
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "var(--radius-md)",
          border: "2px solid var(--color-primary)",
          background: "transparent",
          color: "var(--color-primary)",
          fontSize: "15px",
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        Edit Profile
      </button>

      {/* Settings section */}
      <div className="animate-slide-up" style={{ marginTop: "16px", borderRadius: "var(--radius-md)", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <button
          onClick={() => {}}
          style={{ width: "100%", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", borderBottom: "1px solid var(--color-border)", cursor: "pointer", fontSize: "15px", color: "var(--color-text)" }}
        >
          <span>Daily Goal</span>
          <span style={{ color: "var(--color-text-muted)" }}>{profile?.daily_goal || 3} lessons →</span>
        </button>
        <button
          onClick={() => {}}
          style={{ width: "100%", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", borderBottom: "1px solid var(--color-border)", cursor: "pointer", fontSize: "15px", color: "var(--color-text)" }}
        >
          <span>Age Track</span>
          <span style={{ color: "var(--color-text-muted)" }}>{ageTrackLabel} →</span>
        </button>
        <button
          onClick={() => {}}
          style={{ width: "100%", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", fontSize: "15px", color: "var(--color-text)" }}
        >
          <span>Sound</span>
          <span style={{ color: "var(--color-text-muted)" }}>On →</span>
        </button>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="animate-slide-up"
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
          marginTop: "24px",
        }}
      >
        Sign Out
      </button>
    </div>
  );
}