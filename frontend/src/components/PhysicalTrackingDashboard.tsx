import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../api";
import type {
  BodyGoal,
  BodyGoalPayload,
  BodyGoalType,
  BodyMetric,
  BodySnapshot,
  BodySnapshotPayload,
} from "../types";

type FieldKey =
  | "weightKg"
  | "neckCm"
  | "chestCm"
  | "waistCm"
  | "hipsCm"
  | "armCm"
  | "thighCm";
type ComputedKey = "chestWaistRatio";
type MetricKey = FieldKey | ComputedKey;
type GoalStatus = "good" | "warning" | "bad" | "unknown";

type Field = {
  key: MetricKey;
  metric: BodyMetric;
  label: string;
  shortLabel: string;
  unit: string;
  step: string;
  input?: boolean;
  hint?: string;
};

type FormState = Record<FieldKey, string> & {
  measuredAt: string;
  notes: string;
};

type GoalFormState = {
  metric: BodyMetric;
  goalType: BodyGoalType;
  level: string;
  targetValue: string;
  tolerance: string;
  deadline: string;
  notes: string;
};

type ChartPoint = {
  label: string;
  value: number;
};

const inputFields = [
  { key: "weightKg", metric: "WEIGHT_KG", label: "Poids", shortLabel: "Poids", unit: "kg", step: "0.1", input: true },
  { key: "neckCm", metric: "NECK_CM", label: "Cou", shortLabel: "Cou", unit: "cm", step: "0.1", input: true },
  { key: "chestCm", metric: "CHEST_CM", label: "Torse", shortLabel: "Torse", unit: "cm", step: "0.1", input: true },
  { key: "waistCm", metric: "WAIST_CM", label: "Ventre", shortLabel: "Ventre", unit: "cm", step: "0.1", input: true },
  { key: "hipsCm", metric: "HIPS_CM", label: "Fesses", shortLabel: "Fesses", unit: "cm", step: "0.1", input: true },
  { key: "armCm", metric: "ARM_CM", label: "Bras", shortLabel: "Bras", unit: "cm", step: "0.1", input: true },
  { key: "thighCm", metric: "THIGH_CM", label: "Cuisses", shortLabel: "Cuisses", unit: "cm", step: "0.1", input: true },
] as const satisfies readonly Field[];

const fields = [
  ...inputFields,
  { key: "chestWaistRatio", metric: "CHEST_WAIST_RATIO", label: "Ratio torse / ventre", shortLabel: "Ratio", unit: "", step: "0.01", hint: "1 = rouge, 1.12 = jaune, 1.30 = vert" },
] as const satisfies readonly Field[];

const defaultGoalLevels: Partial<Record<BodyMetric, number[]>> = {
  WEIGHT_KG: [100, 95, 90, 85],
  WAIST_CM: [110, 105, 100, 95],
  CHEST_WAIST_RATIO: [1.05, 1.12, 1.2, 1.3],
};

const goalTypeLabels: Record<BodyGoalType, string> = {
  LOSS: "Perte / baisse",
  GAIN: "Progrès / hausse",
  MAINTAIN_ABOVE: "Maintien au-dessus",
  MAINTAIN_BELOW: "Maintien en-dessous",
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
    goalType: "LOSS",
    level: "1",
    targetValue: "",
    tolerance: "",
    deadline: "",
    notes: "",
  };
}

