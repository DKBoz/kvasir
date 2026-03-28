"use client";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function NodePage() {
  const { profile } = useAuth();
  const { nodeId } = useParams();
  const router = useRouter();
  const [node, setNode] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (nodeId && profile) fetchNodeAndLessons();
  }, [nodeId, profile]);

  async function fetchNodeAndLessons() {
    const { data: nodeData } = await supabase.from("skill_nodes").select("*").eq("id", nodeId).single();
    const { data: lessonData } = await supabase.from("lessons").select("*").eq("node_id", nodeId).order("sort_order");
    const { data: progressData } = await supabase.from("user_progress").select("*").eq("user_id", profile.id).eq("node_id", nodeId);

    const progressMap = {};
    (progressData || []).forEach((p) => { progressMap[p.lesson_id] = p; });

    setNode(nodeData);
    setLessons(lessonData || []);
    setProgress(progressMap);
    setLoading(false);
  }

  if (loading) {
    return (
      <div style={{ padding: "24px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <p className="animate-fade-in" style={{ color: "var(--color-text-muted)" }}>Loading...</p>
      </div>
    );
  }

  const completedCount = Object.values(progress).filter((p) => p.completed).length;
  const totalCount = lessons.length;
  const allComplete = totalCount > 0 && completedCount >= totalCount;

  return (
    <div style={{ padding: "24px", paddingBottom: "100px" }}>
      {/* Back button */}
      <button
        onClick={() => router.push("/learn")}
        className="animate-fade-in"
        style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", color: "var(--color-primary)", fontSize: "15px", fontWeight: 600, padding: "0", marginBottom: "24px" }}
      >
        ← Back
      </button>

      {/* Node header */}
      <div className="animate-slide-up" style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: allComplete ? "var(--color-success)" : "var(--color-primary-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: allComplete ? "24px" : "28px",
            color: allComplete ? "#FFFFFF" : "inherit",
            flexShrink: 0,
            boxShadow: allComplete ? "0 4px 12px rgba(0, 184, 148, 0.3)" : "none",
          }}
        >
          {allComplete ? "⭐" : node?.icon}
        </div>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text)" }}>{node?.title}</h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-light)", marginTop: "2px" }}>{node?.description}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="animate-slide-up" style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
            {completedCount} of {totalCount} lessons
          </span>
          <span style={{ fontSize: "13px", fontWeight: 600, color: allComplete ? "var(--color-success)" : "var(--color-primary)" }}>
            {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
          </span>
        </div>
        <div style={{ height: "8px", borderRadius: "4px", background: "var(--color-border)", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
              borderRadius: "4px",
              background: allComplete
                ? "linear-gradient(90deg, var(--color-success), #1DD1A1)"
                : "linear-gradient(90deg, var(--color-primary), var(--color-primary-light))",
              transition: "width 0.5s ease",
            }}
          />
        </div>
      </div>

      {/* All complete banner */}
      {allComplete && (
        <div className="animate-bounce-in" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", borderRadius: "var(--radius-md)", background: "var(--color-bg-card)", border: "2px solid var(--color-success)", marginBottom: "24px", boxShadow: "0 4px 12px rgba(0, 184, 148, 0.15)" }}>
          <span style={{ fontSize: "28px" }}>🏆</span>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-success)" }}>Node Complete!</div>
            <div style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>All lessons finished</div>
          </div>
        </div>
      )}

      {/* Lesson list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {lessons.map((lesson, index) => {
          const lessonProgress = progress[lesson.id];
          const isCompleted = lessonProgress?.completed;
          const lessonScore = lessonProgress?.score;

          return (
            <button
              key={lesson.id}
              onClick={() => router.push(`/learn/${nodeId}/${lesson.id}`)}
              className="animate-slide-up"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "16px 20px",
                borderRadius: "var(--radius-md)",
                border: isCompleted ? "2px solid var(--color-success)" : "2px solid var(--color-border)",
                background: "var(--color-bg-card)",
                textDecoration: "none",
                transition: "all 0.2s ease",
                cursor: "pointer",
                textAlign: "left",
                boxShadow: isCompleted ? "0 2px 8px rgba(0, 184, 148, 0.1)" : "0 2px 8px rgba(0,0,0,0.04)",
                animationDelay: `${index * 0.08}s`,
                animationFillMode: "both",
              }}
            >
              {/* Lesson number or checkmark */}
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: isCompleted ? "var(--color-success)" : "var(--color-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: isCompleted ? "18px" : "16px",
                  fontWeight: 700,
                  color: isCompleted ? "#FFFFFF" : "var(--color-text-muted)",
                  flexShrink: 0,
                }}
              >
                {isCompleted ? "✓" : index + 1}
              </div>

              {/* Lesson info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-text)" }}>
                  {lesson.title}
                </div>
                <div style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "2px", display: "flex", gap: "12px" }}>
                  {isCompleted ? (
                    <>
                      <span style={{ color: "var(--color-success)", fontWeight: 600 }}>Completed</span>
                      {lessonScore !== undefined && <span>Score: {lessonScore}</span>}
                    </>
                  ) : (
                    <>
                      <span>~{lesson.estimated_minutes} min</span>
                      <span>⚡ {lesson.xp_reward} XP</span>
                      <span>🪙 {lesson.token_reward}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Arrow or replay */}
              <span style={{ color: "var(--color-text-muted)", fontSize: "18px" }}>
                {isCompleted ? "↻" : "→"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}