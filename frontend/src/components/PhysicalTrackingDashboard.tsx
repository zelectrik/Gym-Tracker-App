import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import type { BodySnapshot, BodySnapshotPayload } from "../types";

const fields = [
  { key: "weightKg", label: "Poids", unit: "kg", step: "0.1" },
  { key: "neckCm", label: "Cou", unit: "cm", step: "0.1" },
  { key: "chestCm", label: "Torse", unit: "cm", step: "0.1" },
  { key: "waistCm", label: "Ventre", unit: "cm", step: "0.1" },
  { key: "hipsCm", label: "Fesses", unit: "cm", step: "0.1" },
  { key: "armCm", label: "Bras", unit: "cm", step: "0.1" },
  { key: "thighCm", label: "Cuisses", unit: "cm", step: "0.1" },
] as const;

type FieldKey = (typeof fields)[number]["key"];
type FormState = Record<FieldKey, string> & {
  measuredAt: string;
  notes: string;
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

function formatValue(value?: number | null, unit = "") {
  if (value === null || value === undefined) return "—";
  return `${Math.round(value * 10) / 10}${unit ? ` ${unit}` : ""}`;
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

function getDelta(current?: number | null, previous?: number | null) {
  if (current === null || current === undefined) return "";
  if (previous === null || previous === undefined) return "";
  const delta = current - previous;
  if (Math.abs(delta) < 0.05) return "= stable";
  const rounded = Math.round(delta * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded}`;
}

export function PhysicalTrackingDashboard() {
  const [snapshots, setSnapshots] = useState<BodySnapshot[]>([]);
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      setSnapshots(await api.bodySnapshots());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const latest = snapshots[0];
  const previous = snapshots[1];
  const sortedAscending = useMemo(
    () =>
      [...snapshots].sort(
        (a, b) =>
          new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime(),
      ),
    [snapshots],
  );

  function updateField(key: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
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

  return (
    <section className="physical-dashboard">
      <section className="card physical-hero-card">
        <div>
          <span className="pill">Suivi physique</span>
          <h3>État courant du corps</h3>
          <p>
            Ajoute ton poids et tes mensurations à une date précise. Tous les
            champs sont optionnels sauf la date, pour importer facilement un
            historique déjà existant.
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
              <div key={field.key}>
                <span>{field.label}</span>
                <b>{formatValue(latest[field.key], field.unit)}</b>
                {previous && (
                  <small>{getDelta(latest[field.key], previous[field.key])}</small>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

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
                    {formatValue(snapshot.weightKg, "kg")} · ventre {formatValue(snapshot.waistCm, "cm")}
                  </span>
                </div>
                <button type="button" onClick={() => setForm(snapshotToForm(snapshot))}>
                  Modifier
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
