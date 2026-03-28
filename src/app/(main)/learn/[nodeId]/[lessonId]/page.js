"use client";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import VisualScene from "@/components/VisualScene";

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
  const [sceneKey, setSceneKey] = useState(0);

  // Reveal sequence state
  const [revealStep, setRevealStep] = useState(0);
  // 0 = image only, 1 = image + audio played, 2 = image + word revealed + audio again
  const [showL1, setShowL1] = useState(false);

  // Second chance state
  const [attempts, setAttempts] = useState(0);
  const [showingCorrect, setShowingCorrect] = useState(false);

  // Checkpoint retry state
  const [failedItems, setFailedItems] = useState([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryIndex, setRetryIndex] = useState(0);

  const timerRef = useRef(null);

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
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
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

  // Start reveal sequence when present/examples stage item changes
  useEffect(() => {
    if (!lesson) return;
    const stages = lesson.content?.stages || [];
    const stage = stages[stageIndex];
    if (!stage) return;

    if (stage.type === "present" && stage.format === "visual") {
      startRevealSequence(stage.items[presentIndex]);
    }
  }, [stageIndex, presentIndex, lesson]);

  function startRevealSequence(item) {
    if (!item) return;
    setRevealStep(0);
    setShowL1(false);

    if (timerRef.current) clearTimeout(timerRef.current);

    // Step 1: Play audio after 1 second
    timerRef.current = setTimeout(() => {
      setRevealStep(1);
      speak(item.audio || item.target);

      // Step 2: Reveal word + play audio again after another 1.5 seconds
      timerRef.current = setTimeout(() => {
        setRevealStep(2);
        speak(item.audio || item.target);
      }, 1500);
    }, 1000);
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
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-text)" }}>
          Lesson Complete!
        </h1>
        <p style={{ color: "var(--color-text-light)", textAlign: "center" }}>
          {score} / {totalQuestions}
        </p>
        <div style={{ display: "flex", gap: "24px", marginTop: "16px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-xp)" }}>
              +{lesson.xp_reward}
            </div>
            <div style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>XP</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-token)" }}>
              +{lesson.token_reward}
            </div>
            <div style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Tokens</div>
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
  // NAVIGATION HELPERS
  // ==========================================
  function resetExerciseState() {
    setSelected(null);
    setAnswered(false);
    setIsCorrect(false);
    setTyped("");
    setAttempts(0);
    setShowingCorrect(false);
    setShowL1(false);
  }

  function handleNext() {
    resetExerciseState();
    const stage = stages[stageIndex];

    if (stage.type === "present") {
      if (presentIndex < stage.items.length - 1) {
        setPresentIndex(presentIndex + 1);
        setSceneKey((k) => k + 1);
        return;
      }
      setPresentIndex(0);
      setStageIndex(stageIndex + 1);
      setExerciseIndex(0);
      setSceneKey((k) => k + 1);
      return;
    }

    if (stage.type === "examples") {
      if (presentIndex < stage.items.length - 1) {
        const nextItem = stage.items[presentIndex + 1];
        setPresentIndex(presentIndex + 1);
        setSceneKey((k) => k + 1);
        speak(nextItem.audio || nextItem.answer);
        return;
      }
      setPresentIndex(0);
      setStageIndex(stageIndex + 1);
      setExerciseIndex(0);
      setSceneKey((k) => k + 1);
      return;
    }

    // Exercise stages
    const exercises = stage.exercises || [];
    if (exerciseIndex < exercises.length - 1) {
      setExerciseIndex(exerciseIndex + 1);
      setSceneKey((k) => k + 1);
    } else {
      if (stageIndex < stages.length - 1) {
        setStageIndex(stageIndex + 1);
        setExerciseIndex(0);
        setPresentIndex(0);
        setSceneKey((k) => k + 1);
      } else {
        // Check if checkpoint needs retry
        if (currentStage.type === "checkpoint" && failedItems.length > 0 && !isRetrying) {
          setIsRetrying(true);
          setRetryIndex(0);
          resetExerciseState();
        } else {
          saveLessonComplete();
        }
      }
    }
  }

  function handleCheckpointNext() {
    resetExerciseState();
    if (retryIndex < failedItems.length - 1) {
      setRetryIndex(retryIndex + 1);
    } else {
      // Check if there are still failed items from this retry round
      const stillFailed = failedItems.filter((item) => !item.passed);
      if (stillFailed.length > 0) {
        setFailedItems(stillFailed.map((f) => ({ ...f, passed: false })));
        setRetryIndex(0);
        resetExerciseState();
      } else {
        saveLessonComplete();
      }
    }
  }

  async function saveLessonComplete() {
    setCompleted(true);
    speak("Lesson complete!");

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
  // ANSWER HANDLERS WITH SECOND CHANCE
  // ==========================================
  function handleMultipleChoice(optionIndex, correct, exercise) {
    if (answered || showingCorrect) return;

    setSelected(optionIndex);

    if (optionIndex === correct) {
      setAnswered(true);
      setIsCorrect(true);
      setTotalQuestions((t) => t + 1);
      setScore((s) => s + 1);
      speak(exercise.options[correct]);

      // Track checkpoint pass
      if (currentStage.type === "checkpoint" && isRetrying) {
        const updated = [...failedItems];
        updated[retryIndex] = { ...updated[retryIndex], passed: true };
        setFailedItems(updated);
      }
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts === 1) {
        // First wrong — shake and reset after a moment
        setTimeout(() => {
          setSelected(null);
        }, 600);
      } else {
        // Second wrong — show correct answer
        setShowingCorrect(true);
        speak(exercise.options[correct]);
        setTotalQuestions((t) => t + 1);

        // Track checkpoint failure
        if (currentStage.type === "checkpoint" && !isRetrying) {
          setFailedItems((prev) => [...prev, { exercise, index: exerciseIndex, passed: false }]);
        }

        // After showing correct, allow one more try
        setTimeout(() => {
          setShowingCorrect(false);
          setSelected(null);
          setAttempts(0);
          // Now they get a third attempt (fresh)
          setAnswered(false);
          setIsCorrect(false);
        }, 2500);
      }
    }
  }

  function handleFillBlank(answer, exercise) {
    if (answered || showingCorrect) return;

    const isRight = typed.trim().toLowerCase() === answer.toLowerCase();

    if (isRight) {
      setAnswered(true);
      setIsCorrect(true);
      setTotalQuestions((t) => t + 1);
      setScore((s) => s + 1);
      speak(answer);

      if (currentStage.type === "checkpoint" && isRetrying) {
        const updated = [...failedItems];
        updated[retryIndex] = { ...updated[retryIndex], passed: true };
        setFailedItems(updated);
      }
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts === 1) {
        // First wrong — clear input, let them try again
        setTyped("");
      } else {
        // Second wrong — show correct answer
        setShowingCorrect(true);
        speak(answer);
        setTotalQuestions((t) => t + 1);

        if (currentStage.type === "checkpoint" && !isRetrying) {
          setFailedItems((prev) => [...prev, { exercise, index: exerciseIndex, passed: false }]);
        }

        setTimeout(() => {
          setShowingCorrect(false);
          setTyped("");
          setAttempts(0);
          setAnswered(false);
          setIsCorrect(false);
        }, 2500);
      }
    }
  }

  // ==========================================
  // RENDER: VISUAL PRESENT STAGE (with reveal sequence)
  // ==========================================
  if (currentStage.type === "present" && currentStage.format === "visual") {
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
            gap: "20px",
            padding: "24px",
          }}
        >
          {/* Image/Scene — always visible */}
          <VisualScene key={sceneKey} scene={item.scene} size="large" />

          {/* Written word — only after step 2 */}
          <div
            style={{
              fontSize: "36px",
              fontWeight: 700,
              color: "var(--color-primary)",
              textAlign: "center",
              opacity: revealStep >= 2 ? 1 : 0,
              transform: revealStep >= 2 ? "translateY(0)" : "translateY(10px)",
              transition: "all 0.5s ease",
              minHeight: "50px",
            }}
          >
            {item.target}
          </div>

          {/* L1 hint — only when help button tapped */}
          {showL1 && item.hint_l1?.tr && (
            <p
              style={{
                fontSize: "14px",
                color: "var(--color-text-muted)",
                fontStyle: "italic",
                textAlign: "center",
                animation: "fadeIn 0.3s ease",
              }}
            >
              {item.hint_l1.tr}
            </p>
          )}

          {/* Controls row */}
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            {/* Speaker button — available after reveal */}
            {revealStep >= 1 && (
              <button
                onClick={() => speak(item.audio || item.target)}
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  border: "2px solid var(--color-primary)",
                  background: "var(--color-bg-card)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                }}
              >
                🔊
              </button>
            )}

            {/* Help button for L1 hint */}
            {item.hint_l1?.tr && (
              <button
                onClick={() => setShowL1(!showL1)}
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  border: "2px solid var(--color-border)",
                  background: showL1 ? "var(--color-primary-light)" : "var(--color-bg-card)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  fontWeight: 700,
                  color: showL1 ? "#FFFFFF" : "var(--color-text-muted)",
                }}
              >
                ?
              </button>
            )}
          </div>

          <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
            {presentIndex + 1} / {currentStage.items.length}
          </p>
        </div>
        {revealStep >= 2 && <BottomButton onClick={handleNext} label="Next" />}
      </LessonShell>
    );
  }

  // ==========================================
  // RENDER: ORIGINAL PRESENT STAGE (non-visual, for alphabet/numbers)
  // ==========================================
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
          <div style={{ fontSize: "24px", fontWeight: 600, color: "var(--color-text)" }}>
            {item.word}
          </div>

          {item.hint_l1?.tr && (
            <p
              style={{
                fontSize: "14px",
                color: "var(--color-text-muted)",
                fontStyle: "italic",
              }}
            >
              {item.hint_l1.tr}
            </p>
          )}

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
            {presentIndex + 1} / {currentStage.items.length}
          </p>
        </div>
        <BottomButton onClick={handleNext} label="Next" />
      </LessonShell>
    );
  }

  // ==========================================
  // RENDER: VISUAL EXAMPLES STAGE
  // ==========================================
  if (currentStage.type === "examples" && currentStage.format === "visual") {
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
            gap: "20px",
            padding: "24px",
          }}
        >
          <VisualScene key={sceneKey} scene={item.scene} size="large" />

          {item.prompt_image && (
            <div style={{ fontSize: "48px", textAlign: "center" }}>
              {item.prompt_image}
            </div>
          )}

          <div
            style={{
              fontSize: "32px",
              fontWeight: 700,
              color: "var(--color-primary)",
              textAlign: "center",
            }}
          >
            {item.answer}
          </div>

          {item.hint_l1?.tr && (
            <p
              style={{
                fontSize: "14px",
                color: "var(--color-text-muted)",
                fontStyle: "italic",
              }}
            >
              {item.hint_l1.tr}
            </p>
          )}

          <button
            onClick={() => speak(item.audio || item.answer)}
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
            {presentIndex + 1} / {currentStage.items.length}
          </p>
        </div>
        <BottomButton onClick={handleNext} label="Next" />
      </LessonShell>
    );
  }

  // ==========================================
  // RENDER: ORIGINAL EXAMPLES STAGE (non-visual)
  // ==========================================
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

          {item.hint_l1?.tr && (
            <p
              style={{
                fontSize: "14px",
                color: "var(--color-text-muted)",
                fontStyle: "italic",
              }}
            >
              {item.hint_l1.tr}
            </p>
          )}

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
            {presentIndex + 1} / {currentStage.items.length}
          </p>
        </div>
        <BottomButton onClick={handleNext} label="Next" />
      </LessonShell>
    );
  }

  // ==========================================
  // EXERCISE STAGES (guided, free, checkpoint)
  // ==========================================
  let exercise;
  let currentNext;

  if (isRetrying && currentStage.type === "checkpoint") {
    exercise = failedItems[retryIndex]?.exercise;
    currentNext = handleCheckpointNext;
  } else {
    const exercises = currentStage.exercises || [];
    exercise = exercises[exerciseIndex];
    currentNext = handleNext;
  }

  if (!exercise) return null;

  const stageLabel =
    currentStage.type === "guided"
      ? "Practice"
      : currentStage.type === "free"
      ? "Apply"
      : isRetrying
      ? "Retry"
      : "Checkpoint";

  // MULTIPLE CHOICE
  if (exercise.type === "multiple_choice") {
    const optionCount = exercise.options_count || exercise.options.length;
    const visibleOptions = exercise.options.slice(0, optionCount);

    return (
      <LessonShell
        title={currentStage.title}
        progress={progressPercent}
        stageLabel={stageLabel}
        onClose={() => router.push(`/learn/${nodeId}`)}
      >
        <div style={{ padding: "24px" }}>
          {/* Visual prompt */}
          {exercise.question_image && (
            <div
              style={{
                fontSize: "56px",
                textAlign: "center",
                marginBottom: "16px",
                padding: "20px",
                borderRadius: "var(--radius-lg)",
                background: "var(--color-bg-card)",
                border: "1px solid var(--color-border)",
              }}
            >
              {exercise.question_image}
            </div>
          )}

          {/* Audio button */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
            <button
              onClick={() => {
                if (exercise.audio) speak(exercise.audio);
                else if (exercise.question_image) speak("Which one?");
                else speak(exercise.question);
              }}
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

          {/* Question text */}
          {exercise.question && (!exercise.question_image || exercise.question.length > 20) && (
            <p
              style={{
                fontSize: "20px",
                fontWeight: 600,
                color: "var(--color-text)",
                textAlign: "center",
                marginBottom: "24px",
              }}
            >
              {exercise.question}
            </p>
          )}

          {/* Attempt indicator */}
          {attempts === 1 && !showingCorrect && (
            <p
              style={{
                fontSize: "14px",
                color: "var(--color-warning)",
                textAlign: "center",
                marginBottom: "12px",
                fontWeight: 600,
              }}
            >
              Try again!
            </p>
          )}

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {visibleOptions.map((option, i) => {
              let bg = "var(--color-bg-card)";
              let border = "var(--color-border)";
              let textColor = "var(--color-text)";

              if (answered && isCorrect && i === exercise.correct) {
                bg = "var(--color-success)";
                border = "var(--color-success)";
                textColor = "#FFFFFF";
              } else if (showingCorrect) {
                if (i === exercise.correct) {
                  bg = "var(--color-success)";
                  border = "var(--color-success)";
                  textColor = "#FFFFFF";
                } else if (i === selected) {
                  bg = "var(--color-error)";
                  border = "var(--color-error)";
                  textColor = "#FFFFFF";
                }
              }

              return (
                <button
                  key={i}
                  onClick={() => handleMultipleChoice(i, exercise.correct, exercise)}
                  style={{
                    padding: "16px 20px",
                    borderRadius: "var(--radius-md)",
                    border: `2px solid ${border}`,
                    background: bg,
                    cursor: answered || showingCorrect ? "default" : "pointer",
                    fontSize: "18px",
                    fontWeight: 500,
                    color: textColor,
                    textAlign: "center",
                    transition: "all 0.2s ease",
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {/* Correct feedback */}
          {answered && isCorrect && (
            <div
              style={{
                marginTop: "24px",
                padding: "16px",
                borderRadius: "var(--radius-md)",
                background: "var(--color-success)",
                color: "#FFFFFF",
                textAlign: "center",
                fontSize: "16px",
                fontWeight: 700,
              }}
            >
              ✓
            </div>
          )}

          {/* Showing correct answer after 2 fails */}
          {showingCorrect && (
            <div
              style={{
                marginTop: "24px",
                padding: "16px",
                borderRadius: "var(--radius-md)",
                background: "var(--color-error)",
                color: "#FFFFFF",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "18px", fontWeight: 700 }}>
                {exercise.options[exercise.correct]}
              </div>
            </div>
          )}
        </div>
        {answered && isCorrect && <BottomButton onClick={currentNext} label="Continue" />}
      </LessonShell>
    );
  }

  // FILL IN THE BLANK
  if (exercise.type === "fill_blank") {
    return (
      <LessonShell
        title={currentStage.title}
        progress={progressPercent}
        stageLabel={stageLabel}
        onClose={() => router.push(`/learn/${nodeId}`)}
      >
        <div style={{ padding: "24px" }}>
          {exercise.hint_image && (
            <div
              style={{
                fontSize: "48px",
                textAlign: "center",
                marginBottom: "16px",
                padding: "16px",
                borderRadius: "var(--radius-lg)",
                background: "var(--color-bg-card)",
                border: "1px solid var(--color-border)",
              }}
            >
              {exercise.hint_image}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
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
              fontSize: "24px",
              fontWeight: 600,
              color: "var(--color-text)",
              textAlign: "center",
              marginBottom: "32px",
            }}
          >
            {exercise.sentence}
          </p>

          {/* Attempt indicator */}
          {attempts === 1 && !showingCorrect && (
            <p
              style={{
                fontSize: "14px",
                color: "var(--color-warning)",
                textAlign: "center",
                marginBottom: "12px",
                fontWeight: 600,
              }}
            >
              Try again!
            </p>
          )}

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "24px" }}>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={answered || showingCorrect}
              placeholder="?"
              autoFocus
              style={{
                padding: "14px 20px",
                borderRadius: "var(--radius-md)",
                border: answered
                  ? "2px solid var(--color-success)"
                  : showingCorrect
                  ? "2px solid var(--color-error)"
                  : "2px solid var(--color-border)",
                background: "var(--color-bg-card)",
                fontSize: "24px",
                fontWeight: 600,
                textAlign: "center",
                color: "var(--color-text)",
                outline: "none",
                width: "200px",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !answered && !showingCorrect && typed.trim()) {
                  handleFillBlank(exercise.answer, exercise);
                }
              }}
            />
          </div>

          {!answered && !showingCorrect && typed.trim() && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <button
                onClick={() => handleFillBlank(exercise.answer, exercise)}
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

          {answered && isCorrect && (
            <div
              style={{
                marginTop: "24px",
                padding: "16px",
                borderRadius: "var(--radius-md)",
                background: "var(--color-success)",
                color: "#FFFFFF",
                textAlign: "center",
                fontSize: "16px",
                fontWeight: 700,
              }}
            >
              ✓
            </div>
          )}

          {showingCorrect && (
            <div
              style={{
                marginTop: "24px",
                padding: "16px",
                borderRadius: "var(--radius-md)",
                background: "var(--color-error)",
                color: "#FFFFFF",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "18px", fontWeight: 700 }}>
                {exercise.answer}
              </div>
            </div>
          )}
        </div>
        {answered && isCorrect && <BottomButton onClick={currentNext} label="Continue" />}
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
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
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

          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
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
                    color: answered && (shouldBeSelected || isSelected) ? "#FFFFFF" : "var(--color-text)",
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
                    correct.length === sel.length && correct.every((c) => sel.includes(c));
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
            <div
              style={{
                marginTop: "24px",
                padding: "16px",
                borderRadius: "var(--radius-md)",
                background: isCorrect ? "var(--color-success)" : "var(--color-error)",
                color: "#FFFFFF",
                textAlign: "center",
                fontWeight: 700,
              }}
            >
              {isCorrect ? "✓" : exercise.correct.map((i) => exercise.options[i]).join(", ")}
            </div>
          )}
        </div>
        {answered && <BottomButton onClick={currentNext} label="Continue" />}
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
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
                <span style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-primary)" }}>
                  {pair[0]}
                </span>
                <span style={{ color: "var(--color-text-muted)" }}>→</span>
                <span style={{ fontSize: "32px" }}>{pair[1]}</span>
                <span style={{ fontSize: "16px", marginLeft: "8px" }}>🔊</span>
              </button>
            ))}
          </div>
        </div>
        <BottomButton onClick={currentNext} label="I Got It!" />
      </LessonShell>
    );
  }

  // LISTEN AND PICK (new exercise type for Free Practice)
  if (exercise.type === "listen_pick") {
    return (
      <LessonShell
        title={currentStage.title}
        progress={progressPercent}
        stageLabel={stageLabel}
        onClose={() => router.push(`/learn/${nodeId}`)}
      >
        <div style={{ padding: "24px" }}>
          <p
            style={{
              fontSize: "18px",
              color: "var(--color-text-light)",
              textAlign: "center",
              marginBottom: "24px",
            }}
          >
            🎧
          </p>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: "32px" }}>
            <button
              onClick={() => speak(exercise.audio)}
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                border: "3px solid var(--color-primary)",
                background: "var(--color-bg-card)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "32px",
              }}
            >
              🔊
            </button>
          </div>

          {attempts === 1 && !showingCorrect && (
            <p
              style={{
                fontSize: "14px",
                color: "var(--color-warning)",
                textAlign: "center",
                marginBottom: "12px",
                fontWeight: 600,
              }}
            >
              Try again!
            </p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {exercise.options.map((option, i) => {
              let bg = "var(--color-bg-card)";
              let border = "var(--color-border)";
              let textColor = "var(--color-text)";

              if (answered && isCorrect && i === exercise.correct) {
                bg = "var(--color-success)";
                border = "var(--color-success)";
                textColor = "#FFFFFF";
              } else if (showingCorrect) {
                if (i === exercise.correct) {
                  bg = "var(--color-success)";
                  border = "var(--color-success)";
                  textColor = "#FFFFFF";
                } else if (i === selected) {
                  bg = "var(--color-error)";
                  border = "var(--color-error)";
                  textColor = "#FFFFFF";
                }
              }

              return (
                <button
                  key={i}
                  onClick={() => handleMultipleChoice(i, exercise.correct, exercise)}
                  style={{
                    padding: "16px 20px",
                    borderRadius: "var(--radius-md)",
                    border: `2px solid ${border}`,
                    background: bg,
                    cursor: answered || showingCorrect ? "default" : "pointer",
                    fontSize: "18px",
                    fontWeight: 500,
                    color: textColor,
                    textAlign: "center",
                    transition: "all 0.2s ease",
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {answered && isCorrect && (
            <div
              style={{
                marginTop: "24px",
                padding: "16px",
                borderRadius: "var(--radius-md)",
                background: "var(--color-success)",
                color: "#FFFFFF",
                textAlign: "center",
                fontWeight: 700,
              }}
            >
              ✓
            </div>
          )}

          {showingCorrect && (
            <div
              style={{
                marginTop: "24px",
                padding: "16px",
                borderRadius: "var(--radius-md)",
                background: "var(--color-error)",
                color: "#FFFFFF",
                textAlign: "center",
                fontWeight: 700,
              }}
            >
              {exercise.options[exercise.correct]}
            </div>
          )}
        </div>
        {answered && isCorrect && <BottomButton onClick={currentNext} label="Continue" />}
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