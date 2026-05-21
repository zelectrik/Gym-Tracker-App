import { useEffect, useState } from "react";
import { api } from "../api";
import type { WorkoutSession } from "../types";
import { ExerciseTable } from "./ExerciseTable";

export function ActiveWorkout({
  session,
  onRefresh,
}: {
  session: WorkoutSession;
  onRefresh: () => void;
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
    <section className="card active-workout">
      <div className="section-title sticky-workout-head">
        <div>
          <span className="pill">Séance en cours</span>

          <h3>{session.title}</h3>

          <p>
            Choisis l’exercice disponible en salle, puis valide les lignes
            préremplies.
          </p>
        </div>

        <button className="primary finish-button" onClick={finish}>
          Terminer
        </button>
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
