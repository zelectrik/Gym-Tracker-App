
import { useMemo, useState } from "react";
import { api } from "../../api";
import type {
  ExerciseSet,
  SessionExercise,
  WorkoutSession,
} from "../../types";

type WorkoutStep =
  | "warmup"
  | "exercise-list"
  | "exercise";

function getNextPendingSet(exercise: SessionExercise) {
  return [...exercise.sets]
    .sort((a, b) => {
      if (a.setNumber !== b.setNumber) {
        return a.setNumber - b.setNumber;
      }

      const order = {
        BOTH: 0,
        LEFT: 1,
        RIGHT: 2,
      };

      return order[a.side] - order[b.side];
    })
    .find((set) => !set.completed);
}

export function WorkoutExecutionScreen({
  session,
  onRefresh,
}: {
  session: WorkoutSession;
  onRefresh: () => void;
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
      <section className="mobile-workout-screen">
        <div className="mobile-workout-card">
          <span className="pill">Échauffement</span>

          <h2>{session.title}</h2>

          <div className="warmup-content">
            <p>5-10 min cardio léger</p>
            <p>Mobilité légère</p>
            <p>Activation musculaire</p>
          </div>

          <button
            className="primary fullscreen-button"
            onClick={() => setStep("exercise-list")}
          >
            Terminer échauffement
          </button>
        </div>
      </section>
    );
  }

  if (step === "exercise-list") {
    return (
      <section className="mobile-workout-screen">
        <div className="mobile-workout-card">
          <div className="mobile-workout-header">
            <div>
              <span className="pill">Séance</span>
              <h2>{session.title}</h2>
            </div>

            <button
              className="primary"
              onClick={finishWorkout}
            >
              Finir
            </button>
          </div>

          <div className="exercise-mobile-list">
            {exercisesWithProgress.map((exercise) => (
              <button
                key={exercise.id}
                disabled={exercise.completed}
                className={`exercise-mobile-item ${
                  exercise.completed ? "done" : ""
                }`}
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
                    {exercise.completed
                      ? "Terminé"
                      : "À faire"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!selectedExercise) {
    return null;
  }

  const currentSet = getNextPendingSet(selectedExercise);

  if (!currentSet) {
    setStep("exercise-list");
    return null;
  }

  return (
    <ExerciseExecutionView
      exercise={selectedExercise}
      currentSet={currentSet}
      onBack={() => setStep("exercise-list")}
      onRefresh={onRefresh}
    />
  );
}

function ExerciseExecutionView({
  exercise,
  currentSet,
  onBack,
  onRefresh,
}: {
  exercise: SessionExercise;
  currentSet: ExerciseSet;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const [reps, setReps] = useState(currentSet.reps ?? exercise.targetReps ?? 0);

  const [weightKg, setWeightKg] = useState(
    currentSet.weightKg ??
      exercise.targetWeightKg ??
      0,
  );

  const [durationSec, setDurationSec] = useState(
    currentSet.durationSec ??
      exercise.targetDurationSec ??
      30,
  );

  const isDurationExercise = Boolean(exercise.targetDurationSec);

  async function validate() {
    await api.addSet(exercise.id, {
      setNumber: currentSet.setNumber,
      side: currentSet.side,
      reps: isDurationExercise ? undefined : reps,
      weightKg: isDurationExercise ? undefined : weightKg,
      durationSec: isDurationExercise
        ? durationSec
        : undefined,
      completed: true,
    });

    onRefresh();
  }

  return (
    <section className="mobile-workout-screen">
      <div className="mobile-workout-card execution-card">
        <button
          className="back-button"
          onClick={onBack}
        >
          ← Retour
        </button>

        <div className="exercise-progress">
          Série {currentSet.setNumber} / {exercise.targetSets}
        </div>

        <h2>{exercise.exercise.name}</h2>

        <div className="side-badge">
          {currentSet.side === "LEFT"
            ? "GAUCHE"
            : currentSet.side === "RIGHT"
            ? "DROITE"
            : "BILATÉRAL"}
        </div>

        <div className="execution-fields">
          {isDurationExercise ? (
            <label>
              Durée (sec)

              <input
                type="number"
                value={durationSec}
                onChange={(e) =>
                  setDurationSec(Number(e.target.value))
                }
              />
            </label>
          ) : (
            <>
              <label>
                Reps

                <input
                  type="number"
                  value={reps}
                  onChange={(e) =>
                    setReps(Number(e.target.value))
                  }
                />
              </label>

              <label>
                Poids (kg)

                <input
                  type="number"
                  step="0.5"
                  value={weightKg}
                  onChange={(e) =>
                    setWeightKg(Number(e.target.value))
                  }
                />
              </label>
            </>
          )}
        </div>

        <button
          className="primary fullscreen-button"
          onClick={validate}
        >
          Valider
        </button>
      </div>
    </section>
  );
}
