import { useEffect, useState } from "react";
import { api } from "../api";
import type { WorkoutSession } from "../types";
import { ExerciseTable } from "./ExerciseTable";

export function ActiveWorkout({
  session,
  onRefresh,
  onExitFocus,
  isFocusMode = false,
}: {
  session: WorkoutSession;
  onRefresh: () => void;
  onExitFocus?: () => void;
  isFocusMode?: boolean;
}) {
  const [selectedExerciseId, setSelectedExerciseId] = useState(
    session.exercises[0]?.id ?? "",
  );

  const selectedExercise =
    session.exercises.find((exercise) => exercise.id === selectedExerciseId) ??
    session.exercises[0];

  useEffect(() => {
    if (
      !session.exercises.some((exercise) => exercise.id === selectedExerciseId)
    ) {
      setSelectedExerciseId(session.exercises[0]?.id ?? "");
    }
  }, [session.exercises, selectedExerciseId]);

  async function finish() {
    await api.updateSessionStatus(session.id, "COMPLETED");
    onRefresh();
  }

  return (
    <section
      className={`active-workout ${isFocusMode ? "workout-focus" : "card"}`}
    >
      <div className="section-title sticky-workout-head">
        <div>
          <span className="pill">Séance en cours</span>

          <h3>{session.title}</h3>
          <div className="focus-actions">
            {onExitFocus && (
              <button type="button" onClick={onExitFocus}>
                Quitter
              </button>
            )}

            <button className="primary finish-button" onClick={finish}>
              Terminer
            </button>
          </div>
        </div>
      </div>

      <div className="exercise-switcher">
        {session.exercises.map((exercise) => {
          const total = exercise.sets.length;

          const done = exercise.sets.filter((set) => set.completed).length;

          return (
            <button
              type="button"
              key={exercise.id}
              className={exercise.id === selectedExercise?.id ? "active" : ""}
              onClick={() => setSelectedExerciseId(exercise.id)}
            >
              {exercise.position}. {exercise.exercise.name}
              <span>
                {done}/{total}
              </span>
            </button>
          );
        })}
      </div>

      {selectedExercise && (
        <ExerciseTable exercise={selectedExercise} onRefresh={onRefresh} />
      )}
    </section>
  );
}
