"use client";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function ProgressPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ lessons: 0, nodes: 0, totalLessons: 0, totalNodes: 0 });
  const [recentLessons, setRecentLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) fetchStats();
  }, [profile]);

  async function fetchStats() {
    // Total completed lessons
    const { data: completedData } = await supabase
      .from("user_progress")
      .select("lesson_id, node_id, completed, score, completed_at")
      .eq("user_id", profile.id)
      .eq("completed", true)
      .order("completed_at", { ascending: false });

    // Total available lessons for this age track + level
    const { data: nodeData } = await supabase
      .from("skill_nodes")
      .select("id")
      .eq("age_track", profile.age_track)
      .eq("level", profile.current_level);

    const nodeIds = (nodeData || []).map((n) => n.id);

    const { data: allLessons } = await supabase
      .from("lessons")
      .select("id, node_id, title")
      .in("node_id", nodeIds);

    // Count completed nodes
    const completedPerNode = {};
    const lessonsPerNode = {};
    (allLessons || []).forEach((l) => {
      lessonsPerNode[l.node_id] = (lessonsPerNode[l.node_id] || 0) + 1;
    });
    (completedData || []).forEach((p) => {
      completedPerNode[p.node_id] = (completedPerNode[p.node_id] || 0) + 1;
    });

    let completedNodes = 0;
    Object.keys(lessonsPerNode).forEach((nid) => {
      if ((completedPerNode[nid] || 0) >= lessonsPerNode[nid]) completedNodes++;
    });

    // Get recent lesson titles
    const recentIds = (completedData || []).slice(0, 5).map((p) => p.lesson_id);
    const { data: recentData } = await supabase
      .from("lessons")
      .select("id, title")
      .in("id", recentIds.length > 0 ? recentIds : ["none"]);

    const titleMap = {};
    (recentData || []).forEach((l) => { titleMap[l.id] = l.title; });

    const recent = (completedData || []).slice(0, 5).map((p) => ({
      ...p,
      title: titleMap[p.lesson_id] || "Lesson",
    }));

    setStats({
      lessons: (completedData || []).length,
      nodes: completedNodes,
      totalLessons: (allLessons || []).length,
      totalNodes: nodeIds.length,
    });
    setRecentLessons(recent);
    setLoading(false);
  }

  if (loading) {
    return (
      <div style={{ padding: "24px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <p className="animate-fade-in" style={{ color: "var(--color-text-muted)" }}>Loading...</p>
      </div>
    );
  }

  const lessonPercent = stats.totalLessons > 0 ? Math.round((stats.lessons / stats.totalLessons) * 100) : 0;

  return (
    <div style={{ padding: "24px", paddingBottom: "100px" }}>
      <h1 className="animate-fade-in" style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text)", marginBottom: "24px" }}>Progress</h1>

      {/* Stats grid */}
      <div className="animate-slide-up" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
        <div style={{ padding: "20px", borderRadius: "var(--radius-md)", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-xp)" }}>{profile?.xp || 0}</div>
          <div style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "4px" }}>Total XP</div>
        </div>
        <div style={{ padding: "20px", borderRadius: "var(--radius-md)", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-token)" }}>{profile?.tokens || 0}</div>
          <div style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "4px" }}>Tokens</div>
        </div>
        <div style={{ padding: "20px", borderRadius: "var(--radius-md)", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-primary)" }}>{profile?.streak_current || 0}</div>
          <div style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "4px" }}>Day Streak</div>
        </div>
        <div style={{ padding: "20px", borderRadius: "var(--radius-md)", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-text)", textTransform: "uppercase" }}>{profile?.current_level || "—"}</div>
          <div style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "4px" }}>Level</div>
        </div>
      </div>

      {/* Overall progress */}
      <div className="animate-slide-up" style={{ padding: "20px", borderRadius: "var(--radius-md)", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text)" }}>Overall Progress</span>
          <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-primary)" }}>{lessonPercent}%</span>
        </div>
        <div style={{ height: "10px", borderRadius: "5px", background: "var(--color-border)", overflow: "hidden", marginBottom: "12px" }}>
          <div style={{ height: "100%", width: `${lessonPercent}%`, borderRadius: "5px", background: "linear-gradient(90deg, var(--color-primary), var(--color-primary-light))", transition: "width 0.5s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--color-text-muted)" }}>
          <span>{stats.lessons} / {stats.totalLessons} lessons</span>
          <span>{stats.nodes} / {stats.totalNodes} nodes complete</span>
        </div>
      </div>

      {/* Recent activity */}
      {recentLessons.length > 0 && (
        <div className="animate-slide-up">
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--color-text)", marginBottom: "16px" }}>Recent Activity</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {recentLessons.map((lesson, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px 16px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-bg-card)",
                  border: "1px solid var(--color-border)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--color-success)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", color: "#FFFFFF", flexShrink: 0 }}>✓</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text)" }}>{lesson.title}</div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                    Score: {lesson.score} · {new Date(lesson.completed_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {recentLessons.length === 0 && (
        <div className="animate-fade-in" style={{ textAlign: "center", padding: "40px 24px", color: "var(--color-text-muted)" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📚</div>
          <p style={{ fontSize: "16px" }}>Complete your first lesson to see your progress here!</p>
        </div>
      )}
    </div>
  );
}