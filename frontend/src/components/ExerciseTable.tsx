import type { SessionExercise } from "../types";
import { modeLabels } from "../utils/workoutLabels";
import { SetRow } from "./SetRow";

function sideOrder(side: string) {
  return side === "BOTH" ? 0 : side === "LEFT" ? 1 : 2;
}

export function ExerciseTable({
  exercise,
  onRefresh,
}: {
  exercise: SessionExercise;
  onRefresh: () => void;
}) {
  const orderedSets = [...exercise.sets].sort(
    (a, b) =>
      a.setNumber - b.setNumber ||
      sideOrder(a.side) - sideOrder(b.side),
  );

  const completedCount = orderedSets.filter(
    (set) => set.completed,
  ).length;

  const isDurationExercise = Boolean(
    exercise.targetDurationSec,
  );

  return (
    <article className="logger">
      <div className="logger-head">
        <div>
          <h4>{exercise.exercise.name}</h4>

          <p>
            {exercise.targetSets ?? orderedSets.length} séries ·{" "}
            {isDurationExercise
              ? `${exercise.targetDurationSec}s`
              : `${exercise.targetReps ?? "?"} reps`}{" "}
            · {modeLabels[exercise.executionMode]}
          </p>
        </div>

        <span className="progress-pill">
          {completedCount}/{orderedSets.length} validées
        </span>
      </div>

      <div className="set-table">
        <div
          className={`set-row set-row-head ${
            isDurationExercise ? "duration-row" : ""
          }`}
        >
          <span>Série</span>
          <span>Type</span>
          <span>
            {isDurationExercise ? "Durée sec" : "Reps"}
          </span>

          {!isDurationExercise && <span>Poids</span>}

          <span>Action</span>
        </div>

        {orderedSets.map((set) => (
          <SetRow
            key={set.id}
            set={set}
            sessionExerciseId={exercise.id}
            isDurationExercise={isDurationExercise}
            defaultDurationSec={
              exercise.targetDurationSec ?? null
            }
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </article>
  );
}