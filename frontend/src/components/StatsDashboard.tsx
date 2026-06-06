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

type ChartKind = "reps" | "weight" | "volume";

function getChartTicks(maxValue: number, kind: ChartKind) {
  if (!Number.isFinite(maxValue) || maxValue <= 0) return [0, 1];

  if (kind === "reps") {
    const roundedMax = Math.max(1, Math.ceil(maxValue));
    return Array.from({ length: roundedMax + 1 }, (_, index) => index);
  }

  if (kind === "weight") {
    const step = Math.max(1, Math.ceil((maxValue * 0.05) / 2.5) * 2.5);
    const roundedMax = Math.ceil(maxValue / step) * step;
    const ticks: number[] = [];
    for (let value = 0; value <= roundedMax + step / 2; value += step) {
      ticks.push(Math.round(value * 10) / 10);
    }
    return ticks.length >= 2 ? ticks : [0, roundedMax || step];
  }

  const roughStep = Math.max(1, maxValue / 5);
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  const step = niceNormalized * magnitude;
  const roundedMax = Math.ceil(maxValue / step) * step;
  const ticks: number[] = [];
  for (let value = 0; value <= roundedMax + step / 2; value += step) {
    ticks.push(Math.round(value));
  }
  return ticks.length >= 2 ? ticks : [0, Math.ceil(maxValue)];
}

function formatTickValue(value: number, unit: string, kind: ChartKind) {
  if (kind === "volume" && value >= 1000) return `${Math.round(value / 100) / 10}k ${unit}`;
  if (kind === "weight") return `${Math.round(value * 10) / 10} ${unit}`;
  return `${Math.round(value)} ${unit}`;
}

function formatCompactValue(value: number, unit: string, kind: ChartKind) {
  const rounded = kind === "weight" ? Math.round(value * 10) / 10 : Math.round(value);
  return `${rounded} ${unit}`;
}

function getChartSummary(points: MetricPoint[], mode: "stats" | "total") {
  const first = points[0]?.[mode === "total" ? "total" : "avg"] ?? 0;
  const last = points.at(-1)?.[mode === "total" ? "total" : "avg"] ?? 0;
  const delta = last - first;

  return { first, last, delta };
}

function MiniChart({
  title,
  points,
  unit,
  kind,
  mode = "stats",
}: {
  title: string;
  points: MetricPoint[];
  unit: string;
  kind: ChartKind;
  mode?: "stats" | "total";
}) {
  const width = 360;
  const height = 220;
  const paddingLeft = 58;
  const paddingRight = 18;
  const paddingTop = 18;
  const paddingBottom = 42;
  const values = points.flatMap((point) =>
    mode === "total" ? [point.total] : [point.min, point.max, point.avg],
  );
  const maxValue = Math.max(...values, 1);
  const ticks = getChartTicks(maxValue, kind);
  const axisMax = Math.max(...ticks, maxValue, 1);
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const x = (index: number) =>
    points.length === 1
      ? paddingLeft + chartWidth / 2
      : paddingLeft + (index * chartWidth) / (points.length - 1);
  const y = (value: number) =>
    paddingTop + chartHeight - (value / axisMax) * chartHeight;
  const linePath = (selector: (point: MetricPoint) => number) =>
    points
      .map(
        (point, index) =>
          `${index === 0 ? "M" : "L"}${x(index)},${y(selector(point))}`,
      )
      .join(" ");
  const summary = getChartSummary(points, mode);

  return (
    <article className="chart-card chart-card-single">
      <div className="chart-title-row">
        <h4>{title}</h4>
        <span>{points.length} séance(s)</span>
      </div>
      {points.length === 0 ? (
        <p>Aucune donnée pour cet exercice.</p>
      ) : (
        <>
          <svg
            className="mini-chart upgraded-chart"
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={title}
          >
            {ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  y1={y(tick)}
                  x2={width - paddingRight}
                  y2={y(tick)}
                  className="chart-grid-line"
                />
                <text x={paddingLeft - 8} y={y(tick) + 4} textAnchor="end">
                  {formatTickValue(tick, unit, kind)}
                </text>
              </g>
            ))}
            <line
              x1={paddingLeft}
              y1={height - paddingBottom}
              x2={width - paddingRight}
              y2={height - paddingBottom}
              className="chart-axis-line"
            />
            <line
              x1={paddingLeft}
              y1={paddingTop}
              x2={paddingLeft}
              y2={height - paddingBottom}
              className="chart-axis-line"
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
              <g key={`${point.date}-${index}`}>
                <circle
                  cx={x(index)}
                  cy={y(mode === "total" ? point.total : point.avg)}
                  r="3.5"
                />
                {(index === 0 || index === points.length - 1) && (
                  <text
                    x={x(index)}
                    y={height - 16}
                    textAnchor={index === 0 ? "start" : "end"}
                    className="chart-date-label"
                  >
                    {formatDateTime(point.date).split(" ")[0]}
                  </text>
                )}
              </g>
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
          <div className="chart-last-value chart-summary-row">
            <span>Dernier : {formatCompactValue(summary.last, unit, kind)}</span>
            <span>Variation : {summary.delta >= 0 ? "+" : ""}{formatCompactValue(summary.delta, unit, kind)}</span>
          </div>
        </>
      )}
    </article>
  );
}

