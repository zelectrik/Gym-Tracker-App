import { useEffect, useMemo, useState } from "react";
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
import { StatsDashboard, WorkoutSessionDetail } from "./StatsDashboard";

type DashboardTab = "sessions" | "history" | "exercises" | "programs";

function formatTemplateTarget(item: WorkoutTemplate["exercises"][number]) {
  if (item.targetDurationSec) {
    const isCardio = item.exercise.trackingType === "CARDIO";
    return isCardio
      ? `${Math.round(item.targetDurationSec / 60)} min`
      : `${item.targetDurationSec}s`;
  }

  return `${item.targetReps ?? "?"} reps`;
}

function getCompletedAt(session: WorkoutSession) {
  return (
    session.completedAt ?? session.createdAt ?? session.scheduledAt ?? null
  );
}

function formatSessionDate(value?: string | null) {
  if (!value) return "Date inconnue";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button type="button" className={active ? "active" : ""} onClick={onClick}>
      {children}
    </button>
  );
}

function downloadJsonFile(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function templateToImportProgram(template: WorkoutTemplate) {
  return {
    name: template.name,
    type: template.description ?? undefined,
    exercises: template.exercises
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((item) => ({
        exerciseName: item.exercise.name,
        reference: item.exercise.name,
        category: item.exercise.type,
        sets: item.targetSets,
        ...(item.targetDurationSec
          ? { durationSeconds: item.targetDurationSec }
          : { reps: item.targetReps ?? 10 }),
        ...(item.executionMode === "LEFT_RIGHT" ? { unilateral: true } : {}),
        muscles: item.exercise.muscles ?? [],
      })),
  };
}

export function UserDashboard({ user }: { user: User }) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [focusMode, setFocusMode] = useState(true);
  const [editingTemplate, setEditingTemplate] =
    useState<WorkoutTemplate | null>(null);
  const [launchingTemplateId, setLaunchingTemplateId] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<DashboardTab>("sessions");
  const [selectedHistorySession, setSelectedHistorySession] =
    useState<WorkoutSession | null>(null);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);

  const active = sessions.find((s) => s.status === "IN_PROGRESS");
  const completedSessions = useMemo(
    () => sessions.filter((session) => session.status === "COMPLETED"),
    [sessions],
  );

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
        exercises={exercises}
        onRefresh={refresh}
        onExitFocus={() => setFocusMode(false)}
      />
    );
  }

  async function launch(template: WorkoutTemplate) {
    if (launchingTemplateId) return;

    setLaunchingTemplateId(template.id);
    try {
      const created = await api.createSession({
        title: template.name,
        templateId: template.id,
      });

      await api.updateSessionStatus(created.id, "IN_PROGRESS");
      setFocusMode(true);
      await refresh();
    } finally {
      setLaunchingTemplateId(null);
    }
  }

  async function cancelActiveSession() {
    if (!active) return;

    const confirmed = confirm(`Annuler la séance en cours "${active.title}" ?`);
    if (!confirmed) return;

    await api.updateSessionStatus(active.id, "CANCELLED");
    setFocusMode(false);
    await refresh();
  }

  async function deleteSession(session: WorkoutSession) {
    const confirmed = confirm(
      `Supprimer la séance "${session.title}" de l'historique ?`,
    );
    if (!confirmed) return;

    await api.deleteSession(session.id);
    await refresh();
  }

  async function deleteTemplate(template: WorkoutTemplate) {
    const confirmed = confirm(`Supprimer l'entraînement "${template.name}" ?`);
    if (!confirmed) return;

    await api.deleteTemplate(template.id);
    if (editingTemplate?.id === template.id) setEditingTemplate(null);
    setSelectedTemplateIds((ids) => ids.filter((id) => id !== template.id));
    await refresh();
  }

  function toggleTemplateSelection(templateId: string) {
    setSelectedTemplateIds((ids) =>
      ids.includes(templateId)
        ? ids.filter((id) => id !== templateId)
        : [...ids, templateId],
    );
  }

  function exportSelectedTemplates() {
    const selectedTemplates = templates.filter((template) =>
      selectedTemplateIds.includes(template.id),
    );

    if (!selectedTemplates.length) {
      alert("Sélectionne au moins un programme à exporter.");
      return;
    }

    downloadJsonFile("gym-tracker-programmes.json", {
      program: selectedTemplates.map(templateToImportProgram),
    });
  }

  const renderTemplateCard = (template: WorkoutTemplate) => (
    <article className="mini-card workout-template-card" key={template.id}>
      <div>
        <h4>{template.name}</h4>
        {template.description && <p>{template.description}</p>}
        <p>{template.exercises.length} exercices planifiés</p>
      </div>

      <ul className="template-summary">
        {template.exercises.slice(0, 4).map((item) => (
          <li key={item.id}>
            {item.position}. {item.exercise.name} · {item.targetSets}×
            {formatTemplateTarget(item)} · {modeLabels[item.executionMode]}
          </li>
        ))}
      </ul>

      <div className="template-card-actions">
        <button
          className="primary"
          onClick={() => launch(template)}
          disabled={Boolean(launchingTemplateId)}
        >
          {launchingTemplateId === template.id ? "Lancement..." : "Lancer"}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditingTemplate(template);
            setActiveTab("programs");
          }}
        >
          Modifier
        </button>
      </div>
    </article>
  );

  return (
    <main className="layout simplified-dashboard">
      <section className="card dashboard-head dashboard-home-card">
        {active && (
          <section className="active-session-banner">
            <div>
              <span className="pill">Séance en cours</span>
              <h3>{active.title}</h3>
            </div>
            <div className="template-card-actions">
              <button className="primary" onClick={() => setFocusMode(true)}>
                Reprendre
              </button>
              <button
                type="button"
                className="danger"
                onClick={cancelActiveSession}
              >
                Annuler
              </button>
            </div>
          </section>
        )}

        <div>
          <span className="pill">Gym Tracker</span>
          <h2>Bonjour {user.displayName}</h2>
          <p>
            Lance ta séance, consulte ton historique ou ajuste tes programmes.
          </p>
        </div>

        {progress && (
          <div className="stats dashboard-quick-stats">
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
              <span>kg volume</span>
            </div>
          </div>
        )}
      </section>

      <nav className="dashboard-tabs card" aria-label="Navigation dashboard">
        <TabButton
          active={activeTab === "sessions"}
          onClick={() => setActiveTab("sessions")}
        >
          Séances
        </TabButton>
        <TabButton
          active={activeTab === "history"}
          onClick={() => setActiveTab("history")}
        >
          Historique
        </TabButton>
        <TabButton
          active={activeTab === "exercises"}
          onClick={() => setActiveTab("exercises")}
        >
          Exercices
        </TabButton>
        <TabButton
          active={activeTab === "programs"}
          onClick={() => setActiveTab("programs")}
        >
          Programmes
        </TabButton>
      </nav>

      {activeTab === "sessions" && (
        <section className="card">
          <div className="section-title">
            <div>
              <span className="pill">Séances</span>
              <h3>Lancer un entraînement</h3>
              <p>
                Dashboard volontairement simple : tu choisis un programme et tu
                lances.
              </p>
            </div>
            <button type="button" onClick={() => setActiveTab("programs")}>
              Gérer les programmes
            </button>
          </div>

          <div className="cards">
            {templates.map(renderTemplateCard)}
            {templates.length === 0 && (
              <p>Aucun entraînement enregistré pour le moment.</p>
            )}
          </div>
        </section>
      )}

      {activeTab === "history" && (
        <>
          <StatsDashboard
            sessions={sessions}
            exercises={exercises}
            mode="history"
          />

          {selectedHistorySession && (
            <WorkoutSessionDetail
              session={selectedHistorySession}
              onClose={() => setSelectedHistorySession(null)}
              onSelectExercise={() => {
                setSelectedHistorySession(null);
                setActiveTab("exercises");
              }}
            />
          )}

          <section className="card">
            <h3>Historique complet</h3>
            <div className="history clean-history-list">
              {completedSessions.map((session) => (
                <div key={session.id} className="history-row-with-actions">
                  <button
                    type="button"
                    className="history-session-open"
                    onClick={() => setSelectedHistorySession(session)}
                  >
                    <b>{session.title}</b>
                    <span>
                      {formatSessionDate(getCompletedAt(session))} ·{" "}
                      {session.exercises.length} exercices
                    </span>
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => deleteSession(session)}
                  >
                    Supprimer
                  </button>
                </div>
              ))}
              {completedSessions.length === 0 && (
                <p>Aucune séance terminée pour le moment.</p>
              )}
            </div>
          </section>
        </>
      )}

      {activeTab === "exercises" && (
        <StatsDashboard
          sessions={sessions}
          exercises={exercises}
          mode="exercises"
        />
      )}

      {activeTab === "programs" && (
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

          {!editingTemplate && (
            <section className="card">
              <div className="section-title">
                <div>
                  <h3>Programmes enregistrés</h3>
                  <p>Sélectionne un ou plusieurs programmes pour les exporter au format JSON réimportable.</p>
                </div>
                <div className="template-card-actions">
                  <button
                    type="button"
                    onClick={() => setSelectedTemplateIds(templates.map((template) => template.id))}
                  >
                    Tout sélectionner
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTemplateIds([])}
                    disabled={!selectedTemplateIds.length}
                  >
                    Vider
                  </button>
                  <button
                    type="button"
                    className="primary"
                    onClick={exportSelectedTemplates}
                    disabled={!selectedTemplateIds.length}
                  >
                    Exporter JSON
                  </button>
                </div>
              </div>
              <div className="cards">
                {templates.map((template) => (
                  <article className="mini-card exportable-template-card" key={template.id}>
                    <label className="template-export-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedTemplateIds.includes(template.id)}
                        onChange={() => toggleTemplateSelection(template.id)}
                      />
                      Exporter
                    </label>
                    <h4>{template.name}</h4>
                    {template.description && <p>{template.description}</p>}
                    <p>{template.exercises.length} exercices planifiés</p>
                    <div className="template-card-actions">
                      <button
                        type="button"
                        onClick={() => setEditingTemplate(template)}
                      >
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
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