function isMaintainType(goalType: BodyGoalType) {
  return goalType === "MAINTAIN_ABOVE" || goalType === "MAINTAIN_BELOW";
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
    goalType: goal.goalType ?? "LOSS",
    level: goal.level.toString(),
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

function getRatio(snapshot?: BodySnapshot) {
  if (!snapshot?.chestCm || !snapshot.waistCm) return undefined;
  return snapshot.chestCm / snapshot.waistCm;
}

function getSnapshotMetricValue(snapshot: BodySnapshot | undefined, field: Field) {
  if (!snapshot) return undefined;
  if (field.key === "chestWaistRatio") return getRatio(snapshot);
  return snapshot[field.key];
}

function buildPayload(form: FormState): BodySnapshotPayload {
  const payload: BodySnapshotPayload = {
    measuredAt: form.measuredAt,
  };

  inputFields.forEach((field) => {
    const value = toNumber(form[field.key]);
    if (value !== undefined) payload[field.key] = value;
  });

  if (form.notes.trim()) payload.notes = form.notes.trim();
  return payload;
}

function buildGoalPayload(form: GoalFormState): BodyGoalPayload {
  const targetValue = toNumber(form.targetValue);
  const tolerance = toNumber(form.tolerance);
  const maintain = isMaintainType(form.goalType);
  const level = maintain ? 0 : Number(form.level);

  if (!maintain && (!Number.isInteger(level) || level < 1)) {
    throw new Error("Le niveau doit être un nombre entier positif.");
  }

  if (targetValue === undefined || targetValue <= 0) {
    throw new Error("La valeur cible doit être renseignée.");
  }

  return {
    metric: form.metric,
    goalType: form.goalType,
    level,
    targetValue,
    ...(tolerance !== undefined ? { tolerance } : {}),
    ...(!maintain && form.deadline ? { deadline: form.deadline } : {}),
    ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
  };
}

function getDelta(current?: number | null, previous?: number | null) {
  if (current === null || current === undefined) return "";
  if (previous === null || previous === undefined) return "";
  const delta = current - previous;
  if (Math.abs(delta) < 0.005) return "= stable";
  const rounded = Math.round(delta * 100) / 100;
  return `${rounded > 0 ? "+" : ""}${rounded}`;
}

function getFieldByMetric(metric: BodyMetric) {
  return fields.find((field) => field.metric === metric) ?? fields[0];
}

function getGoalStatus(current: number | null | undefined, goal: BodyGoal): GoalStatus {
  if (current === null || current === undefined) return "unknown";
  const tolerance = goal.tolerance ?? 0;

  switch (goal.goalType) {
    case "LOSS":
      return current <= goal.targetValue ? "good" : "bad";
    case "GAIN":
      return current >= goal.targetValue ? "good" : "bad";
    case "MAINTAIN_ABOVE":
      if (current >= goal.targetValue) return "good";
      if (tolerance > 0 && current >= goal.targetValue - tolerance) return "warning";
      return "bad";
    case "MAINTAIN_BELOW":
      if (current <= goal.targetValue) return "good";
      if (tolerance > 0 && current <= goal.targetValue + tolerance) return "warning";
      return "bad";
    default:
      return "unknown";
  }
}

function getGoalProgress(current: number | null | undefined, goal: BodyGoal, unit: string) {
  if (current === null || current === undefined) return "Pas encore de mesure";
  const diff = Math.abs(Math.round((current - goal.targetValue) * 100) / 100);
  const status = getGoalStatus(current, goal);

  if (goal.goalType === "MAINTAIN_ABOVE") {
    if (status === "good") return "Maintien OK";
    if (status === "warning") return "Zone jaune";
    return `Sous la limite de ${diff} ${unit}`;
  }

  if (goal.goalType === "MAINTAIN_BELOW") {
    if (status === "good") return "Maintien OK";
    if (status === "warning") return "Zone jaune";
    return `Au-dessus de ${diff} ${unit}`;
  }

  if (status === "good") return "Atteint";
  return `Encore ${diff} ${unit}`;
}

function getRatioScore(ratio?: number) {
  if (ratio === undefined) return undefined;
  const min = 1;
  const yellow = 1.12;
  const max = 1.3;

  if (ratio <= yellow) {
    return Math.max(0, Math.min(50, ((ratio - min) / (yellow - min)) * 50));
  }

  return Math.max(50, Math.min(100, 50 + ((ratio - yellow) / (max - yellow)) * 50));
}

function getRatioStyle(ratio?: number) {
  const score = getRatioScore(ratio);
  if (score === undefined) return undefined;
  const hue = Math.round((score / 100) * 120);
  return {
    background: `linear-gradient(135deg, hsla(${hue}, 85%, 48%, 0.20), hsla(${hue}, 85%, 48%, 0.08))`,
    borderColor: `hsl(${hue}, 75%, 45%)`,
  };
}

function getMaintainerForMetric(goals: BodyGoal[], metric: BodyMetric) {
  return goals.find(
    (goal) => goal.metric === metric && isMaintainType(goal.goalType) && goal.isActive,
  );
}

function getMetricCardClass(status: GoalStatus, active: boolean) {
  return ["metric-card", active ? "active" : "", `status-${status}`].filter(Boolean).join(" ");
}

function MiniLineChart({ points, unit }: { points: ChartPoint[]; unit: string }) {
  if (points.length < 2) {
    return <p className="muted">Ajoute au moins 2 mesures pour afficher une courbe.</p>;
  }

  const width = 320;
  const height = 150;
  const padding = 18;
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);

  const coordinates = points.map((point, index) => {
    const x = padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - ((point.value - min) / range) * (height - padding * 2);
    return { ...point, x, y };
  });
  const path = coordinates.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const first = points[0];
  const last = points[points.length - 1];

  return (
    <div className="body-chart-wrap">
      <svg className="body-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Graphique d'évolution physique">
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} />
        <path d={path} />
        {coordinates.map((point) => (
          <circle key={`${point.label}-${point.value}`} cx={point.x} cy={point.y} r="4">
            <title>{`${point.label} : ${formatValue(point.value, unit)}`}</title>
          </circle>
        ))}
      </svg>
      <div className="body-chart-footer">
        <span>{first.label}</span>
        <b>{formatValue(first.value, unit)} → {formatValue(last.value, unit)}</b>
        <span>{last.label}</span>
      </div>
    </div>
  );
}

