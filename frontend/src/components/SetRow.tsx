import { useEffect, useState } from "react";
import { api } from "../api";
import type { ExerciseSide } from "../types";
import { sideLabels } from "../utils/workoutLabels";

type Props = {
  set: {
    id: string;
    setNumber: number;
    side: ExerciseSide;
    reps?: number | null;
    weightKg?: number | null;
    durationSec?: number | null;
    completed?: boolean;
  };
  sessionExerciseId: string;
  isDurationExercise: boolean;
  defaultDurationSec: number | null;
  onRefresh: () => void;
};

export function SetRow({
  set,
  sessionExerciseId,
  isDurationExercise,
  defaultDurationSec,
  onRefresh,
}: Props) {
  const [reps, setReps] = useState(set.reps ?? 0);
  const [weightKg, setWeightKg] = useState(set.weightKg ?? 0);
  const [durationSec, setDurationSec] = useState(
    set.durationSec ?? defaultDurationSec ?? 0,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setReps(set.reps ?? 0);
    setWeightKg(set.weightKg ?? 0);
    setDurationSec(set.durationSec ?? defaultDurationSec ?? 0);
  }, [set.reps, set.weightKg, set.durationSec, defaultDurationSec]);

  async function validate() {
    setSaving(true);

    try {
      await api.addSet(sessionExerciseId, {
        setNumber: set.setNumber,
        side: set.side,
        reps: isDurationExercise ? undefined : reps,
        weightKg: isDurationExercise ? undefined : weightKg,
        durationSec: isDurationExercise ? durationSec : undefined,
        completed: true,
      });

      onRefresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={`set-row ${
        isDurationExercise ? "duration-row" : ""
      } ${set.completed ? "completed" : ""}`}
    >
      <span className="set-number">{set.setNumber}</span>

      <span>{sideLabels[set.side]}</span>

      {isDurationExercise ? (
        <input
          type="number"
          min="0"
          inputMode="numeric"
          value={durationSec}
          onChange={(e) => setDurationSec(Number(e.target.value))}
        />
      ) : (
        <>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={reps}
            onChange={(e) => setReps(Number(e.target.value))}
          />

          <input
            type="number"
            min="0"
            step="0.5"
            inputMode="decimal"
            value={weightKg}
            onChange={(e) => setWeightKg(Number(e.target.value))}
          />
        </>
      )}

      <button
        className={set.completed ? "validated" : "primary"}
        onClick={validate}
        disabled={saving}
      >
        {set.completed ? "Validée" : "Valider"}
      </button>
    </div>
  );
}
