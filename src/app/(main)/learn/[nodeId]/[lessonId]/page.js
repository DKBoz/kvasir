"use client";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function LessonPage() {
  const { profile, updateProfile } = useAuth();
  const { nodeId, lessonId } = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stageIndex, setStageIndex] = useState(0);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [typed, setTyped] = useState("");
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [presentIndex, setPresentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  function speak(text) {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.85;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  }

  useEffect(() => {
    if (lessonId) fetchLesson();
  }, [lessonId]);

  async function fetchLesson() {
    const { data } = await supabase
      .from("lessons")
      .select("*")
      .eq("id", lessonId)
      .single();
    setLesson(data);
    setLoading(false);
  }

  if (loading || !lesson) {
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
        <p style={{ color: "var(--color-text-muted)" }}>Loading lesson...</p>
      </div>
    );
  }

  const stages = lesson.content?.stages || [];
  const currentStage = stages[stageIndex];
  const totalStages = stages.length;
  const progressPercent = (stageIndex / totalStages) * 100;

  // ==========================================
  // COMPLETION SCREEN
  // ==========================================
  if (completed) {
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
        <div style={{ fontSize: "64px" }}>🎉</div>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: "var(--color-text)",
          }}
        >
          Lesson Complete!
        </h1>
        <p style={{ color: "var(--color-text-light)", textAlign: "center" }}>
          You scored {score} out of {totalQuestions}
        </p>

        <div
          style={{
            display: "flex",
            gap: "24px",
            marginTop: "16px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "var(--color-xp)",
              }}
            >
              +{lesson.xp_reward}
            </div>
            <div style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
              XP
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "var(--color-token)",
              }}
            >
              +{lesson.token_reward}
            </div>
            <div style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
              Tokens
            </div>
          </div>
        </div>

        <button
          onClick={() => router.push(`/learn/${nodeId}`)}
          style={{
            marginTop: "24px",
            padding: "16px 48px",
            borderRadius: "var(--radius-full)",
            border: "none",
            background: "var(--color-primary)",
            color: "#FFFFFF",
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Continue
        </button>
      </div>
    );
  }

  if (!currentStage) return null;

  // ==========================================
  // HANDLE MOVING TO NEXT
  // ==========================================
  function handleNext() {
    setSelected(null);
    setAnswered(false);
    setIsCorrect(false);
    setTyped("");

    const stage = stages[stageIndex];

    if (stage.type === "present") {
      if (presentIndex < stage.items.length - 1) {
        const nextItem = stage.items[presentIndex + 1];
        setPresentIndex(presentIndex + 1);
        speak(nextItem.audio || `${nextItem.letter} is for ${nextItem.word}`);
        return;
      }
      setPresentIndex(0);
      setStageIndex(stageIndex + 1);
      setExerciseIndex(0);
      return;
    }

    if (stage.type === "examples") {
      if (presentIndex < stage.items.length - 1) {
        const nextItem = stage.items[presentIndex + 1];
        setPresentIndex(presentIndex + 1);
        speak(nextItem.prompt);
        return;
      }
      setPresentIndex(0);
      setStageIndex(stageIndex + 1);
      setExerciseIndex(0);
      return;
    }

    const exercises = stage.exercises || [];
    if (exerciseIndex < exercises.length - 1) {
      const nextEx = exercises[exerciseIndex + 1];
      setExerciseIndex(exerciseIndex + 1);
      if (nextEx.question) speak(nextEx.question);
      else if (nextEx.sentence) speak(nextEx.sentence);
    } else {
      if (stageIndex < stages.length - 1) {
        setStageIndex(stageIndex + 1);
        setExerciseIndex(0);
        setPresentIndex(0);
      } else {
        saveLessonComplete();
      }
    }
  }

  async function saveLessonComplete() {
    setCompleted(true);
    speak("Lesson complete! Great job!");

    await supabase.from("user_progress").upsert(
      {
        user_id: profile.id,
        lesson_id: lessonId,
        node_id: nodeId,
        completed: true,
        score: score,
        xp_earned: lesson.xp_reward,
        tokens_earned: lesson.token_reward,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" }
    );

    await updateProfile({
      xp: (profile.xp || 0) + lesson.xp_reward,
      tokens: (profile.tokens || 0) + lesson.token_reward,
    });
  }

  // ==========================================
  // HANDLE ANSWER
  // ==========================================
  function handleMultipleChoice(optionIndex, correct) {
    if (answered) return;
    setSelected(optionIndex);
    setAnswered(true);
    setTotalQuestions((t) => t + 1);
    if (optionIndex === correct) {
      setIsCorrect(true);
      setScore((s) => s + 1);
      speak("Correct!");
    } else {
      setIsCorrect(false);
      speak("Not quite. The answer is " + exercise.options[correct]);
    }
  }

  function handleFillBlank(answer) {
    if (answered) return;
    setAnswered(true);
    setTotalQuestions((t) => t + 1);
    if (typed.trim().toLowerCase() === answer.toLowerCase()) {
      setIsCorrect(true);
      setScore((s) => s + 1);
      speak("Correct!");
    } else {
      setIsCorrect(false);
      speak("Not quite. The answer is " + answer);
    }
  }

  // ==========================================
  // RENDER STAGES
  // ==========================================

  // PRESENT STAGE
  if (currentStage.type === "present") {
    const item = currentStage.items[presentIndex];
    return (
      <LessonShell
        title={currentStage.title}
        progress={progressPercent}
        stageLabel="Present"
        onClose={() => router.push(`/learn/${nodeId}`)}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
            padding: "40px 24px",
          }}
        >
          <div style={{ fontSize: "80px" }}>{item.image}</div>
          <div
            style={{
              fontSize: "48px",
              fontWeight: 700,
              color: "var(--color-primary)",
            }}
          >
            {item.letter}
          </div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 600,
              color: "var(--color-text)",
            }}
          >
            {item.word}
          </div>
          <p style={{ fontSize: "16px", color: "var(--color-text-light)" }}>
            {item.audio}
          </p>

          {/* Speaker button */}
          <button
            onClick={() => speak(item.audio || `${item.letter} is for ${item.word}`)}
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              border: "2px solid var(--color-primary)",
              background: "var(--color-bg-card)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
            }}
          >
            🔊
          </button>

          <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
            {presentIndex + 1} of {currentStage.items.length}
          </p>
        </div>
        <BottomButton onClick={handleNext} label="Next" />
      </LessonShell>
    );
  }

  // EXAMPLES STAGE
  if (currentStage.type === "examples") {
    const item = currentStage.items[presentIndex];
    return (
      <LessonShell
        title={currentStage.title}
        progress={progressPercent}
        stageLabel="Examples"
        onClose={() => router.push(`/learn/${nodeId}`)}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
            padding: "40px 24px",
          }}
        >
          <div
            style={{
              fontSize: "20px",
              color: "var(--color-text)",
              textAlign: "center",
              lineHeight: 1.6,
            }}
          >
            {item.prompt}
          </div>
          <div
            style={{
              fontSize: "48px",
              fontWeight: 700,
              color: "var(--color-primary)",
            }}
          >
            {item.answer}
          </div>

          {/* Speaker button */}
          <button
            onClick={() => speak(item.prompt + " " + item.answer)}
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              border: "2px solid var(--color-primary)",
              background: "var(--color-bg-card)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
            }}
          >
            🔊
          </button>

          <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
            {presentIndex + 1} of {currentStage.items.length}
          </p>
        </div>
        <BottomButton onClick={handleNext} label="Next" />
      </LessonShell>
    );
  }

  // GUIDED, FREE, CHECKPOINT STAGES
  const exercises = currentStage.exercises || [];
  const exercise = exercises[exerciseIndex];

  if (!exercise) return null;

  // MULTIPLE CHOICE
  if (exercise.type === "multiple_choice") {
    return (
      <LessonShell
        title={currentStage.title}
        progress={progressPercent}
        stageLabel={currentStage.type === "guided" ? "Practice" : currentStage.type === "free" ? "Apply" : "Checkpoint"}
        onClose={() => router.push(`/learn/${nodeId}`)}
      >
        <div style={{ padding: "24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <button
              onClick={() => speak(exercise.question)}
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                border: "2px solid var(--color-primary)",
                background: "var(--color-bg-card)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}
            >
              🔊
            </button>
          </div>

          <p
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "var(--color-text)",
              textAlign: "center",
              marginBottom: "32px",
            }}
          >
            {exercise.question}
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {exercise.options.map((option, i) => {
              let bg = "var(--color-bg-card)";
              let border = "var(--color-border)";

              if (answered) {
                if (i === exercise.correct) {
                  bg = "var(--color-success)";
                  border = "var(--color-success)";
                } else if (i === selected && !isCorrect) {
                  bg = "var(--color-error)";
                  border = "var(--color-error)";
                }
              } else if (i === selected) {
                border = "var(--color-primary)";
              }

              return (
                <button
                  key={i}
                  onClick={() => handleMultipleChoice(i, exercise.correct)}
                  style={{
                    padding: "16px 20px",
                    borderRadius: "var(--radius-md)",
                    border: `2px solid ${border}`,
                    background: bg,
                    cursor: answered ? "default" : "pointer",
                    fontSize: "18px",
                    fontWeight: 500,
                    color:
                      answered && (i === exercise.correct || (i === selected && !isCorrect))
                        ? "#FFFFFF"
                        : "var(--color-text)",
                    textAlign: "center",
                    transition: "all 0.2s ease",
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {answered && (
            <FeedbackBar isCorrect={isCorrect} correctAnswer={exercise.options[exercise.correct]} />
          )}
        </div>
        {answered && <BottomButton onClick={handleNext} label="Continue" />}
      </LessonShell>
    );
  }

  // FILL IN THE BLANK
  if (exercise.type === "fill_blank") {
    return (
      <LessonShell
        title={currentStage.title}
        progress={progressPercent}
        stageLabel={currentStage.type === "guided" ? "Practice" : currentStage.type === "free" ? "Apply" : "Checkpoint"}
        onClose={() => router.push(`/learn/${nodeId}`)}
      >
        <div style={{ padding: "24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <button
              onClick={() => speak(exercise.sentence.replace("___", exercise.answer))}
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                border: "2px solid var(--color-primary)",
                background: "var(--color-bg-card)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}
            >
              🔊
            </button>
          </div>

          <p
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "var(--color-text)",
              textAlign: "center",
              marginBottom: "32px",
            }}
          >
            {exercise.sentence}
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              marginBottom: "24px",
            }}
          >
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={answered}
              placeholder="Type your answer"
              autoFocus
              style={{
                padding: "14px 20px",
                borderRadius: "var(--radius-md)",
                border: answered
                  ? isCorrect
                    ? "2px solid var(--color-success)"
                    : "2px solid var(--color-error)"
                  : "2px solid var(--color-border)",
                background: "var(--color-bg-card)",
                fontSize: "20px",
                fontWeight: 600,
                textAlign: "center",
                color: "var(--color-text)",
                outline: "none",
                width: "200px",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !answered && typed.trim()) {
                  handleFillBlank(exercise.answer);
                }
              }}
            />
          </div>

          {!answered && typed.trim() && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <button
                onClick={() => handleFillBlank(exercise.answer)}
                style={{
                  padding: "12px 32px",
                  borderRadius: "var(--radius-full)",
                  border: "none",
                  background: "var(--color-primary)",
                  color: "#FFFFFF",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Check
              </button>
            </div>
          )}

          {answered && (
            <FeedbackBar isCorrect={isCorrect} correctAnswer={exercise.answer} />
          )}
        </div>
        {answered && <BottomButton onClick={handleNext} label="Continue" />}
      </LessonShell>
    );
  }

  // TAP CORRECT
  if (exercise.type === "tap_correct") {
    return (
      <LessonShell
        title={currentStage.title}
        progress={progressPercent}
        stageLabel="Practice"
        onClose={() => router.push(`/learn/${nodeId}`)}
      >
        <div style={{ padding: "24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <button
              onClick={() => speak(exercise.question)}
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                border: "2px solid var(--color-primary)",
                background: "var(--color-bg-card)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}
            >
              🔊
            </button>
          </div>

          <p
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "var(--color-text)",
              textAlign: "center",
              marginBottom: "32px",
            }}
          >
            {exercise.question}
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              justifyContent: "center",
            }}
          >
            {exercise.options.map((option, i) => {
              const isSelected = selected?.includes(i);
              const shouldBeSelected = exercise.correct.includes(i);

              let bg = "var(--color-bg-card)";
              let border = "var(--color-border)";

              if (answered) {
                if (shouldBeSelected) {
                  bg = "var(--color-success)";
                  border = "var(--color-success)";
                } else if (isSelected) {
                  bg = "var(--color-error)";
                  border = "var(--color-error)";
                }
              } else if (isSelected) {
                border = "var(--color-primary)";
                bg = "var(--color-primary-light)";
              }

              return (
                <button
                  key={i}
                  onClick={() => {
                    if (answered) return;
                    const current = selected || [];
                    if (current.includes(i)) {
                      setSelected(current.filter((x) => x !== i));
                    } else {
                      setSelected([...current, i]);
                    }
                  }}
                  style={{
                    padding: "14px 24px",
                    borderRadius: "var(--radius-md)",
                    border: `2px solid ${border}`,
                    background: bg,
                    cursor: answered ? "default" : "pointer",
                    fontSize: "18px",
                    fontWeight: 500,
                    color:
                      answered && (shouldBeSelected || isSelected)
                        ? "#FFFFFF"
                        : "var(--color-text)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {!answered && selected?.length > 0 && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: "24px" }}>
              <button
                onClick={() => {
                  setAnswered(true);
                  setTotalQuestions((t) => t + 1);
                  const correct = exercise.correct;
                  const sel = selected || [];
                  const allCorrect =
                    correct.length === sel.length &&
                    correct.every((c) => sel.includes(c));
                  setIsCorrect(allCorrect);
                  if (allCorrect) {
                    setScore((s) => s + 1);
                    speak("Correct!");
                  } else {
                    speak("Not quite.");
                  }
                }}
                style={{
                  padding: "12px 32px",
                  borderRadius: "var(--radius-full)",
                  border: "none",
                  background: "var(--color-primary)",
                  color: "#FFFFFF",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Check
              </button>
            </div>
          )}

          {answered && (
            <FeedbackBar
              isCorrect={isCorrect}
              correctAnswer={exercise.correct.map((i) => exercise.options[i]).join(", ")}
            />
          )}
        </div>
        {answered && <BottomButton onClick={handleNext} label="Continue" />}
      </LessonShell>
    );
  }

  // DRAG MATCH
  if (exercise.type === "drag_match") {
    return (
      <LessonShell
        title={currentStage.title}
        progress={progressPercent}
        stageLabel="Apply"
        onClose={() => router.push(`/learn/${nodeId}`)}
      >
        <div style={{ padding: "24px" }}>
          <p
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "var(--color-text)",
              textAlign: "center",
              marginBottom: "32px",
            }}
          >
            Match each letter with its picture
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {exercise.pairs.map((pair, i) => (
              <button
                key={i}
                onClick={() => speak(`${pair[0]} is for ${pair[1]}`)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "24px",
                  padding: "12px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-bg-card)",
                  border: "1px solid var(--color-border)",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    fontSize: "28px",
                    fontWeight: 700,
                    color: "var(--color-primary)",
                  }}
                >
                  {pair[0]}
                </span>
                <span style={{ color: "var(--color-text-muted)" }}>→</span>
                <span style={{ fontSize: "32px" }}>{pair[1]}</span>
                <span style={{ fontSize: "16px", marginLeft: "8px" }}>🔊</span>
              </button>
            ))}
          </div>
        </div>
        <BottomButton onClick={handleNext} label="I Got It!" />
      </LessonShell>
    );
  }

  return null;
}

// ==========================================
// SHARED COMPONENTS
// ==========================================

function LessonShell({ title, progress, stageLabel, onClose, children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--color-bg)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "16px 20px",
          background: "var(--color-bg-nav)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
            color: "var(--color-text-muted)",
            padding: "4px",
          }}
        >
          ✕
        </button>
        <div style={{ flex: 1 }}>
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
                width: `${progress}%`,
                borderRadius: "4px",
                background: "var(--color-primary)",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
          }}
        >
          {stageLabel}
        </span>
      </div>

      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function BottomButton({ onClick, label }) {
  return (
    <div
      style={{
        padding: "16px 24px",
        paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
        borderTop: "1px solid var(--color-border)",
        background: "var(--color-bg-nav)",
      }}
    >
      <button
        onClick={onClick}
        style={{
          width: "100%",
          padding: "16px",
          borderRadius: "var(--radius-full)",
          border: "none",
          background: "var(--color-primary)",
          color: "#FFFFFF",
          fontSize: "16px",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {label}
      </button>
    </div>
  );
}

function FeedbackBar({ isCorrect, correctAnswer }) {
  return (
    <div
      style={{
        marginTop: "24px",
        padding: "16px 20px",
        borderRadius: "var(--radius-md)",
        background: isCorrect ? "var(--color-success)" : "var(--color-error)",
        color: "#FFFFFF",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "16px", fontWeight: 700 }}>
        {isCorrect ? "Correct! 🎉" : "Not quite 😅"}
      </div>
      {!isCorrect && (
        <div style={{ fontSize: "14px", marginTop: "4px" }}>
          The answer is: {correctAnswer}
        </div>
      )}
    </div>
  );
}