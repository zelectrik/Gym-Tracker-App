import { useState } from "react";
import { api } from "../api";
import type { Exercise, ExecutionMode } from "../types";

type PlannedExerciseDraft = {
  exerciseId: string;
  targetSets: number;
  targetReps: number;
  executionMode: ExecutionMode;
  targetWeightKg: number;
  leftWeightKg: number;
  rightWeightKg: number;
  targetDurationSec?: number;
  restSeconds: number;
};

function updateDraft(
  selected: PlannedExerciseDraft[],
  setSelected: React.Dispatch<React.SetStateAction<PlannedExerciseDraft[]>>,
  exerciseId: string,
  patch: Partial<PlannedExerciseDraft>,
) {
  setSelected(
    selected.map((item) =>
      item.exerciseId === exerciseId ? { ...item, ...patch } : item,
    ),
  );
}

export function CreateTemplate({
  exercises,
  onCreated,
}: {
  exercises: Exercise[];
  onCreated: () => void;
}) {
  const [name, setName] = useState("");

  const [selected, setSelected] = useState<PlannedExerciseDraft[]>([]);

  const available = exercises.filter(
    (exercise) => !selected.some((item) => item.exerciseId === exercise.id),
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    await api.createTemplate({
      name,
      exercises: selected.map((item, index) => ({
        exerciseId: item.exerciseId,
        position: index + 1,
        targetSets: item.targetSets,
        targetReps: item.targetDurationSec ? undefined : item.targetReps,
        targetDurationSec: item.targetDurationSec,
        restSeconds: item.restSeconds,
        executionMode: item.executionMode,
        targetWeightKg:
          item.executionMode === "BILATERAL" ? item.targetWeightKg : undefined,
        leftWeightKg:
          item.executionMode === "LEFT_RIGHT" ? item.leftWeightKg : undefined,
        rightWeightKg:
          item.executionMode === "LEFT_RIGHT" ? item.rightWeightKg : undefined,
      })),
    });

    setName("");
    setSelected([]);

    onCreated();
  }

  return (
    <section className="card">
      <div className="section-title">
        <div>
          <span className="pill">V1 MVP</span>

          <h3>Créer un entraînement planifié</h3>

          <p>
            Définis les exercices, séries, reps, durée, charges et mode
            d’exécution.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="template-builder">
        <label>
          Nom de l'entraînement
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="FULL BODY A"
          />
        </label>

        <label>
          Ajouter un exercice
          <select
            onChange={(e) => {
              if (e.target.value) {
                setSelected([
                  ...selected,
                  {
                    exerciseId: e.target.value,
                    targetSets: 3,
                    targetReps: 10,
                    executionMode: "BILATERAL",
                    targetWeightKg: 0,
                    leftWeightKg: 0,
                    rightWeightKg: 0,
                    restSeconds: 90,
                  },
                ]);
              }

              e.currentTarget.value = "";
            }}
          >
            <option value="">Sélectionner...</option>

            {available.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name} · {exercise.muscleGroup}
              </option>
            ))}
          </select>
        </label>

        <div className="planned-exercises">
          {selected.map((item, index) => {
            const exercise = exercises.find(
              (candidate) => candidate.id === item.exerciseId,
            );

            const isDurationExercise = exercise?.name
              .toLowerCase()
              .includes("gainage");

            return (
              <article className="planned-line" key={item.exerciseId}>
                <div className="planned-title">
                  <b>
                    {index + 1}. {exercise?.name}
                  </b>

                  <button
                    type="button"
                    onClick={() =>
                      setSelected(
                        selected.filter(
                          (candidate) =>
                            candidate.exerciseId !== item.exerciseId,
                        ),
                      )
                    }
                  >
                    Retirer
                  </button>
                </div>

                <div className="planned-grid">
                  <label>
                    Séries
                    <input
                      type="number"
                      min="1"
                      value={item.targetSets}
                      onChange={(e) =>
                        updateDraft(selected, setSelected, item.exerciseId, {
                          targetSets: Number(e.target.value),
                        })
                      }
                    />
                  </label>

                  {isDurationExercise ? (
                    <label>
                      Durée sec
                      <input
                        type="number"
                        min="1"
                        value={item.targetDurationSec ?? 30}
                        onChange={(e) =>
                          updateDraft(selected, setSelected, item.exerciseId, {
                            targetDurationSec: Number(e.target.value),
                          })
                        }
                      />
                    </label>
                  ) : (
                    <label>
                      Reps
                      <input
                        type="number"
                        min="1"
                        value={item.targetReps}
                        onChange={(e) =>
                          updateDraft(selected, setSelected, item.exerciseId, {
                            targetReps: Number(e.target.value),
                          })
                        }
                      />
                    </label>
                  )}

                  <label>
                    Mode
                    <select
                      value={item.executionMode}
                      onChange={(e) =>
                        updateDraft(selected, setSelected, item.exerciseId, {
                          executionMode: e.target.value as ExecutionMode,
                        })
                      }
                    >
                      <option value="BILATERAL">bilatéral</option>

                      <option value="LEFT_RIGHT">gauche puis droite</option>
                    </select>
                  </label>

                  {!isDurationExercise &&
                    (item.executionMode === "BILATERAL" ? (
                      <label>
                        Poids kg
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={item.targetWeightKg}
                          onChange={(e) =>
                            updateDraft(
                              selected,
                              setSelected,
                              item.exerciseId,
                              {
                                targetWeightKg: Number(e.target.value),
                              },
                            )
                          }
                        />
                      </label>
                    ) : (
                      <>
                        <label>
                          Poids gauche
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={item.leftWeightKg}
                            onChange={(e) =>
                              updateDraft(
                                selected,
                                setSelected,
                                item.exerciseId,
                                {
                                  leftWeightKg: Number(e.target.value),
                                },
                              )
                            }
                          />
                        </label>

                        <label>
                          Poids droite
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={item.rightWeightKg}
                            onChange={(e) =>
                              updateDraft(
                                selected,
                                setSelected,
                                item.exerciseId,
                                {
                                  rightWeightKg: Number(e.target.value),
                                },
                              )
                            }
                          />
                        </label>
                      </>
                    ))}
                </div>
              </article>
            );
          })}
        </div>

        <button className="primary large-action" disabled={!selected.length}>
          Enregistrer l'entraînement
        </button>
      </form>
    </section>
  );
}
