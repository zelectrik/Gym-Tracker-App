import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import type { Exercise, ExecutionMode, WorkoutTemplate } from "../types";

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
  notes?: string;
};

type TemplatePayload = {
  name: string;
  description?: string;
  exercises: Array<{
    exerciseId: string;
    position: number;
    targetSets: number;
    targetReps?: number;
    targetDurationSec?: number;
    restSeconds?: number;
    executionMode?: ExecutionMode;
    targetWeightKg?: number;
    leftWeightKg?: number;
    rightWeightKg?: number;
    notes?: string;
  }>;
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

function moveDraft(
  selected: PlannedExerciseDraft[],
  setSelected: React.Dispatch<React.SetStateAction<PlannedExerciseDraft[]>>,
  exerciseId: string,
  direction: "up" | "down",
) {
  const index = selected.findIndex((item) => item.exerciseId === exerciseId);
  const targetIndex = direction === "up" ? index - 1 : index + 1;

  if (index < 0 || targetIndex < 0 || targetIndex >= selected.length) return;

  const copy = [...selected];
  const [item] = copy.splice(index, 1);
  copy.splice(targetIndex, 0, item);
  setSelected(copy);
}

function buildDraftFromTemplate(template: WorkoutTemplate): PlannedExerciseDraft[] {
  return [...template.exercises]
    .sort((a, b) => a.position - b.position)
    .map((item) => ({
      exerciseId: item.exerciseId,
      targetSets: item.targetSets ?? 3,
      targetReps: item.targetReps ?? 10,
      targetDurationSec: item.targetDurationSec ?? undefined,
      executionMode: item.executionMode ?? "BILATERAL",
      targetWeightKg: item.targetWeightKg ?? 0,
      leftWeightKg: item.leftWeightKg ?? 0,
      rightWeightKg: item.rightWeightKg ?? 0,
      restSeconds: item.restSeconds ?? 90,
      notes: item.notes ?? undefined,
    }));
}

function isCardioOrDuration(exercise?: Exercise) {
  return exercise?.trackingType === "CARDIO" || exercise?.progressionType === "DURATION";
}

export function CreateTemplate({
  exercises,
  onCreated,
  templateToEdit = null,
  onCancelEdit,
}: {
  exercises: Exercise[];
  onCreated: () => void;
  templateToEdit?: WorkoutTemplate | null;
  onCancelEdit?: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<PlannedExerciseDraft[]>([]);
  const isEditing = Boolean(templateToEdit);

  useEffect(() => {
    if (!templateToEdit) return;

    setName(templateToEdit.name);
    setDescription(templateToEdit.description ?? "");
    setSelected(buildDraftFromTemplate(templateToEdit));
  }, [templateToEdit]);

  const available = useMemo(
    () =>
      exercises.filter(
        (exercise) => !selected.some((item) => item.exerciseId === exercise.id),
      ),
    [exercises, selected],
  );

  function resetForm() {
    setName("");
    setDescription("");
    setSelected([]);
  }

  function buildPayload(): TemplatePayload {
    return {
      name,
      description: description || undefined,
      exercises: selected.map((item, index) => {
        const exercise = exercises.find((candidate) => candidate.id === item.exerciseId);
        const isDurationExercise = isCardioOrDuration(exercise);

        return {
          exerciseId: item.exerciseId,
          position: index + 1,
          targetSets: item.targetSets,
          targetReps: isDurationExercise ? undefined : item.targetReps,
          targetDurationSec: isDurationExercise ? item.targetDurationSec : undefined,
          restSeconds: item.restSeconds,
          executionMode: item.executionMode,
          targetWeightKg:
            !isDurationExercise && item.executionMode === "BILATERAL"
              ? item.targetWeightKg
              : undefined,
          leftWeightKg:
            !isDurationExercise && item.executionMode === "LEFT_RIGHT"
              ? item.leftWeightKg
              : undefined,
          rightWeightKg:
            !isDurationExercise && item.executionMode === "LEFT_RIGHT"
              ? item.rightWeightKg
              : undefined,
          notes: item.notes || undefined,
        };
      }),
    };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const payload = buildPayload();

    if (templateToEdit) {
      await api.updateTemplate(templateToEdit.id, payload);
    } else {
      await api.createTemplate(payload);
    }

    resetForm();
    onCreated();
  }

  return (
    <section className={`card ${isEditing ? "editing-template-card" : ""}`}>
      <div className="section-title">
        <div>
          <span className="pill">{isEditing ? "Édition" : "V1 MVP"}</span>

          <h3>{isEditing ? `Modifier ${templateToEdit?.name}` : "Créer un entraînement planifié"}</h3>

          <p>
            Définis les exercices, séries, reps, durée, charges et mode d’exécution.
          </p>
        </div>

        {isEditing && onCancelEdit && (
          <button
            type="button"
            onClick={() => {
              resetForm();
              onCancelEdit();
            }}
          >
            Annuler
          </button>
        )}
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
          Description
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Séance solo, séance avec amie..."
          />
        </label>

        <label>
          Ajouter un exercice
          <select
            onChange={(e) => {
              if (e.target.value) {
                const selectedExercise = exercises.find(
                  (exercise) => exercise.id === e.target.value,
                );
                const isDurationExercise = selectedExercise?.progressionType === "DURATION";
                const isCardioExercise = selectedExercise?.trackingType === "CARDIO";
                const usesDuration = isDurationExercise || isCardioExercise;

                setSelected([
                  ...selected,
                  {
                    exerciseId: e.target.value,
                    targetSets: 3,
                    targetReps: usesDuration ? 0 : 10,
                    targetDurationSec: usesDuration ? (isCardioExercise ? 1800 : 30) : undefined,
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

            const isCardioExercise = exercise?.trackingType === "CARDIO";
            const isDurationExercise = exercise?.progressionType === "DURATION" || isCardioExercise;

            return (
              <article className="planned-line" key={item.exerciseId}>
                <div className="planned-title">
                  <b>
                    {index + 1}. {exercise?.name}
                  </b>

                  <div className="template-line-actions">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveDraft(selected, setSelected, item.exerciseId, "up")}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={index === selected.length - 1}
                      onClick={() => moveDraft(selected, setSelected, item.exerciseId, "down")}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSelected(
                          selected.filter(
                            (candidate) => candidate.exerciseId !== item.exerciseId,
                          ),
                        )
                      }
                    >
                      Retirer
                    </button>
                  </div>
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
                      {isCardioExercise ? "Durée min" : "Durée sec"}
                      <input
                        type="number"
                        min="1"
                        value={
                          isCardioExercise
                            ? Math.round((item.targetDurationSec ?? 1800) / 60)
                            : (item.targetDurationSec ?? 30)
                        }
                        onChange={(e) =>
                          updateDraft(selected, setSelected, item.exerciseId, {
                            targetDurationSec: isCardioExercise
                              ? Number(e.target.value) * 60
                              : Number(e.target.value),
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

                  {!isDurationExercise && (
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
                  )}

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
                            updateDraft(selected, setSelected, item.exerciseId, {
                              targetWeightKg: Number(e.target.value),
                            })
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
                              updateDraft(selected, setSelected, item.exerciseId, {
                                leftWeightKg: Number(e.target.value),
                              })
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
                              updateDraft(selected, setSelected, item.exerciseId, {
                                rightWeightKg: Number(e.target.value),
                              })
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
          {isEditing ? "Enregistrer les modifications" : "Enregistrer l'entraînement"}
        </button>
      </form>
    </section>
  );
}
