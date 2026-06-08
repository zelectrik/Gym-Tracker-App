import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import type {
  Exercise,
  Progress,
  User,
  WorkoutSession,
  WorkoutTemplate,
  WorkoutSchedule,
  WorkoutSchedulePayload,
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

function daysSince(value?: string | null) {
  if (!value) return null;
  const diffMs = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return null;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function formatLastDone(value?: string | null) {
  const days = daysSince(value);
  if (days === null) return "Jamais réalisée";
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  return `Il y a ${days} jours`;
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


type ScheduleEditorDay = {
  id: string;
  templateId: string;
  isRest: boolean;
  label: string;
};

function todayLocalDate() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

function toLocalDateInput(value?: string | null) {
  if (!value) return todayLocalDate();
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

function getScheduleDayIndex(startsAt?: string | null, cycleLength = 0) {
  if (!startsAt || cycleLength <= 0) return null;
  const start = new Date(`${toLocalDateInput(startsAt)}T12:00:00`);
  const today = new Date(`${todayLocalDate()}T12:00:00`);
  const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return ((diffDays % cycleLength) + cycleLength) % cycleLength + 1;
}

function scheduleToEditor(schedule: WorkoutSchedule | null): ScheduleEditorDay[] {
  if (!schedule?.days.length) return [];
  return schedule.days
    .slice()
    .sort((a, b) => a.dayIndex - b.dayIndex)
    .map((day) => ({
      id: day.id,
      templateId: day.templateId ?? "",
      isRest: day.isRest || !day.templateId,
      label: day.label ?? "",
    }));
}

function buildSchedulePayload(startsAt: string, days: ScheduleEditorDay[]): WorkoutSchedulePayload {
  return {
    startsAt,
    days: days.map((day, index) => ({
      dayIndex: index + 1,
      templateId: day.isRest ? null : day.templateId,
      isRest: day.isRest,
      label: day.label.trim() || undefined,
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
  const [workoutSchedule, setWorkoutSchedule] = useState<WorkoutSchedule | null>(null);
  const [scheduleStartsAt, setScheduleStartsAt] = useState(todayLocalDate());
  const [scheduleEditorDays, setScheduleEditorDays] = useState<ScheduleEditorDay[]>([]);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState("");
  const [scheduleError, setScheduleError] = useState("");

  const active = sessions.find((s) => s.status === "IN_PROGRESS");
  const completedSessions = useMemo(
    () => sessions.filter((session) => session.status === "COMPLETED"),
    [sessions],
  );
  const recentCompletedSessions = completedSessions.slice(0, 3);

  async function refresh() {
    const [ex, tpl, ses, prog, scheduleResult] = await Promise.all([
      api.exercises(),
      api.templates(),
      api.sessions(),
      api.progress(),
      api.workoutSchedule().catch(() => null),
    ]);

    setExercises(ex);
    setTemplates(tpl);
    setSessions(ses);
    setProgress(prog);

    if (scheduleResult) {
      setWorkoutSchedule(scheduleResult);
      setScheduleStartsAt(toLocalDateInput(scheduleResult.startsAt));
      setScheduleEditorDays(scheduleToEditor(scheduleResult));
      setScheduleError("");
    }
  }

  useEffect(() => {
    refresh();
  }, []);


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

  const activeScheduleDayIndex = useMemo(
    () => getScheduleDayIndex(workoutSchedule?.startsAt, workoutSchedule?.days.length ?? 0),
    [workoutSchedule],
  );

  const activeScheduleDay = useMemo(() => {
    if (!workoutSchedule?.days.length || activeScheduleDayIndex === null) return null;
    return workoutSchedule.days.find((day) => day.dayIndex === activeScheduleDayIndex) ?? null;
  }, [activeScheduleDayIndex, workoutSchedule]);

  const recommendedTemplate = useMemo(() => {
    if (!templates.length) return null;
    if (activeScheduleDay?.templateId && !activeScheduleDay.isRest) {
      return templates.find((template) => template.id === activeScheduleDay.templateId) ?? activeScheduleDay.template ?? templates[0];
    }
    if (workoutSchedule?.days.length && activeScheduleDay?.isRest) return null;
    return templates[0];
  }, [activeScheduleDay, templates, workoutSchedule]);

  const recommendedLastDone = useMemo(() => {
    if (!recommendedTemplate) return null;
    return completedSessions.find((session) => session.templateId === recommendedTemplate.id || session.title === recommendedTemplate.name);
  }, [completedSessions, recommendedTemplate]);

  const scheduleHeroLabel = workoutSchedule?.days.length
    ? activeScheduleDay?.isRest
      ? `J${activeScheduleDay.dayIndex} · Repos`
      : activeScheduleDay
        ? `J${activeScheduleDay.dayIndex} / ${workoutSchedule.days.length}`
        : "Cycle défini"
    : "Aucun cycle défini";

  function addScheduleDay() {
    setScheduleEditorDays((days) => [
      ...days,
      { id: `new-${Date.now()}`, templateId: templates[0]?.id ?? "", isRest: templates.length === 0, label: "" },
    ]);
  }

  function updateScheduleDay(index: number, patch: Partial<ScheduleEditorDay>) {
    setScheduleEditorDays((days) =>
      days.map((day, dayIndex) => (dayIndex === index ? { ...day, ...patch } : day)),
    );
  }

  function removeScheduleDay(index: number) {
    setScheduleEditorDays((days) => days.filter((_, dayIndex) => dayIndex !== index));
  }

  function createPresetCycle(type: "ppl7" | "ppl4") {
    const findTemplate = (keyword: string) =>
      templates.find((template) => template.name.toLowerCase().includes(keyword))?.id ?? "";

    const pushId = findTemplate("push");
    const pullId = findTemplate("pull");
    const legId = findTemplate("leg") || findTemplate("jamb");

    const base = type === "ppl7"
      ? [
          { label: "PUSH", templateId: pushId },
          { label: "PULL", templateId: pullId },
          { label: "LEGS", templateId: legId },
          { label: "PUSH", templateId: pushId },
          { label: "PULL", templateId: pullId },
          { label: "REPOS", templateId: "", isRest: true },
          { label: "REPOS", templateId: "", isRest: true },
        ]
      : [
          { label: "PUSH", templateId: pushId },
          { label: "PULL", templateId: pullId },
          { label: "LEGS", templateId: legId },
          { label: "REPOS", templateId: "", isRest: true },
        ];

    setScheduleEditorDays(
      base.map((day, index) => ({
        id: `preset-${type}-${index}`,
        templateId: day.templateId,
        isRest: Boolean(day.isRest || !day.templateId),
        label: day.label,
      })),
    );
    setScheduleMessage("Modèle chargé. Vérifie les programmes puis enregistre.");
  }

  async function saveSchedule() {
    if (!scheduleEditorDays.length) {
      setScheduleError("Ajoute au moins un jour au cycle.");
      return;
    }

    const invalidDay = scheduleEditorDays.find((day) => !day.isRest && !day.templateId);
    if (invalidDay) {
      setScheduleError("Chaque jour d'entraînement doit avoir un programme.");
      return;
    }

    setScheduleSaving(true);
    setScheduleError("");
    setScheduleMessage("");

    try {
      const saved = await api.saveWorkoutSchedule(buildSchedulePayload(scheduleStartsAt, scheduleEditorDays));
      setWorkoutSchedule(saved);
      setScheduleStartsAt(toLocalDateInput(saved.startsAt));
      setScheduleEditorDays(scheduleToEditor(saved));
      setScheduleMessage("Cycle enregistré.");
    } catch (err) {
      setScheduleError(err instanceof Error ? err.message : "Cycle impossible à enregistrer.");
    } finally {
      setScheduleSaving(false);
    }
  }

  async function clearSchedule() {
    const confirmed = confirm("Supprimer le cycle d'entraînement ?");
    if (!confirmed) return;

    setScheduleSaving(true);
    setScheduleError("");
    setScheduleMessage("");

    try {
      await api.clearWorkoutSchedule();
      setWorkoutSchedule({ startsAt: null, days: [] });
      setScheduleEditorDays([]);
      setScheduleMessage("Cycle supprimé. L'app utilisera le premier programme.");
    } catch (err) {
      setScheduleError(err instanceof Error ? err.message : "Suppression impossible.");
    } finally {
      setScheduleSaving(false);
    }
  }

  const renderTemplateCard = (template: WorkoutTemplate) => {
    const isExpanded = expandedTemplateIds.includes(template.id);
    const duration = estimateTemplateDuration(template);

    return (
      <article className="mini-card workout-template-card daily-template-card" key={template.id}>
        <div className="daily-template-main">
          <div>
            <h4>{template.name}</h4>
            <p>
              {template.exercises.length} exos
              {duration ? ` · ${duration}` : ""}
            </p>
          </div>
          <div className="template-quick-actions">
            <button
              className="primary compact-launch-button"
              onClick={() => launch(template)}
              disabled={Boolean(launchingTemplateId)}
            >
              {launchingTemplateId === template.id ? "..." : "Lancer"}
            </button>
            <details className="context-menu">
              <summary aria-label="Actions du programme">…</summary>
              <div>
                <button type="button" onClick={() => toggleTemplateDetails(template.id)}>
                  {isExpanded ? "Masquer détails" : "Voir détails"}
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
                <button type="button" className="danger" onClick={() => deleteTemplate(template)}>
                  Supprimer
                </button>
              </div>
            </details>
          </div>
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
      </article>
    );
  };

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
        <>
          <section className="card gym-action-hero-card">
            <div className="gym-action-eyebrow">
              <span className="pill">Séance du jour</span>
              <span>{scheduleHeroLabel}</span>
            </div>

            {recommendedTemplate ? (
              <>
                <div className="gym-action-main">
                  <div>
                    <h2>{recommendedTemplate.name}</h2>
                    <p>
                      {recommendedTemplate.exercises.length} exercices
                      {estimateTemplateDuration(recommendedTemplate) ? ` · ${estimateTemplateDuration(recommendedTemplate)}` : ""}
                    </p>
                    <small>Dernière fois : {formatLastDone(recommendedLastDone ? getCompletedAt(recommendedLastDone) : null)}</small>
                  </div>
                </div>
                <button
                  className="primary hero-launch-button"
                  onClick={() => launch(recommendedTemplate)}
                  disabled={Boolean(launchingTemplateId)}
                >
                  {launchingTemplateId === recommendedTemplate.id ? "Lancement..." : "Lancer la séance"}
                </button>
              </>
            ) : activeScheduleDay?.isRest ? (
              <div className="rest-day-hero">
                <h2>Repos prévu</h2>
                <p>Ton cycle indique un jour de récupération aujourd'hui.</p>
                <button type="button" onClick={() => openGymTab("programs")}>Modifier le cycle</button>
              </div>
            ) : (
              <p>Aucun entraînement enregistré pour le moment.</p>
            )}
          </section>

          {recentCompletedSessions.length > 0 && (
            <section className="card quick-history-card">
              <div className="section-title compact-section-title">
                <div>
                  <h3>Dernières séances</h3>
                  <p>Accès rapide à tes dernières séances terminées.</p>
                </div>
              </div>
              <div className="recent-sessions-strip refined-recent-sessions">
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
                    <span>{formatLastDone(getCompletedAt(session))}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="card sessions-home-card secondary-programs-card">
            <div className="section-title compact-section-title">
              <div>
                <span className="pill">Programmes</span>
                <h3>Tous les programmes</h3>
              </div>
            </div>

            <div className="cards compact-session-list">
              {templates.map(renderTemplateCard)}
              {templates.length === 0 && <p>Aucun entraînement enregistré pour le moment.</p>}
            </div>

            <button type="button" className="manage-programs-button" onClick={() => openGymTab("programs")}>
              Gérer les programmes
            </button>
          </section>
        </>
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
            <section className="card workout-cycle-card">
              <div className="section-title compact-section-title">
                <div>
                  <span className="pill">Séance du jour</span>
                  <h3>Cycle d'entraînement</h3>
                  <p>Définis ton ordre personnalisé : J1, J2, J3... puis l'app recommence automatiquement.</p>
                </div>
              </div>

              <div className="cycle-start-row">
                <label>
                  Début du cycle
                  <input
                    type="date"
                    value={scheduleStartsAt}
                    onChange={(e) => setScheduleStartsAt(e.target.value)}
                  />
                </label>
                <div className="cycle-preset-actions">
                  <button type="button" onClick={() => createPresetCycle("ppl7")}>PPL 7 jours</button>
                  <button type="button" onClick={() => createPresetCycle("ppl4")}>PPL 4 jours</button>
                </div>
              </div>

              <div className="cycle-editor-list">
                {scheduleEditorDays.length === 0 && (
                  <p className="muted">Aucun cycle défini. L'app utilise le premier programme disponible.</p>
                )}

                {scheduleEditorDays.map((day, index) => (
                  <article key={day.id} className="cycle-day-row">
                    <div className="cycle-day-number">J{index + 1}</div>
                    <div className="cycle-day-fields">
                      <input
                        value={day.label}
                        onChange={(e) => updateScheduleDay(index, { label: e.target.value })}
                        placeholder={day.isRest ? "REPOS" : "PUSH / PULL / LEG..."}
                      />
                      <select
                        value={day.isRest ? "REST" : day.templateId}
                        onChange={(e) => {
                          const isRest = e.target.value === "REST";
                          updateScheduleDay(index, {
                            isRest,
                            templateId: isRest ? "" : e.target.value,
                            label: day.label || (isRest ? "REPOS" : ""),
                          });
                        }}
                      >
                        <option value="REST">Repos</option>
                        {templates.map((template) => (
                          <option key={template.id} value={template.id}>{template.name}</option>
                        ))}
                      </select>
                    </div>
                    <button type="button" className="cycle-remove-button" onClick={() => removeScheduleDay(index)}>×</button>
                  </article>
                ))}
              </div>

              <div className="cycle-actions">
                <button type="button" onClick={addScheduleDay}>+ Ajouter un jour</button>
                <button type="button" className="primary" onClick={saveSchedule} disabled={scheduleSaving}>
                  {scheduleSaving ? "Enregistrement..." : "Enregistrer le cycle"}
                </button>
                {scheduleEditorDays.length > 0 && (
                  <button type="button" className="danger" onClick={clearSchedule} disabled={scheduleSaving}>Supprimer</button>
                )}
              </div>

              {activeScheduleDay && workoutSchedule?.days.length ? (
                <p className="cycle-current-day">Aujourd'hui : J{activeScheduleDay.dayIndex} · {activeScheduleDay.isRest ? "Repos" : activeScheduleDay.template?.name ?? "Programme"}</p>
              ) : null}
              {scheduleMessage && <p className="success">{scheduleMessage}</p>}
              {scheduleError && <p className="error">{scheduleError}</p>}
            </section>
          )}

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
