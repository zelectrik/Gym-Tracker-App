import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../api";
import type { MealType, NutritionEntry, NutritionEntryPayload } from "../types";

export type NutritionTab = "dashboard" | "history";

type NutritionFormState = {
  date: string;
  mealType: MealType;
  description: string;
  calories: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
};

type DaySummary = {
  date: string;
  entries: NutritionEntry[];
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

const mealTypeLabels: Record<MealType, string> = {
  BREAKFAST: "Petit-déj",
  LUNCH: "Déjeuner",
  DINNER: "Dîner",
  SNACK: "Collation",
  OTHER: "Autre",
};

const dailyTargets = {
  calories: 2300,
  proteinG: 180,
  carbsG: 220,
  fatG: 70,
};

function todayLocalDate() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function defaultStartDate() {
  return addDays(todayLocalDate(), -6);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00.000Z`));
}

function getEntryDate(entry: NutritionEntry) {
  return entry.date.slice(0, 10);
}

function formatNumber(value: number, suffix = "") {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded}${suffix}`;
}

function toNumber(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function emptyForm(): NutritionFormState {
  return {
    date: todayLocalDate(),
    mealType: "OTHER",
    description: "",
    calories: "",
    proteinG: "",
    carbsG: "",
    fatG: "",
  };
}

function buildPayload(form: NutritionFormState): NutritionEntryPayload {
  return {
    date: form.date,
    mealType: form.mealType,
    description: form.description.trim(),
    calories: toNumber(form.calories),
    proteinG: toNumber(form.proteinG),
    carbsG: toNumber(form.carbsG),
    fatG: toNumber(form.fatG),
  };
}

function getTotals(entries: NutritionEntry[]) {
  return entries.reduce(
    (acc, entry) => ({
      calories: acc.calories + entry.calories,
      proteinG: acc.proteinG + entry.proteinG,
      carbsG: acc.carbsG + entry.carbsG,
      fatG: acc.fatG + entry.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}

function getDateRange(startDate: string, endDate: string) {
  const days: string[] = [];
  let current = startDate;
  while (current <= endDate && days.length < 60) {
    days.push(current);
    current = addDays(current, 1);
  }
  return days;
}

function buildDaySummaries(
  entries: NutritionEntry[],
  startDate: string,
  endDate: string,
) {
  return getDateRange(startDate, endDate)
    .map((date) => {
      const dayEntries = entries.filter(
        (entry) => getEntryDate(entry) === date,
      );
      return {
        date,
        entries: dayEntries,
        ...getTotals(dayEntries),
      } satisfies DaySummary;
    })
    .reverse();
}

function ProgressBar({
  label,
  value,
  target,
  suffix,
}: {
  label: string;
  value: number;
  target: number;
  suffix: string;
}) {
  const percent = Math.min(115, target > 0 ? (value / target) * 100 : 0);
  const isOver = value > target;

  return (
    <div className={isOver ? "nutrition-progress over" : "nutrition-progress"}>
      <div className="nutrition-progress-topline">
        <span>{label}</span>
        <b>
          {formatNumber(value, suffix)} / {formatNumber(target, suffix)}
        </b>
      </div>
      <div className="nutrition-progress-track">
        <span style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function NutritionDashboard({
  activeNutritionTab,
}: {
  activeNutritionTab: NutritionTab;
}) {
  const [entries, setEntries] = useState<NutritionEntry[]>([]);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(todayLocalDate);
  const [form, setForm] = useState<NutritionFormState>(() => emptyForm());
  const [showForm, setShowForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [expandedMealType, setExpandedMealType] = useState<MealType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refresh(range = { startDate, endDate }) {
    setLoading(true);
    try {
      setEntries(await api.nutritionEntries(range));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refresh({ startDate, endDate });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const todayEntries = useMemo(
    () => entries.filter((entry) => getEntryDate(entry) === todayLocalDate()),
    [entries],
  );
  const todayTotals = useMemo(() => getTotals(todayEntries), [todayEntries]);
  const caloriesRemaining = Math.max(0, dailyTargets.calories - todayTotals.calories);
  const mealSummaries = useMemo(() => {
    return Object.entries(mealTypeLabels)
      .map(([mealType, label]) => {
        const mealEntries = todayEntries.filter((entry) => entry.mealType === mealType);
        return {
          mealType: mealType as MealType,
          label,
          entries: mealEntries,
          ...getTotals(mealEntries),
        };
      })
      .filter((meal) => meal.entries.length > 0);
  }, [todayEntries]);
  const daySummaries = useMemo(
    () => buildDaySummaries(entries, startDate, endDate),
    [entries, startDate, endDate],
  );
  const averages = useMemo(() => {
    const dayCount = Math.max(daySummaries.length, 1);
    const totals = daySummaries.reduce(
      (acc, day) => ({
        calories: acc.calories + day.calories,
        proteinG: acc.proteinG + day.proteinG,
        carbsG: acc.carbsG + day.carbsG,
        fatG: acc.fatG + day.fatG,
      }),
      { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
    );

    return {
      calories: totals.calories / dayCount,
      proteinG: totals.proteinG / dayCount,
      carbsG: totals.carbsG / dayCount,
      fatG: totals.fatG / dayCount,
    };
  }, [daySummaries]);
  const selectedDaySummary = selectedDay
    ? daySummaries.find((day) => day.date === selectedDay)
    : null;

  function updateForm<K extends keyof NutritionFormState>(
    key: K,
    value: NutritionFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);

    try {
      const payload = buildPayload(form);
      if (!payload.description) throw new Error("Description obligatoire.");
      await api.saveNutritionEntry(payload);
      setMessage("Alimentation ajoutée.");
      setForm(emptyForm());
      setShowForm(false);
      await refresh({ startDate, endDate });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Enregistrement impossible",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(entry: NutritionEntry) {
    const confirmed = confirm(`Supprimer "${entry.description}" ?`);
    if (!confirmed) return;
    await api.deleteNutritionEntry(entry.id);
    await refresh({ startDate, endDate });
  }

  return (
    <section className="nutrition-dashboard">
      {activeNutritionTab === "dashboard" && (
        <>
          <section className="card nutrition-hero-card nutrition-action-hero-card">
            <div className="nutrition-hero-topline">
              <span className="pill">Nutrition</span>
              <span>Aujourd'hui · {formatDate(todayLocalDate())}</span>
            </div>
            <div className="nutrition-remaining-hero">
              <span>Il reste</span>
              <strong>{formatNumber(caloriesRemaining, " kcal")}</strong>
              <small>{formatNumber(todayTotals.calories, " kcal")} consommées / {formatNumber(dailyTargets.calories, " kcal")}</small>
            </div>

            <div className="nutrition-progress-list">
              <ProgressBar
                label="Calories"
                value={todayTotals.calories}
                target={dailyTargets.calories}
                suffix=" kcal"
              />
              <ProgressBar
                label="Protéines"
                value={todayTotals.proteinG}
                target={dailyTargets.proteinG}
                suffix=" g"
              />
              <ProgressBar
                label="Lipides"
                value={todayTotals.fatG}
                target={dailyTargets.fatG}
                suffix=" g"
              />
              <ProgressBar
                label="Glucides"
                value={todayTotals.carbsG}
                target={dailyTargets.carbsG}
                suffix=" g"
              />
            </div>

            <button
              type="button"
              className="primary large-action"
              onClick={() => setShowForm((current) => !current)}
            >
              {showForm ? "Fermer la saisie" : "+ Ajouter une alimentation"}
            </button>
          </section>

          {showForm && (
            <section className="card nutrition-form-card">
              <div className="section-title compact-section-title">
                <div>
                  <h3>Ajouter une alimentation</h3>
                  <p>Repas, collation ou estimation rapide.</p>
                </div>
              </div>

              <form className="nutrition-form" onSubmit={submit}>
                <label>
                  Date
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => updateForm("date", e.target.value)}
                    required
                  />
                </label>

                <label>
                  Type
                  <select
                    value={form.mealType}
                    onChange={(e) =>
                      updateForm("mealType", e.target.value as MealType)
                    }
                  >
                    {Object.entries(mealTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="wide">
                  Description
                  <input
                    value={form.description}
                    onChange={(e) => updateForm("description", e.target.value)}
                    placeholder="ex: wrap poulet mozzarella"
                    required
                  />
                </label>

                <label>
                  Calories
                  <input
                    type="number"
                    min="0"
                    step="1"
                    inputMode="decimal"
                    value={form.calories}
                    onChange={(e) => updateForm("calories", e.target.value)}
                    placeholder="kcal"
                    required
                  />
                </label>

                <label>
                  Protéines
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    inputMode="decimal"
                    value={form.proteinG}
                    onChange={(e) => updateForm("proteinG", e.target.value)}
                    placeholder="g"
                  />
                </label>

                <label>
                  Lipides
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    inputMode="decimal"
                    value={form.fatG}
                    onChange={(e) => updateForm("fatG", e.target.value)}
                    placeholder="g"
                  />
                </label>

                <label>
                  Glucides
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    inputMode="decimal"
                    value={form.carbsG}
                    onChange={(e) => updateForm("carbsG", e.target.value)}
                    placeholder="g"
                  />
                </label>

                {message && <p className="success wide">{message}</p>}
                {error && <p className="error wide">{error}</p>}

                <button className="primary wide" disabled={saving}>
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </form>
            </section>
          )}

          {mealSummaries.length > 0 && (
            <section className="card nutrition-today-card nutrition-meal-summary-card">
              <div className="section-title compact-section-title">
                <div>
                  <h3>Repas du jour</h3>
                  <p>Résumé compact, détail au clic.</p>
                </div>
              </div>
              <div className="nutrition-meal-summary-list">
                {mealSummaries.map((meal) => (
                  <article key={meal.mealType} className="nutrition-meal-summary-item">
                    <button
                      type="button"
                      className="nutrition-meal-summary-button"
                      onClick={() =>
                        setExpandedMealType((current) =>
                          current === meal.mealType ? null : meal.mealType,
                        )
                      }
                    >
                      <div>
                        <b>{meal.label}</b>
                        <span>{meal.entries.length} entrée{meal.entries.length > 1 ? "s" : ""}</span>
                      </div>
                      <div>
                        <strong>{formatNumber(meal.calories, " kcal")}</strong>
                        <small>{formatNumber(meal.proteinG, " g")} protéines</small>
                      </div>
                    </button>

                    {expandedMealType === meal.mealType && (
                      <div className="nutrition-entry-list compact-nutrition-details">
                        {meal.entries.map((entry) => (
                          <article key={entry.id} className="nutrition-entry-row compact-nutrition-entry-row">
                            <div>
                              <b>{entry.description}</b>
                              <span>
                                {formatNumber(entry.calories, " kcal")} · P {formatNumber(entry.proteinG, " g")} · L {formatNumber(entry.fatG, " g")} · G {formatNumber(entry.carbsG, " g")}
                              </span>
                            </div>
                            <details className="context-menu small-context-menu">
                              <summary aria-label="Actions alimentation">…</summary>
                              <div>
                                <button type="button" className="danger" onClick={() => deleteEntry(entry)}>
                                  Supprimer
                                </button>
                              </div>
                            </details>
                          </article>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {activeNutritionTab === "history" && (
        <section className="card nutrition-history-card">
          <div className="section-title compact-section-title">
            <div>
              <span className="pill">Historique</span>
              <h3>Journal nutrition</h3>
              <p>Vue 7 jours par défaut, avec moyennes sur la période.</p>
            </div>
          </div>

          <div className="nutrition-date-filters">
            <label>
              Début
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <label>
              Fin
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </label>
          </div>

          <div className="nutrition-average-grid">
            <div>
              <span>Kcal / jour</span>
              <b>{formatNumber(averages.calories)}</b>
            </div>
            <div>
              <span>Prot / jour</span>
              <b>{formatNumber(averages.proteinG, " g")}</b>
            </div>
            <div>
              <span>Lip / jour</span>
              <b>{formatNumber(averages.fatG, " g")}</b>
            </div>
            <div>
              <span>Gluc / jour</span>
              <b>{formatNumber(averages.carbsG, " g")}</b>
            </div>
          </div>

          {loading ? (
            <p>Chargement...</p>
          ) : (
            <div className="nutrition-day-list">
              {daySummaries.map((day) => (
                <button
                  key={day.date}
                  type="button"
                  className={
                    selectedDay === day.date
                      ? "nutrition-day-card active"
                      : "nutrition-day-card"
                  }
                  onClick={() =>
                    setSelectedDay((current) =>
                      current === day.date ? null : day.date,
                    )
                  }
                >
                  <div>
                    <b>{formatDate(day.date)}</b>
                    <span>
                      {day.entries.length} entrée
                      {day.entries.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div>
                    <strong>{formatNumber(day.calories, " kcal")}</strong>
                    <small>Prot {formatNumber(day.proteinG, " g")}</small>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedDaySummary && (
            <div className="nutrition-day-detail">
              <h4>Détail du {formatDate(selectedDaySummary.date)}</h4>
              {selectedDaySummary.entries.length === 0 ? (
                <p className="muted">
                  Aucune alimentation enregistrée ce jour.
                </p>
              ) : (
                <div className="nutrition-entry-list">
                  {selectedDaySummary.entries.map((entry) => (
                    <article key={entry.id} className="nutrition-entry-row compact-nutrition-entry-row">
                      <div>
                        <b>{entry.description}</b>
                        <span>
                          {mealTypeLabels[entry.mealType]} ·{" "}
                          {formatNumber(entry.calories, " kcal")} · P{" "}
                          {formatNumber(entry.proteinG, " g")} · L{" "}
                          {formatNumber(entry.fatG, " g")} · G{" "}
                          {formatNumber(entry.carbsG, " g")}
                        </span>
                      </div>
                      <details className="context-menu small-context-menu">
                        <summary aria-label="Actions alimentation">…</summary>
                        <div>
                          <button type="button" className="danger" onClick={() => deleteEntry(entry)}>
                            Supprimer
                          </button>
                        </div>
                      </details>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </section>
  );
}