export function PhysicalTrackingDashboard() {
  const [snapshots, setSnapshots] = useState<BodySnapshot[]>([]);
  const [goals, setGoals] = useState<BodyGoal[]>([]);
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [goalForm, setGoalForm] = useState<GoalFormState>(() => emptyGoalForm());
  const [selectedMetric, setSelectedMetric] = useState<BodyMetric>("WEIGHT_KG");
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
        setGoalError(err instanceof Error ? err.message : "Objectifs indisponibles pour le moment.");
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
  const selectedField = getFieldByMetric(selectedMetric);
  const latestRatio = getRatio(latest);
  const maintainGoals = useMemo(
    () => goals.filter((goal) => isMaintainType(goal.goalType)),
    [goals],
  );
  const sortedAscending = useMemo(
    () => [...snapshots].sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime()),
    [snapshots],
  );
  const chartPoints = useMemo(
    () =>
      sortedAscending
        .map((snapshot) => ({
          label: formatShortDate(snapshot.measuredAt),
          value: getSnapshotMetricValue(snapshot, selectedField),
        }))
        .filter((point): point is ChartPoint => typeof point.value === "number"),
    [selectedField, sortedAscending],
  );
  const goalsByMetric = useMemo(() => {
    return goals.reduce<Record<BodyMetric, BodyGoal[]>>((acc, goal) => {
      acc[goal.metric] = [...(acc[goal.metric] ?? []), goal].sort((a, b) => a.level - b.level);
      return acc;
    }, {} as Record<BodyMetric, BodyGoal[]>);
  }, [goals]);

  function updateField(key: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateGoalField<K extends keyof GoalFormState>(key: K, value: GoalFormState[K]) {
    setGoalForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "goalType" && isMaintainType(value as BodyGoalType) ? { deadline: "", level: "0" } : {}),
      ...(key === "goalType" && !isMaintainType(value as BodyGoalType) && current.level === "0" ? { level: "1" } : {}),
    }));
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
      setError(err instanceof Error ? err.message : "Enregistrement impossible");
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
      setGoalMessage(isMaintainType(goalForm.goalType) ? "Objectif de maintien enregistré." : "Objectif par niveau enregistré.");
      setSelectedMetric(goalForm.metric);
      setGoalForm(emptyGoalForm());
      await refresh();
    } catch (err) {
      setGoalError(err instanceof Error ? err.message : "Objectif impossible à enregistrer");
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
      setGoalError(err instanceof Error ? err.message : "Suppression impossible");
    }
  }

  async function createDefaultGoals(metric: BodyMetric) {
    const levels = defaultGoalLevels[metric] ?? [];
    if (levels.length === 0) return;
    setSavingGoal(true);
    setGoalError("");
    setError("");

    try {
      await Promise.all(
        levels.map((targetValue, index) =>
          api.saveBodyGoal({
            metric,
            goalType: metric === "WEIGHT_KG" || metric === "WAIST_CM" ? "LOSS" : "GAIN",
            level: index + 1,
            targetValue,
          }),
        ),
      );
      setGoalMessage("Niveaux rapides créés.");
      setSelectedMetric(metric);
      await refresh();
    } catch (err) {
      setGoalError(err instanceof Error ? err.message : "Création des niveaux impossible");
      setGoalsAvailable(false);
    } finally {
      setSavingGoal(false);
    }
  }

  const isMaintainForm = isMaintainType(goalForm.goalType);

  return (
    <section className="physical-dashboard">
      <section className="card physical-hero-card">
        <div>
          <span className="pill">Suivi physique</span>
          <h3>État courant du corps</h3>
          <p>
            Ajoute ton poids, tes mensurations, puis suis tes niveaux et tes maintiens durables.
            Le ratio torse / ventre donne un indicateur visuel rapide de transformation.
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
            <p>Tu peux aussi sélectionner une ancienne date pour saisir ton historique.</p>
          </div>
        </div>

        <form className="body-form" onSubmit={submit}>
          <label className="wide">
            Date
            <input type="date" value={form.measuredAt} onChange={(e) => updateField("measuredAt", e.target.value)} required />
          </label>

          {inputFields.map((field) => (
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
            <textarea value={form.notes} onChange={(e) => updateField("notes", e.target.value)} placeholder="Optionnel : photos prises, conditions, remarques..." />
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
          <div className="ratio-panel" style={getRatioStyle(latestRatio)}>
            <div>
              <span>Ratio torse / ventre</span>
              <b>{formatValue(latestRatio)}</b>
            </div>
            <div className="ratio-scale">
              <span>1.00</span>
              <span>1.12</span>
              <span>1.30</span>
            </div>
          </div>
          <div className="physical-stats-grid">
            {fields.map((field) => {
              const current = getSnapshotMetricValue(latest, field);
              const previousValue = getSnapshotMetricValue(previous, field);
              const maintainGoal = getMaintainerForMetric(maintainGoals, field.metric);
              const status = maintainGoal ? getGoalStatus(current, maintainGoal) : "unknown";
              return (
                <button
                  key={field.key}
                  type="button"
                  className={getMetricCardClass(status, selectedMetric === field.metric)}
                  style={field.key === "chestWaistRatio" ? getRatioStyle(current ?? undefined) : undefined}
                  onClick={() => setSelectedMetric(field.metric)}
                >
                  <span>{field.label}</span>
                  <b>{formatValue(current, field.unit)}</b>
                  {previous && <small>{getDelta(current, previousValue)}</small>}
                  {maintainGoal && <em>{getGoalProgress(current, maintainGoal, field.unit)}</em>}
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="card">
        <div className="section-title">
          <div>
            <h3>Graphique</h3>
            <p>Un seul graphique à la fois pour rester lisible sur mobile.</p>
          </div>
        </div>

        <div className="metric-tabs">
          {fields.map((field) => (
            <button key={field.metric} type="button" className={selectedMetric === field.metric ? "active" : ""} onClick={() => setSelectedMetric(field.metric)}>
              {field.shortLabel}
            </button>
          ))}
        </div>

        <MiniLineChart points={chartPoints} unit={selectedField.unit} />
      </section>

      <section className="card">
        <div className="section-title">
          <div>
            <h3>Objectifs</h3>
            <p>Les pertes/progrès ont des niveaux. Les maintiens sont uniques par mesure et sans deadline.</p>
          </div>
        </div>

        {!goalsAvailable && (
          <p className="warning">
            Objectifs indisponibles : applique la migration Prisma puis relance le backend.
            Le suivi physique et les graphiques restent utilisables.
            {goalError ? ` Détail : ${goalError}` : ""}
          </p>
        )}

        <div className="quick-goal-actions">
          <button type="button" onClick={() => createDefaultGoals("WEIGHT_KG")} disabled={savingGoal || !goalsAvailable}>Poids 100 / 95 / 90 / 85</button>
          <button type="button" onClick={() => createDefaultGoals("WAIST_CM")} disabled={savingGoal || !goalsAvailable}>Ventre 110 / 105 / 100 / 95</button>
          <button type="button" onClick={() => createDefaultGoals("CHEST_WAIST_RATIO")} disabled={savingGoal || !goalsAvailable}>Ratio 1.05 / 1.12 / 1.20 / 1.30</button>
        </div>

        <form className="goal-form" onSubmit={submitGoal} aria-disabled={!goalsAvailable}>
          <label>
            Mesure
            <select value={goalForm.metric} onChange={(e) => updateGoalField("metric", e.target.value as BodyMetric)} disabled={!goalsAvailable}>
              {fields.map((field) => <option key={field.metric} value={field.metric}>{field.label}</option>)}
            </select>
          </label>

          <label>
            Type
            <select value={goalForm.goalType} onChange={(e) => updateGoalField("goalType", e.target.value as BodyGoalType)} disabled={!goalsAvailable}>
              {Object.entries(goalTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>

          {!isMaintainForm && (
            <label>
              Niveau
              <input type="number" min="1" step="1" inputMode="numeric" value={goalForm.level} onChange={(e) => updateGoalField("level", e.target.value)} required disabled={!goalsAvailable} />
            </label>
          )}

          <label>
            {isMaintainForm ? "Limite de maintien" : "Valeur cible"}
            <input type="number" min="0" step="0.01" inputMode="decimal" value={goalForm.targetValue} onChange={(e) => updateGoalField("targetValue", e.target.value)} placeholder={getFieldByMetric(goalForm.metric).unit || "ratio"} required disabled={!goalsAvailable} />
          </label>

          {isMaintainForm && (
            <label>
              Threshold / zone jaune
              <input type="number" min="0" step="0.01" inputMode="decimal" value={goalForm.tolerance} onChange={(e) => updateGoalField("tolerance", e.target.value)} placeholder="Optionnel" disabled={!goalsAvailable} />
            </label>
          )}

          {!isMaintainForm && (
            <label>
              Deadline
              <input type="date" value={goalForm.deadline} onChange={(e) => updateGoalField("deadline", e.target.value)} disabled={!goalsAvailable} />
            </label>
          )}

          <label className="wide">
            Notes
            <input value={goalForm.notes} onChange={(e) => updateGoalField("notes", e.target.value)} placeholder="Optionnel" disabled={!goalsAvailable} />
          </label>

          {goalMessage && <p className="success wide">{goalMessage}</p>}
          {goalError && goalsAvailable && <p className="error wide">{goalError}</p>}

          <button className="primary wide" disabled={savingGoal || !goalsAvailable}>
            {savingGoal ? "Enregistrement..." : isMaintainForm ? "Enregistrer le maintien" : "Enregistrer le niveau"}
          </button>
        </form>

        <div className="goal-metric-list">
          {fields.map((field) => {
            const metricGoals = goalsByMetric[field.metric] ?? [];
            if (metricGoals.length === 0) return null;
            const current = getSnapshotMetricValue(latest, field);

            return (
              <article key={field.metric} className="goal-metric-card">
                <h4>{field.label}</h4>
                <div className="goal-levels">
                  {metricGoals.map((goal) => {
                    const status = getGoalStatus(current, goal);
                    const maintain = isMaintainType(goal.goalType);
                    return (
                      <div key={goal.id} className={`goal-level status-${status}`}>
                        <div>
                          <b>{maintain ? goalTypeLabels[goal.goalType] : `Niveau ${goal.level}`}</b>
                          <span>{formatValue(goal.targetValue, field.unit)}</span>
                        </div>
                        <small>
                          {maintain ? "Maintien durable" : goal.deadline ? `Deadline ${formatDate(goal.deadline)}` : "Pas de deadline"}
                          {goal.tolerance ? ` · threshold ${formatValue(goal.tolerance, field.unit)}` : ""}
                          {" · "}{getGoalProgress(current, goal, field.unit)}
                        </small>
                        <div className="goal-actions">
                          <button type="button" onClick={() => setGoalForm(goalToForm(goal))}>Modifier</button>
                          <button type="button" onClick={() => removeGoal(goal)}>Supprimer</button>
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
            {sortedAscending.map((snapshot) => (
              <article key={snapshot.id} className="body-history-item">
                <div>
                  <b>{formatDate(snapshot.measuredAt)}</b>
                  <span>
                    {formatValue(snapshot.weightKg, "kg")} · ventre {formatValue(snapshot.waistCm, "cm")} · ratio {formatValue(getRatio(snapshot))}
                  </span>
                </div>
                <button type="button" onClick={() => setForm(snapshotToForm(snapshot))}>Modifier</button>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
