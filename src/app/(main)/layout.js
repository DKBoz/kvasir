"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import BottomNav from "@/components/BottomNav";

export default function MainLayout({ children }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (profile?.age_track) {
      document.documentElement.setAttribute("data-theme", profile.age_track);
    }
  }, [profile]);

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
        <p style={{ color: "var(--color-text-light)" }}>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ paddingBottom: "var(--bottom-nav-height)" }}>
      {children}
      <BottomNav />
    </div>
  );
}