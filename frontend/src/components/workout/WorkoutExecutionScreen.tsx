import { useEffect, useMemo, useState } from "react";
import { api } from "../../api";
import type { ExerciseSet, ExerciseSide, SessionExercise, WorkoutSession } from "../../types";

type WorkoutStep = "warmup" | "exercise-list" | "exercise";

type SetGroup = {
  setNumber: number;
  both?: ExerciseSet;
  left?: ExerciseSet;
  right?: ExerciseSet;
  sets: ExerciseSet[];
};

function sideOrder(side: ExerciseSide) {
  return side === "BOTH" ? 0 : side === "LEFT" ? 1 : 2;
}

function getSetGroups(exercise: SessionExercise): SetGroup[] {
  const groups = new Map<number, SetGroup>();

  [...exercise.sets]
    .sort((a, b) => a.setNumber - b.setNumber || sideOrder(a.side) - sideOrder(b.side))
    .forEach((set) => {
      const group = groups.get(set.setNumber) ?? {
        setNumber: set.setNumber,
        sets: [],
      };

      group.sets.push(set);
      if (set.side === "BOTH") group.both = set;
      if (set.side === "LEFT") group.left = set;
      if (set.side === "RIGHT") group.right = set;

      groups.set(set.setNumber, group);
    });

  return [...groups.values()].sort((a, b) => a.setNumber - b.setNumber);
}

function isGroupCompleted(group: SetGroup) {
  return group.sets.every((set) => set.completed);
}

function getNextPendingGroup(exercise: SessionExercise) {
  return getSetGroups(exercise).find((group) => !isGroupCompleted(group));
}

function displaySide(side: ExerciseSide) {
  if (side === "LEFT") return "Gauche";
  if (side === "RIGHT") return "Droite";
  return "Bilatéral";
}

