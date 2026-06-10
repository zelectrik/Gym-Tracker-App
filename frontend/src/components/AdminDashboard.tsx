import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../api";
import type { Exercise, ExerciseType, MuscleGroup, ProgressionType } from "../types";

const muscleGroups: MuscleGroup[] = [
  "CHEST",
  "UPPER_CHEST",
  "BACK",
  "LATS",
  "TRAPS",
  "SHOULDERS",
  "FRONT_SHOULDERS",
  "REAR_SHOULDERS",
  "BICEPS",
  "TRICEPS",
  "FOREARMS",
  "ABS",
  "OBLIQUES",
  "LOWER_BACK",
  "QUADS",
  "HAMSTRINGS",
  "GLUTES",
  "CALVES",
  "ADDUCTORS",
  "ABDUCTORS",
  "CARDIO",
  "CORE",
  "FULL_BODY",
];

const exerciseTypes: ExerciseType[] = [
  "machine",
  "dumbbell",
  "barbell",
  "cable",
  "bodyweight",
  "cardio",
];

const progressionTypes: ProgressionType[] = [
  "WEIGHT",
  "ASSISTED_WEIGHT",
  "DURATION",
];

type ExerciseFormState = {
  name: string;
  muscleGroup: MuscleGroup;
  type: ExerciseType;
  progressionType: ProgressionType;
  description: string;
};

function emptyForm(): ExerciseFormState {
  return {
    name: "",
    muscleGroup: "CHEST",
    type: "machine",
    progressionType: "WEIGHT",
    description: "",
  };
}

function exerciseToForm(exercise: Exercise): ExerciseFormState {
  return {
    name: exercise.name,
    muscleGroup: exercise.muscleGroup,
    type: exercise.type ?? "machine",
    progressionType: exercise.progressionType,
    description: exercise.description ?? "",
  };
}

export function AdminDashboard() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [form, setForm] = useState<ExerciseFormState>(() => emptyForm());
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const editingExercise = useMemo(
    () => exercises.find((exercise) => exercise.id === editingExerciseId) ?? null,
    [editingExerciseId, exercises],
  );

  const filteredExercises = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return exercises;

    return exercises.filter((exercise) => {
      return (
        exercise.name.toLowerCase().includes(normalized) ||
        exercise.muscleGroup.toLowerCase().includes(normalized) ||
        exercise.progressionType.toLowerCase().includes(normalized) ||
        exercise.type.toLowerCase().includes(normalized)
      );
    });
  }, [exercises, search]);

  async function refresh() {
    setExercises(await api.exercises());
  }

  useEffect(() => {
    refresh();
  }, []);

  function updateForm<K extends keyof ExerciseFormState>(key: K, value: ExerciseFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setEditingExerciseId(null);
    setForm(emptyForm());
    setError("");
    setMessage("");
  }

  function startEdit(exercise: Exercise) {
    setEditingExerciseId(exercise.id);
    setForm(exerciseToForm(exercise));
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      name: form.name,
      muscleGroup: form.muscleGroup,
      type: form.type,
      progressionType: form.progressionType,
      description: form.description.trim() || undefined,
    };

    try {
      if (editingExerciseId) {
        await api.updateExercise(editingExerciseId, payload);
        setMessage("Exercice modifié.");
      } else {
        await api.createExercise(payload);
        setMessage("Exercice ajouté dans la base générale.");
      }

      setForm(emptyForm());
      setEditingExerciseId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible");
    } finally {
      setSaving(false);
    }
  }

  async function remove(exercise: Exercise) {
    const confirmed = confirm(`Supprimer l'exercice "${exercise.name}" ?`);
    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await api.deleteExercise(exercise.id);
      setMessage("Exercice supprimé.");
      if (editingExerciseId === exercise.id) resetForm();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suppression impossible");
    }
  }

  return (
    <main className="layout admin-dashboard-v2">
      <section className="card admin-hero-card">
        <div>
          <span className="pill">Super admin</span>
          <h2>Gestion des exercices</h2>
          <p>
            Ajoute, modifie ou supprime les exercices globaux utilisés par les
            programmes et les séances.
          </p>
        </div>

        <div className="stat">
          <b>{exercises.length}</b>
          <span>exercices en base</span>
        </div>
      </section>

      <section className="card">
        <div className="section-title">
          <div>
            <h3>{editingExercise ? "Modifier un exercice" : "Ajouter un exercice"}</h3>
            {editingExercise && <p>Modification de : {editingExercise.name}</p>}
          </div>
          {editingExercise && (
            <button type="button" onClick={resetForm}>Annuler</button>
          )}
        </div>

        <form onSubmit={submit} className="grid-form admin-exercise-form">
          <label>
            Nom
            <input
              value={form.name}
              onChange={(e) => updateForm("name", e.target.value)}
              required
              placeholder="presse à cuisses"
            />
          </label>

          <label>
            Groupe musculaire
            <select
              value={form.muscleGroup}
              onChange={(e) => updateForm("muscleGroup", e.target.value as MuscleGroup)}
            >
              {muscleGroups.map((group) => (
                <option key={group}>{group}</option>
              ))}
            </select>
          </label>

          <label>
            Type d'exercice
            <select
              value={form.type}
              onChange={(e) => updateForm("type", e.target.value as ExerciseType)}
            >
              {exerciseTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>

          <label>
            Type de progression
            <select
              value={form.progressionType}
              onChange={(e) => updateForm("progressionType", e.target.value as ProgressionType)}
            >
              {progressionTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>

          <label className="wide">
            Description
            <textarea
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              placeholder="Optionnel"
            />
          </label>

          {message && <p className="success wide">{message}</p>}
          {error && <p className="error wide">{error}</p>}

          <button className="primary wide" disabled={saving}>
            {saving ? "Enregistrement..." : editingExercise ? "Enregistrer les modifications" : "Ajouter l'exercice"}
          </button>
        </form>
      </section>

      <section className="card">
        <div className="section-title">
          <div>
            <h3>Exercices disponibles</h3>
            <p>Recherche, édition rapide et suppression des exercices non utilisés.</p>
          </div>
        </div>

        <input
          className="admin-exercise-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un exercice..."
        />

        <div className="admin-exercise-list">
          {filteredExercises.map((exercise) => (
            <article key={exercise.id} className="admin-exercise-row">
              <div>
                <b>{exercise.name}</b>
                <span>
                  {exercise.muscleGroup} · {exercise.type} · {exercise.progressionType}
                </span>
                {exercise.description && <small>{exercise.description}</small>}
              </div>

              <div className="admin-exercise-actions">
                <button type="button" onClick={() => startEdit(exercise)}>Modifier</button>
                <button type="button" className="danger" onClick={() => remove(exercise)}>
                  Supprimer
                </button>
              </div>
            </article>
          ))}

          {filteredExercises.length === 0 && <p>Aucun exercice trouvé.</p>}
        </div>
      </section>
    </main>
  );
}
