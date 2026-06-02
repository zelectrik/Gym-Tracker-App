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

function formatTemplateTarget(item: WorkoutTemplate["exercises"][number]) {
  if (item.targetDurationSec) {
    const isCardio = item.exercise.trackingType === "CARDIO";
    return isCardio
      ? `${Math.round(item.targetDurationSec / 60)} min`
      : `${item.targetDurationSec}s`;
  }

  return `${item.targetReps ?? "?"} reps`;
}

export function UserDashboard({ user }: { user: User }) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [focusMode, setFocusMode] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);

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
      <WorkoutExecutionScreen
        session={active}
        onRefresh={refresh}
        onExitFocus={() => setFocusMode(false)}
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

  async function deleteTemplate(template: WorkoutTemplate) {
    const confirmed = confirm(`Supprimer l'entraînement "${template.name}" ?`);
    if (!confirmed) return;

    await api.deleteTemplate(template.id);
    if (editingTemplate?.id === template.id) setEditingTemplate(null);
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

      {!active && (
        <>
          {!editingTemplate && <ImportProgramJson onImported={refresh} />}
          <CreateTemplate
            exercises={exercises}
            templateToEdit={editingTemplate}
            onCancelEdit={() => setEditingTemplate(null)}
            onCreated={() => {
              setEditingTemplate(null);
              refresh();
            }}
          />
        </>
      )}

      {!active && !editingTemplate && (
        <section className="card">
          <h3>Lancer un entraînement enregistré</h3>

          <div className="cards">
            {templates.map((template) => (
              <article className="mini-card" key={template.id}>
                <h4>{template.name}</h4>

                {template.description && <p>{template.description}</p>}

                <p>{template.exercises.length} exercices planifiés</p>

                <ul className="template-summary">
                  {template.exercises.slice(0, 4).map((item) => (
                    <li key={item.id}>
                      {item.position}. {item.exercise.name} · {item.targetSets}×
                      {formatTemplateTarget(item)} · {modeLabels[item.executionMode]}
                    </li>
                  ))}
                </ul>

                <div className="template-card-actions">
                  <button className="primary" onClick={() => launch(template)}>
                    Lancer
                  </button>
                  <button type="button" onClick={() => setEditingTemplate(template)}>
                    Modifier
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => deleteTemplate(template)}
                  >
                    Supprimer
                  </button>
                </div>
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
