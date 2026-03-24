"use client";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function LearnPage() {
  const { profile } = useAuth();
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.age_track && profile?.current_level) {
      fetchNodes();
    }
  }, [profile]);

  async function fetchNodes() {
    const { data } = await supabase
      .from("skill_nodes")
      .select("*")
      .eq("age_track", profile.age_track)
      .eq("level", profile.current_level)
      .order("sort_order");
    setNodes(data || []);
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
        <p style={{ color: "var(--color-text-muted)" }}>Loading skill tree...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", paddingBottom: "100px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "var(--color-text)",
            }}
          >
            Skill Tree
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--color-text-light)",
              marginTop: "4px",
            }}
          >
            {profile?.current_level?.toUpperCase()} · {profile?.age_track}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 12px",
              borderRadius: "var(--radius-full)",
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
            }}
          >
            <span style={{ fontSize: "14px" }}>⚡</span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--color-xp)",
              }}
            >
              {profile?.xp || 0}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 12px",
              borderRadius: "var(--radius-full)",
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
            }}
          >
            <span style={{ fontSize: "14px" }}>🪙</span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--color-token)",
              }}
            >
              {profile?.tokens || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Skill Tree Path */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0px",
        }}
      >
        {nodes.map((node, index) => {
          const isEven = index % 2 === 0;
          return (
            <div key={node.id}>
              {/* Connector line */}
              {index > 0 && (
                <div
                  style={{
                    width: "3px",
                    height: "32px",
                    background: "var(--color-border)",
                    margin: "0 auto",
                  }}
                />
              )}

              {/* Node */}
              <button
                onClick={() => {}}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "16px 20px",
                  borderRadius: "var(--radius-lg)",
                  border: "2px solid var(--color-border)",
                  background: "var(--color-bg-card)",
                  cursor: "pointer",
                  width: "280px",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                  transform: `translateX(${isEven ? "-20px" : "20px"})`,
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: "var(--color-primary-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    flexShrink: 0,
                  }}
                >
                  {node.icon}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "var(--color-text)",
                    }}
                  >
                    {node.title}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "var(--color-text-muted)",
                      marginTop: "2px",
                    }}
                  >
                    {node.description}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}