import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { api } from "../api";
import type {
  BodyGoal,
  BodyGoalPayload,
  BodyGoalType,
  BodyMetric,
  BodySnapshot,
  BodySnapshotPayload,
} from "../types";

const fields = [
  {
    key: "weightKg",
    metric: "WEIGHT_KG",
    label: "Poids",
    shortLabel: "Poids",
    unit: "kg",
    step: "0.1",
  },
  {
    key: "neckCm",
    metric: "NECK_CM",
    label: "Cou",
    shortLabel: "Cou",
    unit: "cm",
    step: "0.1",
  },
  {
    key: "chestCm",
    metric: "CHEST_CM",
    label: "Torse",
    shortLabel: "Torse",
    unit: "cm",
    step: "0.1",
  },
  {
    key: "waistCm",
    metric: "WAIST_CM",
    label: "Ventre",
    shortLabel: "Ventre",
    unit: "cm",
    step: "0.1",
  },
  {
    key: "hipsCm",
    metric: "HIPS_CM",
    label: "Fesses",
    shortLabel: "Fesses",
    unit: "cm",
    step: "0.1",
  },
  {
    key: "armCm",
    metric: "ARM_CM",
    label: "Bras",
    shortLabel: "Bras",
    unit: "cm",
    step: "0.1",
  },
  {
    key: "thighCm",
    metric: "THIGH_CM",
    label: "Cuisses",
    shortLabel: "Cuisses",
    unit: "cm",
    step: "0.1",
  },
] as const;

const chartMetrics = [
  ...fields,
  {
    key: "chestWaistRatio",
    metric: "CHEST_WAIST_RATIO",
    label: "Ratio torse / ventre",
    shortLabel: "Ratio",
    unit: "",
    step: "0.01",
  },
] as const;

type Field = (typeof fields)[number];
type FieldKey = Field["key"];
type ChartMetric = (typeof chartMetrics)[number];
type ChartMetricKey = ChartMetric["metric"];

type FormState = Record<FieldKey, string> & {
  measuredAt: string;
  notes: string;
};

type GoalFormState = {
  metric: BodyMetric;
  level: string;
  goalType: BodyGoalType;
  targetValue: string;
  tolerance: string;
  deadline: string;
  notes: string;
};

type ChartPoint = {
  label: string;
  value: number;
};

const defaultGoalLevels: Partial<
  Record<BodyMetric, Array<{ targetValue: number; goalType: BodyGoalType }>>
> = {
  WEIGHT_KG: [100, 95, 90, 85].map((targetValue) => ({
    targetValue,
    goalType: "DECREASE",
  })),
  WAIST_CM: [110, 105, 100, 95].map((targetValue) => ({
    targetValue,
    goalType: "DECREASE",
  })),
};

const goalTypeLabels: Record<BodyGoalType, string> = {
  DECREASE: "Perte / baisse",
  INCREASE: "Progrès / hausse",
  MAINTAIN: "Maintien",
};

function todayLocalDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

function formatValue(value?: number | null, unit = "") {
  if (value === null || value === undefined) return "—";
  const rounded = Math.round(value * 100) / 100;
  return `${rounded}${unit ? ` ${unit}` : ""}`;
}

