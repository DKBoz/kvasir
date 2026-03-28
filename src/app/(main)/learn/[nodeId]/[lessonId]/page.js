"use client";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import VisualScene from "@/components/VisualScene";
import Confetti from "@/components/Confetti";

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
  const [revealStep, setRevealStep] = useState(0);
  const [showL1, setShowL1] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showingCorrect, setShowingCorrect] = useState(false);
  const [failedItems, setFailedItems] = useState([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryIndex, setRetryIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [shakeWrong, setShakeWrong] = useState(false);
  const timerRef = useRef(null);

  function speak(text) {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US"; u.rate = 0.85; u.pitch = 1;
      window.speechSynthesis.speak(u);
    }
  }

  function triggerConfetti() {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 1000);
  }

  useEffect(() => {
    if (lessonId) fetchLesson();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [lessonId]);

  async function fetchLesson() {
    const { data } = await supabase.from("lessons").select("*").eq("id", lessonId).single();
    setLesson(data); setLoading(false);
  }

  useEffect(() => {
    if (!lesson) return;
    const stages = lesson.content?.stages || [];
    const stage = stages[stageIndex];
    if (stage?.type === "present" && stage?.format === "visual") {
      startRevealSequence(stage.items[presentIndex]);
    }
  }, [stageIndex, presentIndex, lesson]);

  function startRevealSequence(item) {
    if (!item) return;
    setRevealStep(0); setShowL1(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setRevealStep(1); speak(item.audio || item.target);
      timerRef.current = setTimeout(() => {
        setRevealStep(2); speak(item.audio || item.target);
      }, 1500);
    }, 1000);
  }

  if (loading || !lesson) {
    return (<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-bg)" }}><p className="animate-fade-in" style={{ color: "var(--color-text-muted)" }}>Loading...</p></div>);
  }

  const stages = lesson.content?.stages || [];
  const currentStage = stages[stageIndex];
  const totalStages = stages.length;
  const progressPercent = (stageIndex / totalStages) * 100;

  if (completed) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", gap: "24px", background: "var(--color-bg)" }}>
        <div className="animate-star" style={{ fontSize: "72px" }}>🎉</div>
        <h1 className="animate-slide-up" style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-text)" }}>Lesson Complete!</h1>
        <p className="animate-fade-in" style={{ color: "var(--color-text-light)" }}>{score} / {totalQuestions}</p>
        <div className="animate-slide-up" style={{ display: "flex", gap: "32px", marginTop: "16px" }}>
          <div style={{ textAlign: "center", padding: "16px 24px", borderRadius: "var(--radius-lg)", background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-xp)" }}>+{lesson.xp_reward}</div>
            <div style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "4px" }}>XP</div>
          </div>
          <div style={{ textAlign: "center", padding: "16px 24px", borderRadius: "var(--radius-lg)", background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-token)" }}>+{lesson.token_reward}</div>
            <div style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "4px" }}>Tokens</div>
          </div>
        </div>
        <button onClick={() => router.push(`/learn/${nodeId}`)} className="animate-slide-up" style={{ marginTop: "24px", padding: "16px 48px", borderRadius: "var(--radius-full)", border: "none", background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))", color: "#FFFFFF", fontSize: "16px", fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>Continue</button>
      </div>
    );
  }

  if (!currentStage) return null;

  function resetExerciseState() {
    setSelected(null); setAnswered(false); setIsCorrect(false); setTyped(""); setAttempts(0); setShowingCorrect(false); setShowL1(false); setShakeWrong(false); setAnimKey((k) => k + 1);
  }

  function handleNext() {
    resetExerciseState();
    const stage = stages[stageIndex];
    if (stage.type === "present") {
      if (presentIndex < stage.items.length - 1) { setPresentIndex(presentIndex + 1); setSceneKey((k) => k + 1); return; }
      setPresentIndex(0); setStageIndex(stageIndex + 1); setExerciseIndex(0); setSceneKey((k) => k + 1); return;
    }
    if (stage.type === "examples") {
      if (presentIndex < stage.items.length - 1) { setPresentIndex(presentIndex + 1); setSceneKey((k) => k + 1); speak(stage.items[presentIndex + 1]?.audio || ""); return; }
      setPresentIndex(0); setStageIndex(stageIndex + 1); setExerciseIndex(0); setSceneKey((k) => k + 1); return;
    }
    const exercises = stage.exercises || [];
    if (exerciseIndex < exercises.length - 1) { setExerciseIndex(exerciseIndex + 1); setSceneKey((k) => k + 1); }
    else {
      if (stageIndex < stages.length - 1) { setStageIndex(stageIndex + 1); setExerciseIndex(0); setPresentIndex(0); setSceneKey((k) => k + 1); }
      else {
        if (currentStage.type === "checkpoint" && failedItems.length > 0 && !isRetrying) { setIsRetrying(true); setRetryIndex(0); resetExerciseState(); }
        else { saveLessonComplete(); }
      }
    }
  }

  function handleCheckpointNext() {
    resetExerciseState();
    if (retryIndex < failedItems.length - 1) { setRetryIndex(retryIndex + 1); }
    else {
      const stillFailed = failedItems.filter((f) => !f.passed);
      if (stillFailed.length > 0) { setFailedItems(stillFailed.map((f) => ({ ...f, passed: false }))); setRetryIndex(0); resetExerciseState(); }
      else { saveLessonComplete(); }
    }
  }

  async function saveLessonComplete() {
    setCompleted(true); speak("Lesson complete!");
    await supabase.from("user_progress").upsert({ user_id: profile.id, lesson_id: lessonId, node_id: nodeId, completed: true, score, xp_earned: lesson.xp_reward, tokens_earned: lesson.token_reward, completed_at: new Date().toISOString() }, { onConflict: "user_id,lesson_id" });
    await updateProfile({ xp: (profile.xp || 0) + lesson.xp_reward, tokens: (profile.tokens || 0) + lesson.token_reward });
  }

  function handleMC(idx, correct, ex) {
    if (answered || showingCorrect) return;
    setSelected(idx);
    if (idx === correct) {
      setAnswered(true); setIsCorrect(true); setTotalQuestions((t) => t + 1); setScore((s) => s + 1); speak(ex.options[correct]); triggerConfetti();
      if (currentStage.type === "checkpoint" && isRetrying) { const u = [...failedItems]; u[retryIndex] = { ...u[retryIndex], passed: true }; setFailedItems(u); }
    } else {
      const n = attempts + 1; setAttempts(n); setShakeWrong(true); setTimeout(() => setShakeWrong(false), 500);
      if (n === 1) { setTimeout(() => setSelected(null), 600); }
      else {
        setShowingCorrect(true); speak(ex.options[correct]); setTotalQuestions((t) => t + 1);
        if (currentStage.type === "checkpoint" && !isRetrying) { setFailedItems((p) => [...p, { exercise: ex, index: exerciseIndex, passed: false }]); }
        setTimeout(() => { setShowingCorrect(false); setSelected(null); setAttempts(0); setAnswered(false); setIsCorrect(false); }, 2500);
      }
    }
  }

  function handleFB(answer, ex) {
    if (answered || showingCorrect) return;
    if (typed.trim().toLowerCase() === answer.toLowerCase()) {
      setAnswered(true); setIsCorrect(true); setTotalQuestions((t) => t + 1); setScore((s) => s + 1); speak(answer); triggerConfetti();
      if (currentStage.type === "checkpoint" && isRetrying) { const u = [...failedItems]; u[retryIndex] = { ...u[retryIndex], passed: true }; setFailedItems(u); }
    } else {
      const n = attempts + 1; setAttempts(n); setShakeWrong(true); setTimeout(() => setShakeWrong(false), 500);
      if (n === 1) { setTyped(""); }
      else {
        setShowingCorrect(true); speak(answer); setTotalQuestions((t) => t + 1);
        if (currentStage.type === "checkpoint" && !isRetrying) { setFailedItems((p) => [...p, { exercise: ex, index: exerciseIndex, passed: false }]); }
        setTimeout(() => { setShowingCorrect(false); setTyped(""); setAttempts(0); setAnswered(false); setIsCorrect(false); }, 2500);
      }
    }
  }

  function L1Hint({ item }) {
    if (!item?.hint_l1?.tr) return null;
    return <p className="animate-fade-in" style={{ fontSize: "14px", color: "var(--color-text-muted)", fontStyle: "italic", textAlign: "center" }}>{item.hint_l1.tr}</p>;
  }

  function CorrectFeedback() {
    return (
      <div className="animate-bounce-in" style={{ marginTop: "24px", padding: "12px 20px", borderRadius: "var(--radius-full)", background: "var(--color-bg-card)", border: "2px solid var(--color-success)", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
        <span style={{ fontSize: "20px" }}>🎉</span>
        <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-success)" }}>Correct!</span>
      </div>
    );
  }

  function WrongFeedback({ text }) {
    return (
      <div className="animate-slide-up" style={{ marginTop: "24px", padding: "16px", borderRadius: "var(--radius-md)", background: "var(--color-error)", color: "#FFFFFF", textAlign: "center" }}>
        <div style={{ fontSize: "18px", fontWeight: 700 }}>{text}</div>
      </div>
    );
  }

  function TryAgain() {
    if (attempts !== 1 || showingCorrect) return null;
    return <p className="animate-bounce-in" style={{ fontSize: "15px", color: "var(--color-warning)", textAlign: "center", marginBottom: "12px", fontWeight: 600 }}>Try again!</p>;
  }

  function SpeakerBtn({ onClick, size = 44 }) {
    return (
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
        <button onClick={onClick} style={{ width: `${size}px`, height: `${size}px`, borderRadius: "50%", border: "2px solid var(--color-primary)", background: "var(--color-bg-card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: `${size * 0.45}px` }}>🔊</button>
      </div>
    );
  }
  // ==========================================
  // VISUAL PRESENT
  // ==========================================
  if (currentStage.type === "present" && currentStage.format === "visual") {
    const item = currentStage.items[presentIndex];
    return (
      <LessonShell title={currentStage.title} progress={progressPercent} stageLabel="Present" onClose={() => router.push(`/learn/${nodeId}`)}>
        <div key={animKey} className="animate-fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", padding: "24px" }}>
          <VisualScene key={sceneKey} scene={item.scene} size="large" />
          <div style={{ fontSize: "36px", fontWeight: 700, color: "var(--color-primary)", textAlign: "center", opacity: revealStep >= 2 ? 1 : 0, transform: revealStep >= 2 ? "translateY(0)" : "translateY(10px)", transition: "all 0.5s ease", minHeight: "50px" }}>
            {revealStep >= 2 && <span className="animate-reveal">{item.target}</span>}
          </div>
          {showL1 && <L1Hint item={item} />}
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            {revealStep >= 1 && (
              <button onClick={() => speak(item.audio || item.target)} className="animate-bounce-in" style={{ width: "48px", height: "48px", borderRadius: "50%", border: "2px solid var(--color-primary)", background: "var(--color-bg-card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>🔊</button>
            )}
            {item.hint_l1?.tr && (
              <button onClick={() => setShowL1(!showL1)} style={{ width: "48px", height: "48px", borderRadius: "50%", border: "2px solid var(--color-border)", background: showL1 ? "var(--color-primary-light)" : "var(--color-bg-card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 700, color: showL1 ? "#FFFFFF" : "var(--color-text-muted)" }}>?</button>
            )}
          </div>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>{presentIndex + 1} / {currentStage.items.length}</p>
        </div>
        {revealStep >= 2 && <BottomButton onClick={handleNext} label="Next" />}
      </LessonShell>
    );
  }

  // ORIGINAL PRESENT (non-visual)
  if (currentStage.type === "present") {
    const item = currentStage.items[presentIndex];
    return (
      <LessonShell title={currentStage.title} progress={progressPercent} stageLabel="Present" onClose={() => router.push(`/learn/${nodeId}`)}>
        <div key={animKey} className="animate-slide-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px", padding: "40px 24px" }}>
          <div className="animate-bounce-in" style={{ fontSize: "80px" }}>{item.image}</div>
          <div style={{ fontSize: "48px", fontWeight: 700, color: "var(--color-primary)" }}>{item.letter}</div>
          <div style={{ fontSize: "24px", fontWeight: 600, color: "var(--color-text)" }}>{item.word}</div>
          {item.hint_l1?.tr && <L1Hint item={item} />}
          <button onClick={() => speak(item.audio || `${item.letter} is for ${item.word}`)} style={{ width: "56px", height: "56px", borderRadius: "50%", border: "2px solid var(--color-primary)", background: "var(--color-bg-card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>🔊</button>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>{presentIndex + 1} / {currentStage.items.length}</p>
        </div>
        <BottomButton onClick={handleNext} label="Next" />
      </LessonShell>
    );
  }

  // VISUAL EXAMPLES
  if (currentStage.type === "examples" && currentStage.format === "visual") {
    const item = currentStage.items[presentIndex];
    return (
      <LessonShell title={currentStage.title} progress={progressPercent} stageLabel="Examples" onClose={() => router.push(`/learn/${nodeId}`)}>
        <div key={animKey} className="animate-slide-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", padding: "24px" }}>
          <VisualScene key={sceneKey} scene={item.scene} size="large" />
          {item.prompt_image && <div className="animate-bounce-in" style={{ fontSize: "48px", textAlign: "center" }}>{item.prompt_image}</div>}
          <div className="animate-slide-up" style={{ fontSize: "32px", fontWeight: 700, color: "var(--color-primary)", textAlign: "center" }}>{item.answer}</div>
          {item.hint_l1?.tr && <L1Hint item={item} />}
          <button onClick={() => speak(item.audio || item.answer)} style={{ width: "56px", height: "56px", borderRadius: "50%", border: "2px solid var(--color-primary)", background: "var(--color-bg-card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>🔊</button>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>{presentIndex + 1} / {currentStage.items.length}</p>
        </div>
        <BottomButton onClick={handleNext} label="Next" />
      </LessonShell>
    );
  }

  // ORIGINAL EXAMPLES (non-visual)
  if (currentStage.type === "examples") {
    const item = currentStage.items[presentIndex];
    return (
      <LessonShell title={currentStage.title} progress={progressPercent} stageLabel="Examples" onClose={() => router.push(`/learn/${nodeId}`)}>
        <div key={animKey} className="animate-slide-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px", padding: "40px 24px" }}>
          <div style={{ fontSize: "20px", color: "var(--color-text)", textAlign: "center", lineHeight: 1.6 }}>{item.prompt}</div>
          <div className="animate-bounce-in" style={{ fontSize: "48px", fontWeight: 700, color: "var(--color-primary)" }}>{item.answer}</div>
          {item.hint_l1?.tr && <L1Hint item={item} />}
          <button onClick={() => speak(item.prompt + " " + item.answer)} style={{ width: "56px", height: "56px", borderRadius: "50%", border: "2px solid var(--color-primary)", background: "var(--color-bg-card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>🔊</button>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>{presentIndex + 1} / {currentStage.items.length}</p>
        </div>
        <BottomButton onClick={handleNext} label="Next" />
      </LessonShell>
    );
  }

  // ==========================================
  // EXERCISES
  // ==========================================
  let exercise, currentNext;
  if (isRetrying && currentStage.type === "checkpoint") { exercise = failedItems[retryIndex]?.exercise; currentNext = handleCheckpointNext; }
  else { exercise = (currentStage.exercises || [])[exerciseIndex]; currentNext = handleNext; }
  if (!exercise) return null;

  const stageLabel = currentStage.type === "guided" ? "Practice" : currentStage.type === "free" ? "Apply" : isRetrying ? "Retry" : "Checkpoint";

  // MULTIPLE CHOICE
  if (exercise.type === "multiple_choice") {
    const opts = exercise.options.slice(0, exercise.options_count || exercise.options.length);
    return (
      <LessonShell title={currentStage.title} progress={progressPercent} stageLabel={stageLabel} onClose={() => router.push(`/learn/${nodeId}`)}>
        {showConfetti && <Confetti />}
        <div key={animKey} className="animate-slide-in" style={{ padding: "24px" }}>
          {exercise.question_image && <div className="animate-bounce-in" style={{ fontSize: "56px", textAlign: "center", marginBottom: "16px", padding: "20px", borderRadius: "var(--radius-lg)", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>{exercise.question_image}</div>}
          <SpeakerBtn onClick={() => { if (exercise.audio) speak(exercise.audio); else if (exercise.question_image) speak("Which one?"); else speak(exercise.question); }} />
          {exercise.question && (!exercise.question_image || exercise.question.length > 20) && <p style={{ fontSize: "20px", fontWeight: 600, color: "var(--color-text)", textAlign: "center", marginBottom: "24px" }}>{exercise.question}</p>}
          <TryAgain />
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }} className={shakeWrong ? "animate-shake" : ""}>
            {opts.map((opt, i) => {
              let bg = "var(--color-bg-card)", border = "var(--color-border)", tc = "var(--color-text)", cls = "";
              if (answered && isCorrect && i === exercise.correct) { bg = "var(--color-success)"; border = "var(--color-success)"; tc = "#FFFFFF"; cls = "animate-pop"; }
              else if (showingCorrect && i === exercise.correct) { bg = "var(--color-success)"; border = "var(--color-success)"; tc = "#FFFFFF"; cls = "animate-pop"; }
              else if (showingCorrect && i === selected) { bg = "var(--color-error)"; border = "var(--color-error)"; tc = "#FFFFFF"; }
              return <button key={i} onClick={() => handleMC(i, exercise.correct, exercise)} className={cls} style={{ padding: "16px 20px", borderRadius: "var(--radius-md)", border: `2px solid ${border}`, background: bg, cursor: answered || showingCorrect ? "default" : "pointer", fontSize: "18px", fontWeight: 500, color: tc, textAlign: "center", transition: "all 0.2s ease", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>{opt}</button>;
            })}
          </div>
          {answered && isCorrect && <CorrectFeedback />}
          {showingCorrect && <WrongFeedback text={exercise.options[exercise.correct]} />}
        </div>
        {answered && isCorrect && <BottomButton onClick={currentNext} label="Continue" />}
      </LessonShell>
    );
  }

  // FILL IN THE BLANK
  if (exercise.type === "fill_blank") {
    return (
      <LessonShell title={currentStage.title} progress={progressPercent} stageLabel={stageLabel} onClose={() => router.push(`/learn/${nodeId}`)}>
        {showConfetti && <Confetti />}
        <div key={animKey} className="animate-slide-in" style={{ padding: "24px" }}>
          {exercise.hint_image && <div className="animate-bounce-in" style={{ fontSize: "48px", textAlign: "center", marginBottom: "16px", padding: "16px", borderRadius: "var(--radius-lg)", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>{exercise.hint_image}</div>}
          <SpeakerBtn onClick={() => speak(exercise.sentence.replace("___", exercise.answer))} />
          <p style={{ fontSize: "24px", fontWeight: 600, color: "var(--color-text)", textAlign: "center", marginBottom: "32px" }}>{exercise.sentence}</p>
          <TryAgain />
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "24px" }} className={shakeWrong ? "animate-shake" : ""}>
            <input type="text" value={typed} onChange={(e) => setTyped(e.target.value)} disabled={answered || showingCorrect} placeholder="?" autoFocus style={{ padding: "14px 20px", borderRadius: "var(--radius-md)", border: answered ? "2px solid var(--color-success)" : showingCorrect ? "2px solid var(--color-error)" : "2px solid var(--color-border)", background: "var(--color-bg-card)", fontSize: "24px", fontWeight: 600, textAlign: "center", color: "var(--color-text)", outline: "none", width: "200px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }} onKeyDown={(e) => { if (e.key === "Enter" && !answered && !showingCorrect && typed.trim()) handleFB(exercise.answer, exercise); }} />
          </div>
          {!answered && !showingCorrect && typed.trim() && <div style={{ display: "flex", justifyContent: "center" }}><button onClick={() => handleFB(exercise.answer, exercise)} style={{ padding: "12px 32px", borderRadius: "var(--radius-full)", border: "none", background: "var(--color-primary)", color: "#FFFFFF", fontSize: "16px", fontWeight: 600, cursor: "pointer" }}>Check</button></div>}
          {answered && isCorrect && <CorrectFeedback />}
          {showingCorrect && <WrongFeedback text={exercise.answer} />}
        </div>
        {answered && isCorrect && <BottomButton onClick={currentNext} label="Continue" />}
      </LessonShell>
    );
  }

  // TAP CORRECT
  if (exercise.type === "tap_correct") {
    return (
      <LessonShell title={currentStage.title} progress={progressPercent} stageLabel="Practice" onClose={() => router.push(`/learn/${nodeId}`)}>
        {showConfetti && <Confetti />}
        <div key={animKey} className="animate-slide-in" style={{ padding: "24px" }}>
          <SpeakerBtn onClick={() => speak(exercise.question)} />
          <p style={{ fontSize: "20px", fontWeight: 600, color: "var(--color-text)", textAlign: "center", marginBottom: "32px" }}>{exercise.question}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
            {exercise.options.map((opt, i) => {
              const isSel = selected?.includes(i), shouldBe = exercise.correct.includes(i);
              let bg = "var(--color-bg-card)", border = "var(--color-border)";
              if (answered) { if (shouldBe) { bg = "var(--color-success)"; border = "var(--color-success)"; } else if (isSel) { bg = "var(--color-error)"; border = "var(--color-error)"; } }
              else if (isSel) { border = "var(--color-primary)"; bg = "var(--color-primary-light)"; }
              return <button key={i} onClick={() => { if (answered) return; const c = selected || []; if (c.includes(i)) setSelected(c.filter((x) => x !== i)); else setSelected([...c, i]); }} style={{ padding: "14px 24px", borderRadius: "var(--radius-md)", border: `2px solid ${border}`, background: bg, cursor: answered ? "default" : "pointer", fontSize: "18px", fontWeight: 500, color: answered && (shouldBe || isSel) ? "#FFFFFF" : "var(--color-text)", transition: "all 0.2s ease", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>{opt}</button>;
            })}
          </div>
          {!answered && selected?.length > 0 && <div style={{ display: "flex", justifyContent: "center", marginTop: "24px" }}><button onClick={() => { setAnswered(true); setTotalQuestions((t) => t + 1); const c = exercise.correct, s = selected || []; const ok = c.length === s.length && c.every((x) => s.includes(x)); setIsCorrect(ok); if (ok) { setScore((x) => x + 1); speak("Correct!"); triggerConfetti(); } else speak("Not quite."); }} style={{ padding: "12px 32px", borderRadius: "var(--radius-full)", border: "none", background: "var(--color-primary)", color: "#FFFFFF", fontSize: "16px", fontWeight: 600, cursor: "pointer" }}>Check</button></div>}
          {answered && isCorrect && <CorrectFeedback />}
          {answered && !isCorrect && <WrongFeedback text={exercise.correct.map((i) => exercise.options[i]).join(", ")} />}
        </div>
        {answered && <BottomButton onClick={currentNext} label="Continue" />}
      </LessonShell>
    );
  }

  // DRAG MATCH
  if (exercise.type === "drag_match") {
    return (
      <LessonShell title={currentStage.title} progress={progressPercent} stageLabel="Apply" onClose={() => router.push(`/learn/${nodeId}`)}>
        <div key={animKey} className="animate-slide-in" style={{ padding: "24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {exercise.pairs.map((p, i) => (
              <button key={i} onClick={() => speak(`${p[0]} is for ${p[1]}`)} className="animate-slide-up" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "24px", padding: "14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", animationDelay: `${i * 0.08}s`, animationFillMode: "both" }}>
                <span style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-primary)" }}>{p[0]}</span>
                <span style={{ color: "var(--color-text-muted)" }}>→</span>
                <span style={{ fontSize: "32px" }}>{p[1]}</span>
                <span style={{ fontSize: "16px", marginLeft: "8px" }}>🔊</span>
              </button>
            ))}
          </div>
        </div>
        <BottomButton onClick={currentNext} label="I Got It!" />
      </LessonShell>
    );
  }

  // LISTEN AND PICK
  if (exercise.type === "listen_pick") {
    return (
      <LessonShell title={currentStage.title} progress={progressPercent} stageLabel={stageLabel} onClose={() => router.push(`/learn/${nodeId}`)}>
        {showConfetti && <Confetti />}
        <div key={animKey} className="animate-slide-in" style={{ padding: "24px" }}>
          <p style={{ fontSize: "18px", color: "var(--color-text-light)", textAlign: "center", marginBottom: "24px" }}>🎧</p>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "32px" }}>
            <button onClick={() => speak(exercise.audio)} className="animate-float" style={{ width: "72px", height: "72px", borderRadius: "50%", border: "3px solid var(--color-primary)", background: "var(--color-bg-card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>🔊</button>
          </div>
          <TryAgain />
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }} className={shakeWrong ? "animate-shake" : ""}>
            {exercise.options.map((opt, i) => {
              let bg = "var(--color-bg-card)", border = "var(--color-border)", tc = "var(--color-text)", cls = "";
              if (answered && isCorrect && i === exercise.correct) { bg = "var(--color-success)"; border = "var(--color-success)"; tc = "#FFFFFF"; cls = "animate-pop"; }
              else if (showingCorrect && i === exercise.correct) { bg = "var(--color-success)"; border = "var(--color-success)"; tc = "#FFFFFF"; cls = "animate-pop"; }
              else if (showingCorrect && i === selected) { bg = "var(--color-error)"; border = "var(--color-error)"; tc = "#FFFFFF"; }
              return <button key={i} onClick={() => handleMC(i, exercise.correct, exercise)} className={cls} style={{ padding: "16px 20px", borderRadius: "var(--radius-md)", border: `2px solid ${border}`, background: bg, cursor: answered || showingCorrect ? "default" : "pointer", fontSize: "18px", fontWeight: 500, color: tc, textAlign: "center", transition: "all 0.2s ease", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>{opt}</button>;
            })}
          </div>
          {answered && isCorrect && <CorrectFeedback />}
          {showingCorrect && <WrongFeedback text={exercise.options[exercise.correct]} />}
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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--color-bg)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px", background: "var(--color-bg-nav)", borderBottom: "1px solid var(--color-border)" }}>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--color-text-muted)", padding: "4px" }}>✕</button>
        <div style={{ flex: 1 }}>
          <div style={{ height: "8px", borderRadius: "4px", background: "var(--color-border)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, borderRadius: "4px", background: "linear-gradient(90deg, var(--color-primary), var(--color-primary-light))", transition: "width 0.5s ease" }} />
          </div>
        </div>
        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{stageLabel}</span>
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function BottomButton({ onClick, label }) {
  return (
    <div className="animate-slide-up" style={{ padding: "16px 24px", paddingBottom: "calc(16px + env(safe-area-inset-bottom))", borderTop: "1px solid var(--color-border)", background: "var(--color-bg-nav)" }}>
      <button onClick={onClick} style={{ width: "100%", padding: "16px", borderRadius: "var(--radius-full)", border: "none", background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))", color: "#FFFFFF", fontSize: "16px", fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>{label}</button>
    </div>
  );
}