export function WorkoutSessionDetail({
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

function toInputDate(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString().slice(0, 10);
}

function getDefaultDateRange() {
  const end = new Date();
  end.setHours(0, 0, 0, 0);

  const start = new Date(end);
  start.setDate(end.getDate() - 6);

  return {
    startDate: toInputDate(start),
    endDate: toInputDate(end),
  };
}

function getDateRangeDays(startDate: string, endDate: string) {
  const days: Date[] = [];
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return days;
  }

  const cursor = start <= end ? new Date(start) : new Date(end);
  const limit = start <= end ? end : start;

  while (cursor <= limit) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
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
  const [activeChart, setActiveChart] = useState<ChartKind>("weight");
  const chartConfig = {
    reps: { title: "Répétitions", points: repsPoints, unit: "reps", mode: "stats" as const },
    weight: { title: "Poids", points: weightPoints, unit: "kg", mode: "stats" as const },
    volume: { title: "Volume soulevé", points: volumePoints, unit: "kg", mode: "total" as const },
  }[activeChart];
  const records = {
    reps: Math.max(...repsPoints.map((point) => point.max), 0),
    weight: Math.max(...weightPoints.map((point) => point.max), 0),
    volume: Math.max(...volumePoints.map((point) => point.total), 0),
  };

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
        <div className="exercise-chart-panel">
          <div className="exercise-record-grid">
            <div>
              <span>Record charge</span>
              <b>{Math.round(records.weight * 10) / 10} kg</b>
            </div>
            <div>
              <span>Record reps</span>
              <b>{Math.round(records.reps)} reps</b>
            </div>
            <div>
              <span>Record volume</span>
              <b>{Math.round(records.volume)} kg</b>
            </div>
          </div>

          <div className="graph-tabs" role="tablist" aria-label="Graphiques exercice">
            <button
              type="button"
              className={activeChart === "weight" ? "active" : ""}
              onClick={() => setActiveChart("weight")}
            >
              Poids
            </button>
            <button
              type="button"
              className={activeChart === "reps" ? "active" : ""}
              onClick={() => setActiveChart("reps")}
            >
              Reps
            </button>
            <button
              type="button"
              className={activeChart === "volume" ? "active" : ""}
              onClick={() => setActiveChart("volume")}
            >
              Volume
            </button>
          </div>

          <MiniChart
            title={chartConfig.title}
            points={chartConfig.points}
            unit={chartConfig.unit}
            kind={activeChart}
            mode={chartConfig.mode}
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
  const defaultDateRange = useMemo(() => getDefaultDateRange(), []);
  const [calendarStartDate, setCalendarStartDate] = useState(
    defaultDateRange.startDate,
  );
  const [calendarEndDate, setCalendarEndDate] = useState(
    defaultDateRange.endDate,
  );
  const calendarDays = useMemo(
    () => getDateRangeDays(calendarStartDate, calendarEndDate),
    [calendarStartDate, calendarEndDate],
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
              <h3>Historique des séances</h3>
              <p>Choisis une période et ouvre le détail d’une séance.</p>
            </div>
          </div>

          <div className="calendar-range-controls">
            <label>
              Début
              <input
                type="date"
                value={calendarStartDate}
                onChange={(event) => setCalendarStartDate(event.target.value)}
              />
            </label>
            <label>
              Fin
              <input
                type="date"
                value={calendarEndDate}
                onChange={(event) => setCalendarEndDate(event.target.value)}
              />
            </label>
          </div>

          <div className="workout-calendar-grid">
            {calendarDays.map((day) => {
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