function getLocalDateInputValue(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return todayLocalDate();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function emptyForm(): FormState {
  return {
    measuredAt: todayLocalDate(),
    weightKg: "",
    neckCm: "",
    chestCm: "",
    waistCm: "",
    hipsCm: "",
    armCm: "",
    thighCm: "",
    notes: "",
  };
}

function emptyGoalForm(): GoalFormState {
  return {
    metric: "WEIGHT_KG",
    level: "1",
    goalType: "DECREASE",
    targetValue: "",
    tolerance: "",
    deadline: "",
    notes: "",
  };
}

function snapshotToForm(snapshot: BodySnapshot): FormState {
  return {
    measuredAt: getLocalDateInputValue(snapshot.measuredAt),
    weightKg: snapshot.weightKg?.toString() ?? "",
    neckCm: snapshot.neckCm?.toString() ?? "",
    chestCm: snapshot.chestCm?.toString() ?? "",
    waistCm: snapshot.waistCm?.toString() ?? "",
    hipsCm: snapshot.hipsCm?.toString() ?? "",
    armCm: snapshot.armCm?.toString() ?? "",
    thighCm: snapshot.thighCm?.toString() ?? "",
    notes: snapshot.notes ?? "",
  };
}

function goalToForm(goal: BodyGoal): GoalFormState {
  return {
    metric: goal.metric,
    level: goal.level.toString(),
    goalType: goal.goalType ?? "DECREASE",
    targetValue: goal.targetValue.toString(),
    tolerance: goal.tolerance?.toString() ?? "",
    deadline: goal.deadline ? getLocalDateInputValue(goal.deadline) : "",
    notes: goal.notes ?? "",
  };
}

function toNumber(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildPayload(form: FormState): BodySnapshotPayload {
  const payload: BodySnapshotPayload = {
    measuredAt: form.measuredAt,
  };

  fields.forEach((field) => {
    const value = toNumber(form[field.key]);
    if (value !== undefined) payload[field.key] = value;
  });

  if (form.notes.trim()) payload.notes = form.notes.trim();
  return payload;
}

function buildGoalPayload(form: GoalFormState): BodyGoalPayload {
  const targetValue = toNumber(form.targetValue);
  const tolerance = toNumber(form.tolerance);
  const level = Number(form.level);

  if (!Number.isInteger(level) || level < 1) {
    throw new Error("Le niveau doit être un nombre entier positif.");
  }

  if (targetValue === undefined || targetValue <= 0) {
    throw new Error("La valeur cible doit être renseignée.");
  }

  if (
    form.goalType === "MAINTAIN" &&
    tolerance !== undefined &&
    tolerance < 0
  ) {
    throw new Error("La marge de maintien doit être positive.");
  }

  return {
    metric: form.metric,
    level,
    goalType: form.goalType,
    targetValue,
    ...(tolerance !== undefined ? { tolerance } : {}),
    ...(form.deadline ? { deadline: form.deadline } : {}),
    ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
  };
}

function getDelta(current?: number | null, previous?: number | null) {
  if (current === null || current === undefined) return "";
  if (previous === null || previous === undefined) return "";
  const delta = current - previous;
  if (Math.abs(delta) < 0.05) return "= stable";
  const rounded = Math.round(delta * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded}`;
}

function getFieldByMetric(metric: BodyMetric) {
  return fields.find((field) => field.metric === metric) ?? fields[0];
}

function getChartMetric(metric: ChartMetricKey) {
  return (
    chartMetrics.find((field) => field.metric === metric) ?? chartMetrics[0]
  );
}

function getChestWaistRatio(snapshot?: BodySnapshot) {
  if (!snapshot?.chestCm || !snapshot.waistCm || snapshot.waistCm <= 0)
    return undefined;
  return snapshot.chestCm / snapshot.waistCm;
}

function getChartValue(snapshot: BodySnapshot, metric: ChartMetricKey) {
  if (metric === "CHEST_WAIST_RATIO") return getChestWaistRatio(snapshot);
  const field = getFieldByMetric(metric as BodyMetric);
  return snapshot[field.key];
}

function getRatioPercent(ratio?: number) {
  if (ratio === undefined) return 0;
  const min = 1;
  const max = 1.3;
  return Math.min(100, Math.max(0, ((ratio - min) / (max - min)) * 100));
}

function getRatioColor(ratio?: number) {
  if (ratio === undefined) return "#e2e8f0";
  const percent = getRatioPercent(ratio);
  if (percent <= 40) {
    const local = percent / 40;
    return `rgb(239, ${Math.round(68 + local * 136)}, 68)`;
  }
  if (percent <= 100) {
    const local = (percent - 40) / 60;
    return `rgb(${Math.round(245 - local * 223)}, ${Math.round(204 - local * 41)}, 71)`;
  }
  return "#16a34a";
}

function getRatioLabel(ratio?: number) {
  if (ratio === undefined) return "Ajoute torse + ventre";
  if (ratio < 1.08) return "À améliorer";
  if (ratio < 1.17) return "Intermédiaire";
  if (ratio < 1.25) return "Bon ratio";
  return "Très bon ratio";
}

function isGoalReached(goal: BodyGoal, current: number | null | undefined) {
  if (current === null || current === undefined) return false;

  if (goal.goalType === "INCREASE") return current >= goal.targetValue;
  if (goal.goalType === "MAINTAIN") {
    const tolerance = goal.tolerance ?? 1;
    return Math.abs(current - goal.targetValue) <= tolerance;
  }
  return current <= goal.targetValue;
}

function getGoalProgress(field: Field, latest?: BodySnapshot, goal?: BodyGoal) {
  if (!latest || !goal) return "Pas encore de mesure";
  const current = latest[field.key];
  if (current === null || current === undefined) return "Pas encore de mesure";
  if (isGoalReached(goal, current)) return "Atteint";

  if (goal.goalType === "MAINTAIN") {
    const tolerance = goal.tolerance ?? 1;
    const min = Math.round((goal.targetValue - tolerance) * 10) / 10;
    const max = Math.round((goal.targetValue + tolerance) * 10) / 10;
    return `Zone ${min} - ${max} ${field.unit}`;
  }

  const diff = Math.abs(Math.round((current - goal.targetValue) * 10) / 10);
  return `Encore ${diff} ${field.unit}`;
}

function MiniLineChart({
  points,
  unit,
}: {
  points: ChartPoint[];
  unit: string;
}) {
  if (points.length < 2) {
    return (
      <p className="muted">
        Ajoute au moins 2 mesures pour afficher une courbe.
      </p>
    );
  }

  const width = 320;
  const height = 150;
  const padding = 18;
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 0.01);

  const coordinates = points.map((point, index) => {
    const x =
      padding +
      (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
    const y =
      height - padding - ((point.value - min) / range) * (height - padding * 2);
    return { ...point, x, y };
  });
  const path = coordinates
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const first = points[0];
  const last = points[points.length - 1];

  return (
    <div className="body-chart-wrap">
      <svg
        className="body-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Graphique d'évolution physique"
      >
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} />
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
        />
        <path d={path} />
        {coordinates.map((point) => (
          <circle
            key={`${point.label}-${point.value}`}
            cx={point.x}
            cy={point.y}
            r="4"
          >
            <title>{`${point.label} : ${formatValue(point.value, unit)}`}</title>
          </circle>
        ))}
      </svg>
      <div className="body-chart-footer">
        <span>{first.label}</span>
        <b>
          {formatValue(first.value, unit)} → {formatValue(last.value, unit)}
        </b>
        <span>{last.label}</span>
      </div>
    </div>
  );
}

export function PhysicalTrackingDashboard() {
  const [snapshots, setSnapshots] = useState<BodySnapshot[]>([]);
  const [goals, setGoals] = useState<BodyGoal[]>([]);
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [goalForm, setGoalForm] = useState<GoalFormState>(() =>
    emptyGoalForm(),
  );
  const [selectedMetric, setSelectedMetric] =
    useState<ChartMetricKey>("WEIGHT_KG");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);
  const [message, setMessage] = useState("");
  const [goalMessage, setGoalMessage] = useState("");
  const [goalError, setGoalError] = useState("");
  const [goalsAvailable, setGoalsAvailable] = useState(true);
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      const nextSnapshots = await api.bodySnapshots();
      setSnapshots(nextSnapshots);

      try {
        const nextGoals = await api.bodyGoals();
        setGoals(nextGoals);
        setGoalsAvailable(true);
        setGoalError("");
      } catch (err) {
        setGoals([]);
        setGoalsAvailable(false);
        setGoalError(
          err instanceof Error
            ? err.message
            : "Objectifs indisponibles pour le moment.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const latest = snapshots[0];
  const previous = snapshots[1];
  const selectedChartMetric = getChartMetric(selectedMetric);
  const latestRatio = getChestWaistRatio(latest);
  const ratioPercent = getRatioPercent(latestRatio);
  const ratioColor = getRatioColor(latestRatio);

  const sortedAscending = useMemo(
    () =>
      [...snapshots].sort(
        (a, b) =>
          new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime(),
      ),
    [snapshots],
  );

  const chartPoints = useMemo(
    () =>
      sortedAscending
        .map((snapshot) => ({
          label: formatShortDate(snapshot.measuredAt),
          value: getChartValue(snapshot, selectedMetric),
        }))
        .filter(
          (point): point is ChartPoint => typeof point.value === "number",
        ),
    [selectedMetric, sortedAscending],
  );

  const goalsByMetric = useMemo(() => {
    return goals.reduce<Record<BodyMetric, BodyGoal[]>>(
      (acc, goal) => {
        acc[goal.metric] = [...(acc[goal.metric] ?? []), goal].sort(
          (a, b) => a.level - b.level,
        );
        return acc;
      },
      {} as Record<BodyMetric, BodyGoal[]>,
    );
  }, [goals]);

  function updateField(key: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateGoalField<K extends keyof GoalFormState>(
    key: K,
    value: GoalFormState[K],
  ) {
    setGoalForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);

    try {
      await api.saveBodySnapshot(buildPayload(form));
      setMessage("État physique enregistré.");
      setForm(emptyForm());
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Enregistrement impossible",
      );
    } finally {
      setSaving(false);
    }
  }

  async function submitGoal(e: FormEvent) {
    e.preventDefault();
    setGoalMessage("");
    setGoalError("");
    setError("");
    setSavingGoal(true);

    try {
      await api.saveBodyGoal(buildGoalPayload(goalForm));
      setGoalMessage("Objectif enregistré.");
      setSelectedMetric(goalForm.metric);
      setGoalForm(emptyGoalForm());
      await refresh();
    } catch (err) {
      setGoalError(
        err instanceof Error
          ? err.message
          : "Objectif impossible à enregistrer",
      );
      setGoalsAvailable(false);
    } finally {
      setSavingGoal(false);
    }
  }

  async function removeGoal(goal: BodyGoal) {
    setGoalError("");
    try {
      await api.deleteBodyGoal(goal.id);
      await refresh();
    } catch (err) {
      setGoalError(
        err instanceof Error ? err.message : "Suppression impossible",
      );
    }
  }

  return (
    <section className="physical-dashboard">
      <section className="card physical-hero-card">
        <div>
          <span className="pill">Suivi physique</span>
          <h3>État courant du corps</h3>
          <p>
            Ajoute ton poids, tes mensurations, puis fixe des objectifs de
            perte, maintien ou progrès par niveaux. L'idée : voir rapidement où
            tu en es sans perdre de temps.
          </p>
        </div>

        {latest && (
          <div className="physical-latest-card">
            <span>Dernier état</span>
            <b>{formatDate(latest.measuredAt)}</b>
            <p>{formatValue(latest.weightKg, "kg")}</p>
          </div>
        )}
      </section>

      <section className="card">
        <div className="section-title">
          <div>
            <h3>Ajouter un état</h3>
            <p>
              Tu peux aussi sélectionner une ancienne date pour saisir ton
              historique.
            </p>
          </div>
        </div>

        <form className="body-form" onSubmit={submit}>
          <label className="wide">
            Date
            <input
              type="date"
              value={form.measuredAt}
              onChange={(e) => updateField("measuredAt", e.target.value)}
              required
            />
          </label>

          {fields.map((field) => (
            <label key={field.key}>
              {field.label} ({field.unit})
              <input
                type="number"
                min="0"
                step={field.step}
                inputMode="decimal"
                value={form[field.key]}
                onChange={(e) => updateField(field.key, e.target.value)}
                placeholder={field.unit}
              />
            </label>
          ))}

          <label className="wide">
            Notes
            <textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Optionnel : photos prises, conditions, remarques..."
            />
          </label>

          {message && <p className="success wide">{message}</p>}
          {error && <p className="error wide">{error}</p>}

          <button className="primary large-action wide" disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer l'état"}
          </button>
        </form>
      </section>

      {latest && (
        <section className="card">
          <h3>Dernières mesures</h3>
          <div className="physical-stats-grid">
            {fields.map((field) => (
              <button
                key={field.key}
                type="button"
                className={
                  selectedMetric === field.metric
                    ? "metric-card active"
                    : "metric-card"
                }
                onClick={() => setSelectedMetric(field.metric)}
              >
                <span>{field.label}</span>
                <b>{formatValue(latest[field.key], field.unit)}</b>
                {previous && (
                  <small>
                    {getDelta(latest[field.key], previous[field.key])}
                  </small>
                )}
              </button>
            ))}
            <button
              type="button"
              className={
                selectedMetric === "CHEST_WAIST_RATIO"
                  ? "metric-card ratio-card active"
                  : "metric-card ratio-card"
              }
              onClick={() => setSelectedMetric("CHEST_WAIST_RATIO")}
              style={
                {
                  "--ratio-color": ratioColor,
                  "--ratio-progress": `${ratioPercent}%`,
                } as CSSProperties
              }
            >
              <span>Ratio torse / ventre</span>
              <b>{latestRatio ? latestRatio.toFixed(2) : "—"}</b>
              <small>{getRatioLabel(latestRatio)}</small>
            </button>
          </div>
        </section>
      )}

      <section className="card ratio-overview-card">
        <div className="section-title">
          <div>
            <h3>Ratio torse ÷ ventre</h3>
            <p>Rouge vers 1, jaune autour de 1,12, vert vers 1,30.</p>
          </div>
          <strong>{latestRatio ? latestRatio.toFixed(2) : "—"}</strong>
        </div>
        <div
          className="ratio-gauge"
          style={
            {
              "--ratio-progress": `${ratioPercent}%`,
              "--ratio-color": ratioColor,
            } as CSSProperties
          }
        >
          <span />
        </div>
        <div className="ratio-scale">
          <span>1.00</span>
          <span>1.12</span>
          <span>1.30</span>
        </div>
      </section>

      <section className="card">
        <div className="section-title">
          <div>
            <h3>Graphique</h3>
            <p>Un seul graphique à la fois pour rester lisible sur mobile.</p>
          </div>
        </div>

        <div className="metric-tabs">
          {chartMetrics.map((field) => (
            <button
              key={field.metric}
              type="button"
              className={selectedMetric === field.metric ? "active" : ""}
              onClick={() => setSelectedMetric(field.metric)}
            >
              {field.shortLabel}
            </button>
          ))}
        </div>

        <MiniLineChart points={chartPoints} unit={selectedChartMetric.unit} />
      </section>

      <section className="card">
        <div className="section-title">
          <div>
            <h3>Objectifs par niveaux</h3>
            <p>
              Choisis le type : perte, maintien ou progrès. Exemple : perte
              poids, maintien torse, progrès bras.
            </p>
          </div>
        </div>

        {!goalsAvailable && (
          <p className="warning">
            Objectifs indisponibles : applique les migrations Prisma puis
            relance le backend. Le suivi physique et les graphiques restent
            utilisables.
            {goalError ? ` Détail : ${goalError}` : ""}
          </p>
        )}

        <form
          className="goal-form"
          onSubmit={submitGoal}
          aria-disabled={!goalsAvailable}
        >
          <label>
            Mesure
            <select
              value={goalForm.metric}
              onChange={(e) =>
                updateGoalField("metric", e.target.value as BodyMetric)
              }
              disabled={!goalsAvailable}
            >
              {fields.map((field) => (
                <option key={field.metric} value={field.metric}>
                  {field.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Type d'objectif
            <select
              value={goalForm.goalType}
              onChange={(e) =>
                updateGoalField("goalType", e.target.value as BodyGoalType)
              }
              disabled={!goalsAvailable}
            >
              <option value="DECREASE">Perte / baisse</option>
              <option value="MAINTAIN">Maintien</option>
              <option value="INCREASE">Progrès / hausse</option>
            </select>
          </label>

          <label>
            Niveau
            <input
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={goalForm.level}
              onChange={(e) => updateGoalField("level", e.target.value)}
              required
              disabled={!goalsAvailable}
            />
          </label>

          <label>
            Valeur cible
            <input
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              value={goalForm.targetValue}
              onChange={(e) => updateGoalField("targetValue", e.target.value)}
              placeholder={getFieldByMetric(goalForm.metric).unit}
              required
              disabled={!goalsAvailable}
            />
          </label>

          <label>
            Marge maintien
            <input
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              value={goalForm.tolerance}
              onChange={(e) => updateGoalField("tolerance", e.target.value)}
              placeholder="ex: 1"
              disabled={!goalsAvailable || goalForm.goalType !== "MAINTAIN"}
            />
          </label>

          <label>
            Deadline
            <input
              type="date"
              value={goalForm.deadline}
              onChange={(e) => updateGoalField("deadline", e.target.value)}
              disabled={!goalsAvailable}
            />
          </label>

          <label className="wide">
            Notes
            <input
              value={goalForm.notes}
              onChange={(e) => updateGoalField("notes", e.target.value)}
              placeholder="Optionnel"
              disabled={!goalsAvailable}
            />
          </label>

          {goalMessage && <p className="success wide">{goalMessage}</p>}
          {goalError && goalsAvailable && (
            <p className="error wide">{goalError}</p>
          )}

          <button
            className="primary wide"
            disabled={savingGoal || !goalsAvailable}
          >
            {savingGoal ? "Enregistrement..." : "Enregistrer l'objectif"}
          </button>
        </form>

        <div className="goal-metric-list">
          {fields.map((field) => {
            const metricGoals = goalsByMetric[field.metric] ?? [];
            if (metricGoals.length === 0) return null;

            return (
              <article key={field.metric} className="goal-metric-card">
                <h4>{field.label}</h4>
                <div className="goal-levels">
                  {metricGoals.map((goal) => {
                    const reached = isGoalReached(goal, latest?.[field.key]);
                    return (
                      <div
                        key={goal.id}
                        className={
                          reached ? "goal-level reached" : "goal-level"
                        }
                      >
                        <div>
                          <b>Niveau {goal.level}</b>
                          <span>
                            {goalTypeLabels[goal.goalType ?? "DECREASE"]}
                          </span>
                        </div>
                        <div>
                          <span>
                            {formatValue(goal.targetValue, field.unit)}
                          </span>
                          {goal.goalType === "MAINTAIN" && (
                            <small>
                              ± {formatValue(goal.tolerance ?? 1, field.unit)}
                            </small>
                          )}
                        </div>
                        <small>
                          {goal.deadline
                            ? `Deadline ${formatDate(goal.deadline)}`
                            : "Pas de deadline"}
                          {" · "}
                          {getGoalProgress(field, latest, goal)}
                        </small>
                        <div className="goal-actions">
                          <button
                            type="button"
                            onClick={() => setGoalForm(goalToForm(goal))}
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => removeGoal(goal)}
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="card">
        <h3>Historique physique</h3>
        {loading ? (
          <p>Chargement...</p>
        ) : sortedAscending.length === 0 ? (
          <p>Aucun état physique enregistré pour le moment.</p>
        ) : (
          <div className="body-history-list">
            {sortedAscending.map((snapshot) => {
              const ratio = getChestWaistRatio(snapshot);
              return (
                <article key={snapshot.id} className="body-history-item">
                  <div>
                    <b>{formatDate(snapshot.measuredAt)}</b>
                    <span>
                      {formatValue(snapshot.weightKg, "kg")} · ventre{" "}
                      {formatValue(snapshot.waistCm, "cm")} · ratio{" "}
                      {ratio ? ratio.toFixed(2) : "—"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm(snapshotToForm(snapshot))}
                  >
                    Modifier
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}
