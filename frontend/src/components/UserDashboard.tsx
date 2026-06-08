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
import { PhysicalTrackingDashboard, type PhysicalTab } from "./PhysicalTrackingDashboard";
import { NutritionDashboard, type NutritionTab } from "./NutritionDashboard";

type DashboardTab = "sessions" | "history" | "exercises" | "programs" | "physical";
type DashboardDomain = "gym" | "physical" | "nutrition";

function formatTemplateTarget(item: WorkoutTemplate["exercises"][number]) {
  if (item.targetDurationSec) {
    const isCardio = item.exercise.trackingType === "CARDIO";
    return isCardio
      ? `${Math.round(item.targetDurationSec / 60)} min`
      : `${item.targetDurationSec}s`;
  }

  return `${item.targetReps ?? "?"} reps`;
}

function estimateTemplateDuration(template: WorkoutTemplate) {
  const exerciseMinutes = template.exercises.reduce((total, item) => {
    if (item.targetDurationSec) return total + Math.ceil(item.targetDurationSec / 60);
    return total + item.targetSets * 3;
  }, 0);

  if (!exerciseMinutes) return null;
  const rounded = Math.max(10, Math.round(exerciseMinutes / 5) * 5);
  return `~${rounded} min`;
}

function getCompletedAt(session: WorkoutSession) {
  return session.completedAt ?? session.createdAt ?? session.scheduledAt ?? null;
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
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
  const [launchingTemplateId, setLaunchingTemplateId] = useState<string | null>(null);
  const [activeDomain, setActiveDomain] = useState<DashboardDomain>("gym");
  const [activeTab, setActiveTab] = useState<DashboardTab>("sessions");
  const [activePhysicalTab, setActivePhysicalTab] = useState<PhysicalTab>("dashboard");
  const [activeNutritionTab, setActiveNutritionTab] = useState<NutritionTab>("dashboard");
  const [selectedHistorySession, setSelectedHistorySession] = useState<WorkoutSession | null>(null);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const [expandedTemplateIds, setExpandedTemplateIds] = useState<string[]>([]);

  const active = sessions.find((s) => s.status === "IN_PROGRESS");
  const completedSessions = useMemo(
    () => sessions.filter((session) => session.status === "COMPLETED"),
    [sessions],
  );
  const recentCompletedSessions = completedSessions.slice(0, 3);

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

  function openGymTab(tab: Exclude<DashboardTab, "physical">) {
    setActiveDomain("gym");
    setActiveTab(tab);
  }

  function openPhysical() {
    setActiveDomain("physical");
    setActiveTab("physical");
  }

  function openNutrition(tab: NutritionTab = "dashboard") {
    setActiveDomain("nutrition");
    setActiveNutritionTab(tab);
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
    const confirmed = confirm(`Supprimer la séance "${session.title}" de l'historique ?`);
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

  function toggleTemplateDetails(templateId: string) {
    setExpandedTemplateIds((ids) =>
      ids.includes(templateId)
        ? ids.filter((id) => id !== templateId)
        : [...ids, templateId],
    );
  }

  function toggleTemplateSelection(templateId: string) {
    setSelectedTemplateIds((ids) =>
      ids.includes(templateId)
        ? ids.filter((id) => id !== templateId)
        : [...ids, templateId],
    );
  }

  function exportSelectedTemplates() {
    const selectedTemplates = templates.filter((template) => selectedTemplateIds.includes(template.id));

    if (!selectedTemplates.length) {
      alert("Sélectionne au moins un programme à exporter.");
      return;
    }

    downloadJsonFile("gym-tracker-programmes.json", {
      program: selectedTemplates.map(templateToImportProgram),
    });
  }

  const renderTemplateCard = (template: WorkoutTemplate) => {
    const isExpanded = expandedTemplateIds.includes(template.id);
    const duration = estimateTemplateDuration(template);

    return (
      <article className="mini-card workout-template-card compact-template-card" key={template.id}>
        <div className="compact-template-main">
          <div>
            <h4>{template.name}</h4>
            <p>
              {template.exercises.length} exos
              {duration ? ` · ${duration}` : ""}
            </p>
            {template.description && <small>{template.description}</small>}
          </div>
          <button
            className="primary compact-launch-button"
            onClick={() => launch(template)}
            disabled={Boolean(launchingTemplateId)}
          >
            {launchingTemplateId === template.id ? "..." : "Lancer"}
          </button>
        </div>

        {isExpanded && (
          <ul className="template-summary compact-template-summary">
            {template.exercises.map((item) => (
              <li key={item.id}>
                {item.position}. {item.exercise.name} · {item.targetSets}×
                {formatTemplateTarget(item)} · {modeLabels[item.executionMode]}
              </li>
            ))}
          </ul>
        )}

        <div className="template-card-actions compact-template-actions">
          <button type="button" onClick={() => toggleTemplateDetails(template.id)}>
            {isExpanded ? "Masquer" : "Détails"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingTemplate(template);
              openGymTab("programs");
            }}
          >
            Modifier
          </button>
        </div>
      </article>
    );
  };

  return (
    <main className="layout simplified-dashboard app-dashboard-v2">
      {active && (
        <section className="active-session-banner compact-active-session">
          <div>
            <span className="pill">Séance en cours</span>
            <h3>{active.title}</h3>
          </div>
          <div className="template-card-actions">
            <button className="primary" onClick={() => setFocusMode(true)}>
              Reprendre
            </button>
            <button type="button" className="danger" onClick={cancelActiveSession}>
              Annuler
            </button>
          </div>
        </section>
      )}

      <nav className="domain-switch card" aria-label="Domaine">
        <button
          type="button"
          className={activeDomain === "gym" ? "active" : ""}
          onClick={() => openGymTab("sessions")}
        >
          Gym
        </button>
        <button
          type="button"
          className={activeDomain === "physical" ? "active" : ""}
          onClick={openPhysical}
        >
          Physique
        </button>
        <button
          type="button"
          className={activeDomain === "nutrition" ? "active" : ""}
          onClick={() => openNutrition()}
        >
          Nutrition
        </button>
      </nav>

      {activeDomain === "gym" && activeTab === "sessions" && (
        <section className="card sessions-home-card">
          <div className="section-title compact-section-title">
            <div>
              <span className="pill">Aujourd'hui</span>
              <h3>Quel entraînement ?</h3>
              <p>Lance vite ta séance, les détails restent masqués pour gagner de la place.</p>
            </div>
          </div>

          {progress && (
            <div className="session-micro-stats">
              <span>{progress.totalSessions} séances</span>
              <span>{progress.totalSets} séries</span>
              <span>{Math.round(progress.totalVolumeKg)} kg</span>
            </div>
          )}

          <div className="cards compact-session-list">
            {templates.map(renderTemplateCard)}
            {templates.length === 0 && <p>Aucun entraînement enregistré pour le moment.</p>}
          </div>

          {recentCompletedSessions.length > 0 && (
            <div className="recent-sessions-strip">
              <h4>Récent</h4>
              {recentCompletedSessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => {
                    setSelectedHistorySession(session);
                    openGymTab("history");
                  }}
                >
                  <b>{session.title}</b>
                  <span>{formatSessionDate(getCompletedAt(session))}</span>
                </button>
              ))}
            </div>
          )}

          <button type="button" className="manage-programs-button" onClick={() => openGymTab("programs")}>
            Gérer les programmes
          </button>
        </section>
      )}

      {activeDomain === "gym" && activeTab === "history" && (
        <>
          <StatsDashboard sessions={sessions} exercises={exercises} mode="history" />

          {selectedHistorySession && (
            <WorkoutSessionDetail
              session={selectedHistorySession}
              onClose={() => setSelectedHistorySession(null)}
              onSelectExercise={() => {
                setSelectedHistorySession(null);
                openGymTab("exercises");
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
                      {formatSessionDate(getCompletedAt(session))} · {session.exercises.length} exercices
                    </span>
                  </button>
                  <button type="button" className="danger" onClick={() => deleteSession(session)}>
                    Supprimer
                  </button>
                </div>
              ))}
              {completedSessions.length === 0 && <p>Aucune séance terminée pour le moment.</p>}
            </div>
          </section>
        </>
      )}

      {activeDomain === "gym" && activeTab === "exercises" && (
        <StatsDashboard sessions={sessions} exercises={exercises} mode="exercises" />
      )}

      {activeDomain === "gym" && activeTab === "programs" && (
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
                  <button type="button" onClick={() => setSelectedTemplateIds(templates.map((template) => template.id))}>
                    Tout sélectionner
                  </button>
                  <button type="button" onClick={() => setSelectedTemplateIds([])} disabled={!selectedTemplateIds.length}>
                    Vider
                  </button>
                  <button type="button" className="primary" onClick={exportSelectedTemplates} disabled={!selectedTemplateIds.length}>
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
                      <button type="button" onClick={() => setEditingTemplate(template)}>
                        Modifier
                      </button>
                      <button type="button" className="danger" onClick={() => deleteTemplate(template)}>
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

      {activeDomain === "physical" && (
        <PhysicalTrackingDashboard
          activePhysicalTab={activePhysicalTab}
          setActivePhysicalTab={setActivePhysicalTab}
        />
      )}

      {activeDomain === "nutrition" && (
        <NutritionDashboard activeNutritionTab={activeNutritionTab} />
      )}

      <nav className={`dashboard-tabs card gym-footer-tabs ${activeDomain === "nutrition" ? "nutrition-footer-tabs" : ""}`} aria-label="Navigation principale">
        {activeDomain === "gym" && (
          <>
            <TabButton active={activeTab === "sessions"} onClick={() => openGymTab("sessions")}>
              Séances
            </TabButton>
            <TabButton active={activeTab === "history"} onClick={() => openGymTab("history")}>
              Historique
            </TabButton>
            <TabButton active={activeTab === "exercises"} onClick={() => openGymTab("exercises")}>
              Exercices
            </TabButton>
            <TabButton active={activeTab === "programs"} onClick={() => openGymTab("programs")}>
              Programmes
            </TabButton>
          </>
        )}
        {activeDomain === "physical" && (
          <>
            <TabButton active={activePhysicalTab === "dashboard"} onClick={() => setActivePhysicalTab("dashboard")}>
              Dashboard
            </TabButton>
            <TabButton active={activePhysicalTab === "evolutions"} onClick={() => setActivePhysicalTab("evolutions")}>
              Évolutions
            </TabButton>
            <TabButton active={activePhysicalTab === "goals"} onClick={() => setActivePhysicalTab("goals")}>
              Objectifs
            </TabButton>
            <TabButton active={activePhysicalTab === "history"} onClick={() => setActivePhysicalTab("history")}>
              Historique
            </TabButton>
          </>
        )}
        {activeDomain === "nutrition" && (
          <>
            <TabButton active={activeNutritionTab === "dashboard"} onClick={() => setActiveNutritionTab("dashboard")}>
              Dashboard
            </TabButton>
            <TabButton active={activeNutritionTab === "history"} onClick={() => setActiveNutritionTab("history")}>
              Historique
            </TabButton>
          </>
        )}
      </nav>
    </main>
  );
}
