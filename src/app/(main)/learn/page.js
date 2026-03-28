"use client";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LearnPage() {
  const { profile } = useAuth();
  const [nodes, setNodes] = useState([]);
  const [progress, setProgress] = useState({});
  const [lessonCounts, setLessonCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (profile?.age_track && profile?.current_level) {
      fetchData();
    }
  }, [profile]);

  async function fetchData() {
    // Fetch nodes
    const { data: nodeData } = await supabase
      .from("skill_nodes")
      .select("*")
      .eq("age_track", profile.age_track)
      .eq("level", profile.current_level)
      .order("sort_order");

    // Fetch all lessons for these nodes to get counts
    const nodeIds = (nodeData || []).map((n) => n.id);
    const { data: lessonData } = await supabase
      .from("lessons")
      .select("id, node_id")
      .in("node_id", nodeIds);

    // Build lesson count per node
    const counts = {};
    (lessonData || []).forEach((l) => {
      counts[l.node_id] = (counts[l.node_id] || 0) + 1;
    });

    // Fetch user progress
    const { data: progressData } = await supabase
      .from("user_progress")
      .select("node_id, lesson_id, completed")
      .eq("user_id", profile.id)
      .eq("completed", true);

    // Build completed count per node
    const completedPerNode = {};
    (progressData || []).forEach((p) => {
      completedPerNode[p.node_id] = (completedPerNode[p.node_id] || 0) + 1;
    });

    setNodes(nodeData || []);
    setLessonCounts(counts);
    setProgress(completedPerNode);
    setLoading(false);
  }

  if (loading) {
    return (
      <div style={{ padding: "24px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <p className="animate-fade-in" style={{ color: "var(--color-text-muted)" }}>Loading skill tree...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", paddingBottom: "100px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text)" }}>Skill Tree</h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-light)", marginTop: "4px" }}>
            {profile?.current_level?.toUpperCase()} · {profile?.age_track}
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", borderRadius: "var(--radius-full)", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <span style={{ fontSize: "14px" }}>⚡</span>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-xp)" }}>{profile?.xp || 0}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", borderRadius: "var(--radius-full)", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <span style={{ fontSize: "14px" }}>🪙</span>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-token)" }}>{profile?.tokens || 0}</span>
          </div>
        </div>
      </div>

      {/* Streak banner */}
      {profile?.streak_current > 0 && (
        <div className="animate-slide-up" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <span style={{ fontSize: "24px" }}>🔥</span>
          <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text)" }}>{profile.streak_current} day streak!</span>
        </div>
      )}

      {/* Skill Tree */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0px" }}>
        {nodes.map((node, index) => {
          const isEven = index % 2 === 0;
          const total = lessonCounts[node.id] || 0;
          const done = progress[node.id] || 0;
          const isComplete = total > 0 && done >= total;
          const hasProgress = done > 0 && !isComplete;

          return (
            <div key={node.id}>
              {/* Connector */}
              {index > 0 && (
                <div style={{ width: "3px", height: "32px", background: isComplete || hasProgress ? "var(--color-primary-light)" : "var(--color-border)", margin: "0 auto", transition: "background 0.3s ease" }} />
              )}

              {/* Node */}
              <button
                onClick={() => router.push(`/learn/${node.id}`)}
                className={index === 0 ? "animate-slide-up" : ""}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "16px 20px",
                  borderRadius: "var(--radius-lg)",
                  border: isComplete
                    ? "2px solid var(--color-success)"
                    : hasProgress
                    ? "2px solid var(--color-primary)"
                    : "2px solid var(--color-border)",
                  background: "var(--color-bg-card)",
                  cursor: "pointer",
                  width: "280px",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                  transform: `translateX(${isEven ? "-20px" : "20px"})`,
                  boxShadow: isComplete
                    ? "0 4px 12px rgba(0, 184, 148, 0.15)"
                    : hasProgress
                    ? "0 4px 12px rgba(108, 92, 231, 0.15)"
                    : "0 2px 8px rgba(0,0,0,0.04)",
                  animationDelay: `${index * 0.08}s`,
                  animationFillMode: "both",
                }}
              >
                {/* Icon */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      background: isComplete
                        ? "var(--color-success)"
                        : hasProgress
                        ? "var(--color-primary-light)"
                        : "var(--color-border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {isComplete ? "✓" : node.icon}
                  </div>

                  {/* Progress ring */}
                  {hasProgress && (
                    <svg
                      width="56"
                      height="56"
                      style={{
                        position: "absolute",
                        top: "-4px",
                        left: "-4px",
                      }}
                    >
                      <circle
                        cx="28"
                        cy="28"
                        r="25"
                        fill="none"
                        stroke="var(--color-border)"
                        strokeWidth="3"
                      />
                      <circle
                        cx="28"
                        cy="28"
                        r="25"
                        fill="none"
                        stroke="var(--color-primary)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${(done / total) * 157} 157`}
                        transform="rotate(-90 28 28)"
                        style={{ transition: "stroke-dasharray 0.5s ease" }}
                      />
                    </svg>
                  )}
                </div>

                {/* Text */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-text)" }}>
                    {node.title}
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                    {isComplete
                      ? "Complete! ⭐"
                      : hasProgress
                      ? `${done}/${total} lessons`
                      : node.description}
                  </div>
                </div>

                {/* Chevron */}
                <span style={{ color: "var(--color-text-muted)", fontSize: "18px" }}>→</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}