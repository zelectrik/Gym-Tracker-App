import { useMemo, useState } from "react";
import type {
  Exercise,
  ExerciseSet,
  SessionExercise,
  WorkoutSession,
} from "../types";

function dateKey(value?: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function formatDateTime(value?: string | null) {
  if (!value) return "Date inconnue";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function completedAt(session: WorkoutSession) {
  return (
    session.completedAt ?? session.createdAt ?? session.scheduledAt ?? null
  );
}

function getSetVolume(set: ExerciseSet) {
  return (set.reps ?? 0) * (set.weightKg ?? 0);
}

function getCompletedSets(exercise: SessionExercise) {
  return exercise.sets.filter((set) => set.completed);
}

function formatCardio(exercise: SessionExercise) {
  const entry = exercise.cardioEntry;
  if (!entry) return "Cardio non renseigné";

  const parts = [
    entry.durationSec ? `${Math.round(entry.durationSec / 60)} min` : undefined,
    entry.distanceKm ? `${entry.distanceKm} km` : undefined,
    entry.speedKmh ? `${entry.speedKmh} km/h` : undefined,
    entry.inclinePercent ? `${entry.inclinePercent}%` : undefined,
  ].filter(Boolean);

  return parts.length ? parts.join(" · ") : "Cardio renseigné";
}

function StatLine({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat-line">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

type MetricPoint = {
  label: string;
  date: string;
  min: number;
  max: number;
  avg: number;
  total: number;
};

function metricStats(values: number[]) {
  const safe = values.filter((value) => Number.isFinite(value));
  if (!safe.length) return { min: 0, max: 0, avg: 0, total: 0 };
  const total = safe.reduce((sum, value) => sum + value, 0);
  return {
    min: Math.min(...safe),
    max: Math.max(...safe),
    avg: total / safe.length,
    total,
  };
}

function buildExerciseMetrics(sessions: WorkoutSession[], exerciseId: string) {
  return sessions
    .filter((session) => session.status === "COMPLETED")
    .flatMap((session) => {
      const matchingExercises = session.exercises.filter(
        (exercise) => exercise.exerciseId === exerciseId,
      );
      return matchingExercises.map((exercise) => ({ session, exercise }));
    })
    .map(({ session, exercise }) => {
      const sets = getCompletedSets(exercise);
      const reps = metricStats(
        sets.map((set) => set.reps ?? 0).filter(Boolean),
      );
      const weights = metricStats(
        sets.map((set) => set.weightKg ?? 0).filter(Boolean),
      );
      const volumes = sets.map(getSetVolume).filter(Boolean);
      const volume = volumes.reduce((sum, value) => sum + value, 0);
      const cardio = exercise.cardioEntry;
      const date = completedAt(session) ?? session.createdAt ?? "";

      return {
        sessionId: session.id,
        sessionTitle: session.title,
        date,
        reps,
        weights,
        volume,
        cardio,
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function toMetricPoints(
  data: ReturnType<typeof buildExerciseMetrics>,
  kind: "reps" | "weights" | "volume",
): MetricPoint[] {
  return data.map((item) => {
    if (kind === "volume") {
      return {
        label: item.sessionTitle,
        date: item.date,
        min: item.volume,
        max: item.volume,
        avg: item.volume,
        total: item.volume,
      };
    }

    const stats = kind === "reps" ? item.reps : item.weights;
    return {
      label: item.sessionTitle,
      date: item.date,
      min: stats.min,
      max: stats.max,
      avg: stats.avg,
      total: stats.total,
    };
  });
}

function MiniChart({
  title,
  points,
  unit,
  mode = "stats",
}: {
  title: string;
  points: MetricPoint[];
  unit: string;
  mode?: "stats" | "total";
}) {
  const width = 320;
  const height = 150;
  const padding = 24;
  const values = points.flatMap((point) =>
    mode === "total" ? [point.total] : [point.min, point.max, point.avg],
  );
  const maxValue = Math.max(...values, 1);
  const x = (index: number) =>
    points.length === 1
      ? width / 2
      : padding + (index * (width - padding * 2)) / (points.length - 1);
  const y = (value: number) =>
    height - padding - (value / maxValue) * (height - padding * 2);
  const linePath = (selector: (point: MetricPoint) => number) =>
    points
      .map(
        (point, index) =>
          `${index === 0 ? "M" : "L"}${x(index)},${y(selector(point))}`,
      )
      .join(" ");

  return (
    <article className="chart-card">
      <div className="chart-title-row">
        <h4>{title}</h4>
        <span>{points.length} séance(s)</span>
      </div>
      {points.length === 0 ? (
        <p>Aucune donnée pour cet exercice.</p>
      ) : (
        <>
          <svg
            className="mini-chart"
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={title}
          >
            <line
              x1={padding}
              y1={height - padding}
              x2={width - padding}
              y2={height - padding}
            />
            {mode === "total" ? (
              <path
                d={linePath((point) => point.total)}
                className="chart-line chart-total"
              />
            ) : (
              <>
                <path
                  d={linePath((point) => point.max)}
                  className="chart-line chart-max"
                />
                <path
                  d={linePath((point) => point.avg)}
                  className="chart-line chart-avg"
                />
                <path
                  d={linePath((point) => point.min)}
                  className="chart-line chart-min"
                />
              </>
            )}
            {points.map((point, index) => (
              <circle
                key={`${point.date}-${index}`}
                cx={x(index)}
                cy={y(mode === "total" ? point.total : point.avg)}
                r="3"
              />
            ))}
          </svg>
          <div className="chart-legend">
            {mode === "total" ? (
              <span>Total</span>
            ) : (
              <>
                <span>Min</span>
                <span>Moy</span>
                <span>Max</span>
              </>
            )}
          </div>
          <div className="chart-last-value">
            Dernier :{" "}
            {Math.round(
              (points.at(-1)?.[mode === "total" ? "total" : "avg"] ?? 0) * 10,
            ) / 10}{" "}
            {unit}
          </div>
        </>
      )}
    </article>
  );
}

function WorkoutSessionDetail({
  session,
  onClose,
  onSelectExercise,
}: {
  session: WorkoutSession;
  onClose: () => void;
  onSelectExercise: (exerciseId: string) => void;
}) {
  const completedSets = session.exercises.flatMap((exercise) =>
    getCompletedSets(exercise),
  );
  const totalVolume = completedSets.reduce(
    (sum, set) => sum + getSetVolume(set),
    0,
  );

  return (
    <section className="card session-detail-card">
      <div className="section-title">
        <div>
          <span className="pill">Détail séance</span>
          <h3>{session.title}</h3>
          <p>{formatDateTime(completedAt(session))}</p>
        </div>
        <button type="button" onClick={onClose}>
          Fermer
        </button>
      </div>

      <div className="summary-stats-grid compact-stats-grid">
        <div>
          <b>{session.exercises.length}</b>
          <span>exercices</span>
        </div>
        <div>
          <b>{completedSets.length}</b>
          <span>séries</span>
        </div>
        <div>
          <b>{Math.round(totalVolume)}</b>
          <span>kg volume</span>
        </div>
      </div>

      <div className="session-exercise-details">
        {session.exercises.map((exercise) => {
          const sets = getCompletedSets(exercise);
          return (
            <article key={exercise.id} className="session-exercise-detail">
              <div className="session-exercise-head">
                <div>
                  <strong>{exercise.exercise.name}</strong>
                  <span>
                    {exercise.exercise.trackingType === "CARDIO"
                      ? formatCardio(exercise)
                      : `${sets.length}/${exercise.sets.length} séries`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectExercise(exercise.exerciseId)}
                >
                  Voir évolution
                </button>
              </div>

              {exercise.exercise.trackingType !== "CARDIO" && (
                <div className="set-chip-list">
                  {sets.map((set) => (
                    <span key={set.id}>
                      S{set.setNumber} {set.side !== "BOTH" ? set.side : ""} ·{" "}
                      {set.reps ?? "?"} reps · {set.weightKg ?? 0} kg
                    </span>
                  ))}
                  {sets.length === 0 && <span>Aucune série validée</span>}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function getLast30Days() {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let index = 29; index >= 0; index -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - index);
    days.push(day);
  }

  return days;
}

function ExerciseProgressPanel({
  sessions,
  exercises,
  selectedExerciseId,
  onSelectExercise,
}: {
  sessions: WorkoutSession[];
  exercises: Exercise[];
  selectedExerciseId: string;
  onSelectExercise: (id: string) => void;
}) {
  const metrics = useMemo(
    () => buildExerciseMetrics(sessions, selectedExerciseId),
    [sessions, selectedExerciseId],
  );
  const selectedExercise = exercises.find(
    (exercise) => exercise.id === selectedExerciseId,
  );
  const repsPoints = toMetricPoints(metrics, "reps");
  const weightPoints = toMetricPoints(metrics, "weights");
  const volumePoints = toMetricPoints(metrics, "volume");
  const isCardio = selectedExercise?.trackingType === "CARDIO";

  return (
    <section className="card exercise-progress-panel">
      <div className="section-title">
        <div>
          <span className="pill">Évolution exercice</span>
          <h3>{selectedExercise?.name ?? "Choisis un exercice"}</h3>
          <p>Filtre un exercice pour suivre ses perfs séance après séance.</p>
        </div>
        <label className="exercise-filter">
          Exercice
          <select
            value={selectedExerciseId}
            onChange={(event) => onSelectExercise(event.target.value)}
          >
            {exercises.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isCardio ? (
        <div className="cardio-history-list">
          {metrics.map((item) => (
            <article
              key={`${item.sessionId}-${item.date}`}
              className="cardio-history-item"
            >
              <strong>{formatDateTime(item.date)}</strong>
              <span>{item.sessionTitle}</span>
              <b>
                {formatCardio({ cardioEntry: item.cardio } as SessionExercise)}
              </b>
            </article>
          ))}
          {metrics.length === 0 && <p>Aucune donnée cardio.</p>}
        </div>
      ) : (
        <div className="chart-grid">
          <MiniChart title="Répétitions" points={repsPoints} unit="reps" />
          <MiniChart title="Poids" points={weightPoints} unit="kg" />
          <MiniChart
            title="Volume soulevé"
            points={volumePoints}
            unit="kg"
            mode="total"
          />
        </div>
      )}
    </section>
  );
}

export function StatsDashboard({
  sessions,
  exercises,
  mode = "all",
}: {
  sessions: WorkoutSession[];
  exercises: Exercise[];
  mode?: "all" | "history" | "exercises";
}) {
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(
    null,
  );
  const completedSessions = useMemo(
    () => sessions.filter((session) => session.status === "COMPLETED"),
    [sessions],
  );
  const exerciseOptions = useMemo(() => {
    const ids = new Set(
      completedSessions.flatMap((session) =>
        session.exercises.map((exercise) => exercise.exerciseId),
      ),
    );
    return exercises.filter((exercise) => ids.has(exercise.id));
  }, [completedSessions, exercises]);
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const activeExerciseId = selectedExerciseId || exerciseOptions[0]?.id || "";

  const sessionsByDay = useMemo(() => {
    const groups = new Map<string, WorkoutSession[]>();
    completedSessions.forEach((session) => {
      const key = dateKey(completedAt(session));
      if (!key) return;
      groups.set(key, [...(groups.get(key) ?? []), session]);
    });
    return groups;
  }, [completedSessions]);

  function handleSelectExercise(exerciseId: string) {
    setSelectedExerciseId(exerciseId);
  }

  return (
    <section className="stats-dashboard-stack">
      {mode !== "exercises" && (
        <section className="card workout-calendar-card">
          <div className="section-title">
            <div>
              <span className="pill">Calendrier</span>
              <h3>Calendrier du dernier mois</h3>
              <p>Chaque carte ouvre le détail de la séance.</p>
            </div>
          </div>

          <div className="workout-calendar-grid">
            {getLast30Days().map((day) => {
              const key = dateKey(day.toISOString());
              const daySessions = sessionsByDay.get(key) ?? [];
              return (
                <article
                  key={key}
                  className={`calendar-day-card ${daySessions.length ? "has-session" : "empty"}`}
                >
                  <header>
                    <strong>{formatShortDate(day)}</strong>
                    <span>
                      {daySessions.length
                        ? `${daySessions.length} séance(s)`
                        : "Repos"}
                    </span>
                  </header>
                  <div className="calendar-session-list">
                    {daySessions.map((session) => (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => setSelectedSession(session)}
                      >
                        <b>{session.title}</b>
                        <span>{session.exercises.length} exercices</span>
                      </button>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {selectedSession && mode !== "exercises" && (
        <WorkoutSessionDetail
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onSelectExercise={(exerciseId) => {
            handleSelectExercise(exerciseId);
            setSelectedSession(null);
          }}
        />
      )}

      {activeExerciseId && mode !== "history" && (
        <ExerciseProgressPanel
          sessions={completedSessions}
          exercises={exerciseOptions}
          selectedExerciseId={activeExerciseId}
          onSelectExercise={handleSelectExercise}
        />
      )}
    </section>
  );
}