export function WorkoutExecutionScreen({
  session,
  onRefresh,
  onExitFocus,
}: {
  session: WorkoutSession;
  onRefresh: () => void;
  onExitFocus?: () => void;
}) {
  const [step, setStep] = useState<WorkoutStep>("warmup");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

  const exercisesWithProgress = useMemo(() => {
    return session.exercises.map((exercise) => {
      const completed = exercise.sets.every((set) => set.completed);

      return {
        ...exercise,
        completed,
      };
    });
  }, [session.exercises]);

  const selectedExercise = exercisesWithProgress.find(
    (exercise) => exercise.id === selectedExerciseId,
  );

  async function finishWorkout() {
    await api.updateSessionStatus(session.id, "COMPLETED");
    onRefresh();
  }

  if (step === "warmup") {
    return (
      <section className="mobile-workout-screen focus-workout-screen">
        <div className="mobile-workout-card one-page-card">
          <FocusHeader title={session.title} onExitFocus={onExitFocus} onFinish={finishWorkout} />

          <main className="one-page-main warmup-screen">
            <span className="pill">Échauffement</span>

            <h2>Prépare-toi avant la séance</h2>

            <div className="warmup-content">
              <p>5-10 min cardio léger</p>
              <p>Mobilité légère</p>
              <p>Activation musculaire</p>
            </div>
          </main>

          <footer className="one-page-footer">
            <button className="primary fullscreen-button" onClick={() => setStep("exercise-list")}>
              Terminer échauffement
            </button>
          </footer>
        </div>
      </section>
    );
  }

  if (step === "exercise-list") {
    return (
      <section className="mobile-workout-screen focus-workout-screen">
        <div className="mobile-workout-card one-page-card">
          <FocusHeader title={session.title} onExitFocus={onExitFocus} onFinish={finishWorkout} />

          <main className="one-page-main">
            <div className="screen-title-row">
              <div>
                <span className="pill">Exercices</span>
                <h2>Liste des exercices</h2>
              </div>
            </div>

            <div className="exercise-mobile-list no-scroll-list">
              {exercisesWithProgress.map((exercise) => {
                const total = exercise.sets.length;
                const done = exercise.sets.filter((set) => set.completed).length;

                return (
                  <button
                    key={exercise.id}
                    disabled={exercise.completed}
                    className={`exercise-mobile-item focus-exercise-item ${exercise.completed ? "done" : ""}`}
                    onClick={() => {
                      setSelectedExerciseId(exercise.id);
                      setStep("exercise");
                    }}
                  >
                    <div>
                      <strong>
                        {exercise.position}. {exercise.exercise.name}
                      </strong>

                      <span>
                        {exercise.completed ? "Terminé" : `${done}/${total}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </main>

          <footer className="one-page-footer">
            <button className="primary fullscreen-button" onClick={finishWorkout}>
              Finir l'entraînement
            </button>
          </footer>
        </div>
      </section>
    );
  }

  if (!selectedExercise) return null;

  const currentGroup = getNextPendingGroup(selectedExercise);

  if (!currentGroup) {
    return (
      <section className="mobile-workout-screen focus-workout-screen">
        <div className="mobile-workout-card one-page-card">
          <FocusHeader title={session.title} onExitFocus={onExitFocus} onFinish={finishWorkout} />
          <main className="one-page-main centered-focus-message">
            <h2>Exercice terminé</h2>
            <p>{selectedExercise.exercise.name}</p>
          </main>
          <footer className="one-page-footer">
            <button className="primary fullscreen-button" onClick={() => setStep("exercise-list")}>
              Retour à la liste
            </button>
          </footer>
        </div>
      </section>
    );
  }

  return (
    <ExerciseExecutionView
      exercise={selectedExercise}
      currentGroup={currentGroup}
      onBack={() => setStep("exercise-list")}
      onExerciseFinished={() => setStep("exercise-list")}
      onRefresh={onRefresh}
    />
  );
}

function FocusHeader({
  title,
  onExitFocus,
  onFinish,
}: {
  title: string;
  onExitFocus?: () => void;
  onFinish: () => void;
}) {
  return (
    <header className="focus-header">
      <div>
        <strong>{title}</strong>
        <span>Mode entraînement</span>
      </div>

      <div className="focus-header-actions">
        <button type="button">Pause</button>
        {onExitFocus && (
          <button type="button" onClick={onExitFocus}>
            Quitter
          </button>
        )}
        <button type="button" onClick={onFinish}>
          Finir
        </button>
      </div>
    </header>
  );
}

function ExerciseExecutionView({
  exercise,
  currentGroup,
  onBack,
  onExerciseFinished,
  onRefresh,
}: {
  exercise: SessionExercise;
  currentGroup: SetGroup;
  onBack: () => void;
  onExerciseFinished: () => void;
  onRefresh: () => void;
}) {
  const isDurationExercise = Boolean(exercise.targetDurationSec);
  const isLeftRight = Boolean(currentGroup.left || currentGroup.right);

  const [bothReps, setBothReps] = useState(currentGroup.both?.reps ?? exercise.targetReps ?? 0);
  const [bothWeightKg, setBothWeightKg] = useState(
    currentGroup.both?.weightKg ?? exercise.targetWeightKg ?? 0,
  );
  const [bothDurationSec, setBothDurationSec] = useState(
    currentGroup.both?.durationSec ?? exercise.targetDurationSec ?? 30,
  );

  const [leftReps, setLeftReps] = useState(currentGroup.left?.reps ?? exercise.targetReps ?? 0);
  const [rightReps, setRightReps] = useState(currentGroup.right?.reps ?? exercise.targetReps ?? 0);
  const [leftWeightKg, setLeftWeightKg] = useState(
    currentGroup.left?.weightKg ?? exercise.leftWeightKg ?? exercise.targetWeightKg ?? 0,
  );
  const [rightWeightKg, setRightWeightKg] = useState(
    currentGroup.right?.weightKg ?? exercise.rightWeightKg ?? exercise.targetWeightKg ?? 0,
  );
  const [leftDurationSec, setLeftDurationSec] = useState(
    currentGroup.left?.durationSec ?? exercise.targetDurationSec ?? 30,
  );
  const [rightDurationSec, setRightDurationSec] = useState(
    currentGroup.right?.durationSec ?? exercise.targetDurationSec ?? 30,
  );
  const [saving, setSaving] = useState(false);

  const totalSets = exercise.targetSets ?? getSetGroups(exercise).length;

  useEffect(() => {
    setBothReps(currentGroup.both?.reps ?? exercise.targetReps ?? 0);
    setBothWeightKg(currentGroup.both?.weightKg ?? exercise.targetWeightKg ?? 0);
    setBothDurationSec(currentGroup.both?.durationSec ?? exercise.targetDurationSec ?? 30);

    setLeftReps(currentGroup.left?.reps ?? exercise.targetReps ?? 0);
    setRightReps(currentGroup.right?.reps ?? exercise.targetReps ?? 0);
    setLeftWeightKg(currentGroup.left?.weightKg ?? exercise.leftWeightKg ?? exercise.targetWeightKg ?? 0);
    setRightWeightKg(currentGroup.right?.weightKg ?? exercise.rightWeightKg ?? exercise.targetWeightKg ?? 0);
    setLeftDurationSec(currentGroup.left?.durationSec ?? exercise.targetDurationSec ?? 30);
    setRightDurationSec(currentGroup.right?.durationSec ?? exercise.targetDurationSec ?? 30);
  }, [currentGroup, exercise]);

  async function validateGroup() {
    setSaving(true);
    try {
      if (isLeftRight) {
        const calls = [];

        if (currentGroup.left) {
          calls.push(
            api.addSet(exercise.id, {
              setNumber: currentGroup.setNumber,
              side: "LEFT",
              reps: isDurationExercise ? undefined : leftReps,
              weightKg: isDurationExercise ? undefined : leftWeightKg,
              durationSec: isDurationExercise ? leftDurationSec : undefined,
              completed: true,
            }),
          );
        }

        if (currentGroup.right) {
          calls.push(
            api.addSet(exercise.id, {
              setNumber: currentGroup.setNumber,
              side: "RIGHT",
              reps: isDurationExercise ? undefined : rightReps,
              weightKg: isDurationExercise ? undefined : rightWeightKg,
              durationSec: isDurationExercise ? rightDurationSec : undefined,
              completed: true,
            }),
          );
        }

        await Promise.all(calls);
      } else {
        const side = currentGroup.both?.side ?? "BOTH";

        await api.addSet(exercise.id, {
          setNumber: currentGroup.setNumber,
          side,
          reps: isDurationExercise ? undefined : bothReps,
          weightKg: isDurationExercise ? undefined : bothWeightKg,
          durationSec: isDurationExercise ? bothDurationSec : undefined,
          completed: true,
        });
      }

      await onRefresh();
      const remainingAfterCurrent = getSetGroups(exercise).filter(
        (group) => group.setNumber !== currentGroup.setNumber && !isGroupCompleted(group),
      );

      if (remainingAfterCurrent.length === 0) {
        onExerciseFinished();
      }
    } finally {
      setSaving(false);
    }
  }

  async function finishExerciseEarly() {
    setSaving(true);
    try {
      const pendingSets = exercise.sets.filter((set) => !set.completed);

      await Promise.all(
        pendingSets.map((set) =>
          api.addSet(exercise.id, {
            setNumber: set.setNumber,
            side: set.side,
            reps: isDurationExercise ? undefined : (set.reps ?? exercise.targetReps ?? 0),
            weightKg: isDurationExercise
              ? undefined
              : (set.weightKg ?? defaultWeightForSet(exercise, set.side)),
            durationSec: isDurationExercise ? (set.durationSec ?? exercise.targetDurationSec ?? 0) : undefined,
            completed: true,
          }),
        ),
      );

      await onRefresh();
      onExerciseFinished();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mobile-workout-screen focus-workout-screen">
      <div className="mobile-workout-card one-page-card execution-step-card">
        <header className="focus-header compact-focus-header">
          <button className="back-button" onClick={onBack}>
            ← Liste
          </button>
          <div className="exercise-progress">
            Série {currentGroup.setNumber} / {totalSets}
          </div>
        </header>

        <main className="one-page-main exercise-step-main">
          <div className="exercise-step-title">
            <h2>{exercise.exercise.name}</h2>
            <span>{isLeftRight ? "Gauche / Droite" : displaySide(currentGroup.both?.side ?? "BOTH")}</span>
          </div>

          {isLeftRight ? (
            <LeftRightFields
              isDurationExercise={isDurationExercise}
              leftReps={leftReps}
              rightReps={rightReps}
              leftWeightKg={leftWeightKg}
              rightWeightKg={rightWeightKg}
              leftDurationSec={leftDurationSec}
              rightDurationSec={rightDurationSec}
              setLeftReps={setLeftReps}
              setRightReps={setRightReps}
              setLeftWeightKg={setLeftWeightKg}
              setRightWeightKg={setRightWeightKg}
              setLeftDurationSec={setLeftDurationSec}
              setRightDurationSec={setRightDurationSec}
            />
          ) : (
            <BilateralFields
              isDurationExercise={isDurationExercise}
              reps={bothReps}
              weightKg={bothWeightKg}
              durationSec={bothDurationSec}
              setReps={setBothReps}
              setWeightKg={setBothWeightKg}
              setDurationSec={setBothDurationSec}
            />
          )}
        </main>

        <footer className="one-page-footer execution-footer">
          <button className="primary fullscreen-button" onClick={validateGroup} disabled={saving}>
            Valider
          </button>

          <button className="secondary fullscreen-secondary-button" onClick={finishExerciseEarly} disabled={saving}>
            Fin d'exercice
          </button>
        </footer>
      </div>
    </section>
  );
}

function BilateralFields({
  isDurationExercise,
  reps,
  weightKg,
  durationSec,
  setReps,
  setWeightKg,
  setDurationSec,
}: {
  isDurationExercise: boolean;
  reps: number;
  weightKg: number;
  durationSec: number;
  setReps: (value: number) => void;
  setWeightKg: (value: number) => void;
  setDurationSec: (value: number) => void;
}) {
  if (isDurationExercise) {
    return (
      <div className="execution-fields step-fields">
        <label>
          Durée
          <input type="number" value={durationSec} onChange={(e) => setDurationSec(Number(e.target.value))} />
        </label>
      </div>
    );
  }

  return (
    <div className="execution-fields step-fields">
      <label>
        Répétition
        <input type="number" value={reps} onChange={(e) => setReps(Number(e.target.value))} />
      </label>

      <label>
        Poids
        <input type="number" step="0.5" value={weightKg} onChange={(e) => setWeightKg(Number(e.target.value))} />
      </label>
    </div>
  );
}

function LeftRightFields({
  isDurationExercise,
  leftReps,
  rightReps,
  leftWeightKg,
  rightWeightKg,
  leftDurationSec,
  rightDurationSec,
  setLeftReps,
  setRightReps,
  setLeftWeightKg,
  setRightWeightKg,
  setLeftDurationSec,
  setRightDurationSec,
}: {
  isDurationExercise: boolean;
  leftReps: number;
  rightReps: number;
  leftWeightKg: number;
  rightWeightKg: number;
  leftDurationSec: number;
  rightDurationSec: number;
  setLeftReps: (value: number) => void;
  setRightReps: (value: number) => void;
  setLeftWeightKg: (value: number) => void;
  setRightWeightKg: (value: number) => void;
  setLeftDurationSec: (value: number) => void;
  setRightDurationSec: (value: number) => void;
}) {
  if (isDurationExercise) {
    return (
      <div className="left-right-fields">
        <div />
        <strong>Gauche</strong>
        <strong>Droite</strong>

        <span>Durée</span>
        <input type="number" value={leftDurationSec} onChange={(e) => setLeftDurationSec(Number(e.target.value))} />
        <input type="number" value={rightDurationSec} onChange={(e) => setRightDurationSec(Number(e.target.value))} />
      </div>
    );
  }

  return (
    <div className="left-right-fields">
      <div />
      <strong>Gauche</strong>
      <strong>Droite</strong>

      <span>Répétition</span>
      <input type="number" value={leftReps} onChange={(e) => setLeftReps(Number(e.target.value))} />
      <input type="number" value={rightReps} onChange={(e) => setRightReps(Number(e.target.value))} />

      <span>Poids</span>
      <input type="number" step="0.5" value={leftWeightKg} onChange={(e) => setLeftWeightKg(Number(e.target.value))} />
      <input type="number" step="0.5" value={rightWeightKg} onChange={(e) => setRightWeightKg(Number(e.target.value))} />
    </div>
  );
}

function defaultWeightForSet(exercise: SessionExercise, side: ExerciseSide) {
  if (side === "LEFT") return exercise.leftWeightKg ?? exercise.targetWeightKg ?? 0;
  if (side === "RIGHT") return exercise.rightWeightKg ?? exercise.targetWeightKg ?? 0;
  return exercise.targetWeightKg ?? 0;
}
