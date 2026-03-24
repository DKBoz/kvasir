"use client";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function NodePage() {
  const { profile } = useAuth();
  const { nodeId } = useParams();
  const router = useRouter();
  const [node, setNode] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (nodeId && profile) {
      fetchNodeAndLessons();
    }
  }, [nodeId, profile]);

  async function fetchNodeAndLessons() {
    // Fetch node info
    const { data: nodeData } = await supabase
      .from("skill_nodes")
      .select("*")
      .eq("id", nodeId)
      .single();

    // Fetch lessons for this node
    const { data: lessonData } = await supabase
      .from("lessons")
      .select("*")
      .eq("node_id", nodeId)
      .order("sort_order");

    // Fetch user progress for these lessons
    const { data: progressData } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", profile.id)
      .eq("node_id", nodeId);

    // Build progress map
    const progressMap = {};
    (progressData || []).forEach((p) => {
      progressMap[p.lesson_id] = p;
    });

    setNode(nodeData);
    setLessons(lessonData || []);
    setProgress(progressMap);
    setLoading(false);
  }

  if (loading) {
    return (
      <div
        style={{
          padding: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
        }}
      >
        <p style={{ color: "var(--color-text-muted)" }}>Loading...</p>
      </div>
    );
  }

  const completedCount = Object.values(progress).filter((p) => p.completed).length;
  const totalCount = lessons.length;

  return (
    <div style={{ padding: "24px", paddingBottom: "100px" }}>
      {/* Back button */}
      <button
        onClick={() => router.push("/learn")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--color-primary)",
          fontSize: "15px",
          fontWeight: 600,
          padding: "0",
          marginBottom: "24px",
        }}
      >
        ← Back to Skill Tree
      </button>

      {/* Node header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "var(--color-primary-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
            flexShrink: 0,
          }}
        >
          {node?.icon}
        </div>
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "var(--color-text)",
            }}
          >
            {node?.title}
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--color-text-light)",
              marginTop: "2px",
            }}
          >
            {node?.description}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}
        >
          <span
            style={{
              fontSize: "13px",
              color: "var(--color-text-muted)",
            }}
          >
            {completedCount} of {totalCount} lessons completed
          </span>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--color-primary)",
            }}
          >
            {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
          </span>
        </div>
        <div
          style={{
            height: "8px",
            borderRadius: "4px",
            background: "var(--color-border)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
              borderRadius: "4px",
              background: "var(--color-primary)",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* Lesson list */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {lessons.map((lesson, index) => {
          const lessonProgress = progress[lesson.id];
          const isCompleted = lessonProgress?.completed;
          const isLocked = false; // soft gating — nothing locked

          return (
            <Link
              key={lesson.id}
              href={`/learn/${nodeId}/${lesson.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "16px 20px",
                borderRadius: "var(--radius-md)",
                border: isCompleted
                  ? "2px solid var(--color-success)"
                  : "2px solid var(--color-border)",
                background: "var(--color-bg-card)",
                textDecoration: "none",
                transition: "all 0.2s ease",
              }}
            >
              {/* Lesson number */}
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: isCompleted
                    ? "var(--color-success)"
                    : "var(--color-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: isCompleted ? "#FFFFFF" : "var(--color-text-muted)",
                  flexShrink: 0,
                }}
              >
                {isCompleted ? "✓" : index + 1}
              </div>

              {/* Lesson info */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "var(--color-text)",
                  }}
                >
                  {lesson.title}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--color-text-muted)",
                    marginTop: "2px",
                    display: "flex",
                    gap: "12px",
                  }}
                >
                  <span>~{lesson.estimated_minutes} min</span>
                  <span>⚡ {lesson.xp_reward} XP</span>
                  <span>🪙 {lesson.token_reward}</span>
                </div>
              </div>

              {/* Arrow */}
              <span
                style={{
                  color: "var(--color-text-muted)",
                  fontSize: "18px",
                }}
              >
                →
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}