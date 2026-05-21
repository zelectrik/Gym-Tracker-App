import type { Exercise } from "../types";

export function ExerciseList({ exercises }: { exercises: Exercise[] }) {
  return (
    <section className="card">
      <h3>Exercices disponibles</h3>

      <div className="exercise-list">
        {exercises.map((ex) => (
          <div key={ex.id}>
            <b>{ex.name}</b>
            <span>{ex.muscleGroup}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
