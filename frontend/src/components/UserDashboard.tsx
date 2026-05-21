import { useEffect, useState } from "react";
import { api } from "../api";
import type {
  Exercise,
  Progress,
  User,
  WorkoutSession,
  WorkoutTemplate,
} from "../types";
import { modeLabels } from "../utils/workoutLabels";
import { WorkoutExecutionScreen } from "./workout/WorkoutExecutionScreen";
import { CreateTemplate } from "./CreateTemplate";
import { ImportProgramJson } from "./ImportProgramJson";
import { ActiveWorkout } from "./ActiveWorkout";

export function UserDashboard({ user }: { user: User }) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [focusMode, setFocusMode] = useState(true);

  const active = sessions.find((s) => s.status === "IN_PROGRESS");

  async function refresh() {
    const [ex, tpl, ses, prog] = await Promise.all([
      api.exercises(),
      api.templates(),
      api.sessions(),
      api.progress(),
    ]);

    setExercises(ex);
    setTemplates(tpl);
    setSessions(ses);
    setProgress(prog);
  }

  useEffect(() => {
    refresh();
  }, []);

  if (active && focusMode) {
    return (
      <ActiveWorkout
        session={active}
        onRefresh={refresh}
        onExitFocus={() => setFocusMode(false)}
        isFocusMode
      />
    );
  }

  async function launch(template: WorkoutTemplate) {
    const created = await api.createSession({
      title: template.name,
      templateId: template.id,
    });

    await api.updateSessionStatus(created.id, "IN_PROGRESS");

    refresh();
  }

  return (
    <main className="layout">
      <section className="card dashboard-head">
        {active && (
          <section className="card">
            <h3>Séance en cours</h3>
            <p>{active.title}</p>
            <button className="primary" onClick={() => setFocusMode(true)}>
              Reprendre en mode focus
            </button>
          </section>
        )}
        <div>
          <h2>Dashboard de {user.displayName}</h2>

          <p>
            Crée un plan, lance une séance, choisis l’exercice dispo en salle et
            valide les lignes préremplies.
          </p>
        </div>

        {progress && (
          <div className="stats">
            <div>
              <b>{progress.totalSessions}</b>
              <span>séances finies</span>
            </div>

            <div>
              <b>{progress.totalSets}</b>
              <span>séries validées</span>
            </div>

            <div>
              <b>{Math.round(progress.totalVolumeKg)}</b>
              <span>kg de volume</span>
            </div>
          </div>
        )}
      </section>

      {active ? (
        <WorkoutExecutionScreen session={active} onRefresh={refresh} />
      ) : (
        <>
          <ImportProgramJson onImported={refresh} />
          <CreateTemplate exercises={exercises} onCreated={refresh} />
        </>
      )}

      {!active && (
        <section className="card">
          <h3>Lancer un entraînement enregistré</h3>

          <div className="cards">
            {templates.map((template) => (
              <article className="mini-card" key={template.id}>
                <h4>{template.name}</h4>

                <p>{template.exercises.length} exercices planifiés</p>

                <ul className="template-summary">
                  {template.exercises.slice(0, 4).map((item) => (
                    <li key={item.id}>
                      {item.position}. {item.exercise.name} · {item.targetSets}×
                      {item.targetDurationSec
                        ? `${item.targetDurationSec}s`
                        : (item.targetReps ?? "?")}{" "}
                      · {modeLabels[item.executionMode]}
                    </li>
                  ))}
                </ul>

                <button className="primary" onClick={() => launch(template)}>
                  Lancer
                </button>
              </article>
            ))}

            {templates.length === 0 && (
              <p>Aucun entraînement enregistré pour le moment.</p>
            )}
          </div>
        </section>
      )}

      <section className="card">
        <h3>Historique</h3>

        <div className="history">
          {sessions.map((s) => (
            <div key={s.id}>
              <b>{s.title}</b>

              <span>
                {s.status} · {s.exercises.length} exercices
              </span>
            </div>
          ))}

          {sessions.length === 0 && <p>Aucune séance pour le moment.</p>}
        </div>
      </section>
    </main>
  );
}
