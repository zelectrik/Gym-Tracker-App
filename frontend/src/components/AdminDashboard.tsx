import { useEffect, useState } from "react";
import { api } from "../api";
import type { Exercise, MuscleGroup } from "../types";
import { ExerciseList } from "./ExerciseList";

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

export function AdminDashboard() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>("CHEST");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  async function refresh() {
    setExercises(await api.exercises());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    await api.createExercise({
      name,
      muscleGroup,
      description: description || undefined,
    });

    setName("");
    setDescription("");
    setMessage("Exercice ajouté dans la base générale.");

    refresh();
  }

  return (
    <main className="layout">
      <section className="card">
        <h2>Super admin</h2>

        <p>
          Ajout des types d’exercices globaux utilisés par tous les
          utilisateurs.
        </p>

        <div className="stat">
          <b>{exercises.length}</b>
          <span>exercices en base</span>
        </div>
      </section>

      <section className="card">
        <h3>Ajouter un exercice</h3>

        <form onSubmit={add} className="grid-form">
          <label>
            Nom
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="presse à cuisses"
            />
          </label>

          <label>
            Groupe musculaire
            <select
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}
            >
              {muscleGroups.map((group) => (
                <option key={group}>{group}</option>
              ))}
            </select>
          </label>

          <label className="wide">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <button className="primary">Ajouter</button>

          {message && <p className="success">{message}</p>}
        </form>
      </section>

      <ExerciseList exercises={exercises} />
    </main>
  );
}
