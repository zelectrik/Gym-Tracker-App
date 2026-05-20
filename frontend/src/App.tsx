import React, { useEffect, useMemo, useState } from "react";
import { api, authStore } from "./api";
import type {
  Exercise,
  ExerciseSide,
  MuscleGroup,
  Progress,
  SessionExercise,
  User,
  WorkoutSession,
  WorkoutTemplate,
} from "./types";
import "./styles.css";

const muscleGroups: MuscleGroup[] = [
  "CHEST",
  "BACK",
  "SHOULDERS",
  "BICEPS",
  "TRICEPS",
  "LEGS",
  "GLUTES",
  "ABS",
  "CARDIO",
  "FULL_BODY",
  "OTHER",
];

const sideLabels: Record<ExerciseSide, string> = {
  BOTH: "bilatéral",
  LEFT: "gauche",
  RIGHT: "droite",
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .me()
      .then(setUser)
      .catch(() => authStore.clear())
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="center">
        <div className="card">Chargement...</div>
      </main>
    );
  }

  if (!user) return <AuthScreen onAuth={setUser} />;

  return (
    <Shell
      user={user}
      onLogout={() => {
        authStore.clear();
        setUser(null);
      }}
    />
  );
}

function AuthScreen({ onAuth }: { onAuth: (user: User) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (mode === "register") {
        await api.register({ email, password, displayName });
      }
      const result = await api.login({ email, password });
      authStore.setToken(result.token);
      onAuth(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    }
  }

  return (
    <main className="auth-page">
      <section className="hero">
        <span className="pill">Gym Tracker</span>
        <h1>Connecte-toi pour créer, lancer et suivre tes entraînements.</h1>
        <p>
          Templates, séances rapides, séries, reps, charge, gauche/droite et
          progression.
        </p>
      </section>
      <form className="card auth-card" onSubmit={submit}>
        <div className="tabs">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
          >
            Connexion
          </button>
          <button
            type="button"
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
          >
            Créer un compte
          </button>
        </div>
        {mode === "register" && (
          <label>
            Nom affiché
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </label>
        )}
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Mot de passe
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="primary">
          {mode === "login" ? "Se connecter" : "Créer et se connecter"}
        </button>
      </form>
    </main>
  );
}

function Shell({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [page, setPage] = useState<"user" | "admin">(
    user.role === "SUPER_ADMIN" ? "admin" : "user",
  );

  return (
    <>
      <header className="topbar">
        <div>
          <strong>Gym Tracker</strong>
          <span>
            {user.displayName} · {user.role}
          </span>
        </div>
        <nav>
          <button
            className={page === "user" ? "active" : ""}
            onClick={() => setPage("user")}
          >
            Dashboard user
          </button>
          {user.role === "SUPER_ADMIN" && (
            <button
              className={page === "admin" ? "active" : ""}
              onClick={() => setPage("admin")}
            >
              Super admin
            </button>
          )}
          <button onClick={onLogout}>Déconnexion</button>
        </nav>
      </header>
      {page === "admin" ? <AdminDashboard /> : <UserDashboard user={user} />}
    </>
  );
}

function AdminDashboard() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>("CHEST");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  async function refresh() {
    setExercises(await api.exercises());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    await api.createExercise({
      name,
      muscleGroup,
      description: description || undefined,
    });
    setName("");
    setDescription("");
    setMessage("Exercice ajouté dans la base générale.");
    refresh();
  }

  return (
    <main className="layout">
      <section className="card">
        <h2>Super admin</h2>
        <p>
          Ajout des types d’exercices globaux utilisés par tous les
          utilisateurs.
        </p>
        <div className="stat">
          <b>{exercises.length}</b>
          <span>exercices en base</span>
        </div>
      </section>
      <section className="card">
        <h3>Ajouter un exercice</h3>
        <form onSubmit={add} className="grid-form">
          <label>
            Nom
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="presse à cuisses"
            />
          </label>
          <label>
            Groupe musculaire
            <select
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}
            >
              {muscleGroups.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </label>
          <label className="wide">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <button className="primary">Ajouter</button>
          {message && <p className="success">{message}</p>}
        </form>
      </section>
      <ExerciseList exercises={exercises} />
    </main>
  );
}

function UserDashboard({ user }: { user: User }) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
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

  async function launch(template: WorkoutTemplate) {
    const created = await api.createSession({
      title: template.name,
      templateId: template.id,
      exercises: template.exercises.map((e) => ({
        exerciseId: e.exerciseId,
        position: e.position,
        notes: e.notes ?? undefined,
      })),
    });
    await api.updateSessionStatus(created.id, "IN_PROGRESS");
    refresh();
  }

  return (
    <main className="layout">
      <section className="card dashboard-head">
        <div>
          <h2>Dashboard de {user.displayName}</h2>
          <p>
            Crée une séance rapide, lance un template, saisis tes séries et
            termine la séance.
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

      {active ? (
        <ActiveWorkout session={active} onRefresh={refresh} />
      ) : (
        <>
          <QuickWorkout exercises={exercises} onCreated={refresh} />
          <CreateTemplate exercises={exercises} onCreated={refresh} />
        </>
      )}

      {!active && (
        <section className="card">
          <h3>Lancer un entraînement enregistré</h3>
          <div className="cards">
            {templates.map((t) => (
              <article className="mini-card" key={t.id}>
                <h4>{t.name}</h4>
                <p>{t.exercises.length} exercices</p>
                <button className="primary" onClick={() => launch(t)}>
                  Lancer
                </button>
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

function QuickWorkout({
  exercises,
  onCreated,
}: {
  exercises: Exercise[];
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("Séance rapide");
  const [selected, setSelected] = useState<string[]>([]);
  const available = exercises.filter((exercise) => !selected.includes(exercise.id));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const created = await api.createSession({
      title,
      exercises: selected.map((exerciseId, index) => ({
        exerciseId,
        position: index + 1,
      })),
    });
    await api.updateSessionStatus(created.id, "IN_PROGRESS");
    setTitle("Séance rapide");
    setSelected([]);
    onCreated();
  }

  return (
    <section className="card quick-card">
      <div>
        <span className="pill">MVP rapide</span>
        <h3>Créer une séance rapide</h3>
        <p>
          Choisis quelques exercices et lance directement la séance, sans créer
          de template.
        </p>
      </div>
      <form onSubmit={submit} className="quick-form">
        <label>
          Nom
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label>
          Ajouter un exercice
          <select
            onChange={(e) => {
              if (e.target.value) setSelected([...selected, e.target.value]);
              e.currentTarget.value = "";
            }}
          >
            <option value="">Sélectionner...</option>
            {available.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name} · {exercise.muscleGroup}
              </option>
            ))}
          </select>
        </label>
        <div className="selected-chips">
          {selected.map((exerciseId, index) => {
            const exercise = exercises.find((item) => item.id === exerciseId);
            return (
              <button
                type="button"
                key={exerciseId}
                onClick={() => setSelected(selected.filter((id) => id !== exerciseId))}
              >
                {index + 1}. {exercise?.name} ✕
              </button>
            );
          })}
        </div>
        <button className="primary large-action" disabled={!selected.length}>
          Lancer la séance maintenant
        </button>
      </form>
    </section>
  );
}

function CreateTemplate({
  exercises,
  onCreated,
}: {
  exercises: Exercise[];
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<
    Array<{
      exerciseId: string;
      targetSets: number;
      targetReps: number;
      restSeconds: number;
    }>
  >([]);
  const available = exercises.filter(
    (e) => !selected.some((s) => s.exerciseId === e.id),
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await api.createTemplate({
      name,
      exercises: selected.map((s, index) => ({ ...s, position: index + 1 })),
    });
    setName("");
    setSelected([]);
    onCreated();
  }

  return (
    <details className="card details-card">
      <summary>Créer un entraînement enregistré</summary>
      <form onSubmit={submit}>
        <label>
          Nom de l'entraînement
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Jambes reprise genou"
          />
        </label>
        <div className="exercise-picker">
          <select
            onChange={(e) => {
              if (e.target.value) {
                setSelected([
                  ...selected,
                  {
                    exerciseId: e.target.value,
                    targetSets: 3,
                    targetReps: 10,
                    restSeconds: 90,
                  },
                ]);
              }
              e.currentTarget.value = "";
            }}
          >
            <option value="">Ajouter un exercice...</option>
            {available.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} · {ex.muscleGroup}
              </option>
            ))}
          </select>
        </div>
        <div className="template-lines">
          {selected.map((item, index) => {
            const ex = exercises.find((e) => e.id === item.exerciseId);
            return (
              <div className="line" key={item.exerciseId}>
                <b>
                  {index + 1}. {ex?.name}
                </b>
                <input
                  type="number"
                  min="1"
                  value={item.targetSets}
                  aria-label="Nombre de séries"
                  onChange={(e) =>
                    setSelected(
                      selected.map((s) =>
                        s.exerciseId === item.exerciseId
                          ? { ...s, targetSets: Number(e.target.value) }
                          : s,
                      ),
                    )
                  }
                />
                <input
                  type="number"
                  min="1"
                  value={item.targetReps}
                  aria-label="Nombre de répétitions"
                  onChange={(e) =>
                    setSelected(
                      selected.map((s) =>
                        s.exerciseId === item.exerciseId
                          ? { ...s, targetReps: Number(e.target.value) }
                          : s,
                      ),
                    )
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    setSelected(
                      selected.filter((s) => s.exerciseId !== item.exerciseId),
                    )
                  }
                >
                  Retirer
                </button>
              </div>
            );
          })}
        </div>
        <button className="primary" disabled={!selected.length}>
          Enregistrer l'entraînement
        </button>
      </form>
    </details>
  );
}

function ActiveWorkout({
  session,
  onRefresh,
}: {
  session: WorkoutSession;
  onRefresh: () => void;
}) {
  async function finish() {
    await api.updateSessionStatus(session.id, "COMPLETED");
    onRefresh();
  }

  return (
    <section className="card active-workout">
      <div className="section-title sticky-workout-head">
        <div>
          <span className="pill">Séance en cours</span>
          <h3>{session.title}</h3>
          <p>Renseigne reps, charge et côté gauche/droite si nécessaire.</p>
        </div>
        <button className="primary finish-button" onClick={finish}>
          Terminer
        </button>
      </div>
      {session.exercises.map((exercise) => (
        <ExerciseLogger
          key={exercise.id}
          exercise={exercise}
          onRefresh={onRefresh}
        />
      ))}
    </section>
  );
}

function ExerciseLogger({
  exercise,
  onRefresh,
}: {
  exercise: SessionExercise;
  onRefresh: () => void;
}) {
  const [reps, setReps] = useState(10);
  const [weightKg, setWeightKg] = useState(0);
  const [side, setSide] = useState<ExerciseSide>("BOTH");
  const nextSet = useMemo(() => {
    const setsForSide = exercise.sets.filter((set) => set.side === side);
    return (setsForSide.at(-1)?.setNumber ?? 0) + 1;
  }, [exercise.sets, side]);
  const lastSet = exercise.sets.at(-1);

  async function addSet(e: React.FormEvent) {
    e.preventDefault();
    await api.addSet(exercise.id, {
      setNumber: nextSet,
      side,
      reps,
      weightKg,
      completed: true,
    });
    onRefresh();
  }

  return (
    <article className="logger">
      <div className="logger-head">
        <div>
          <h4>{exercise.exercise.name}</h4>
          {lastSet && (
            <p>
              Dernière série : {sideLabels[lastSet.side]} · {lastSet.reps ?? 0} reps · {lastSet.weightKg ?? 0} kg
            </p>
          )}
        </div>
      </div>
      <div className="sets">
        {exercise.sets.map((set) => (
          <span key={set.id}>
            S{set.setNumber} {sideLabels[set.side]} : {set.reps ?? 0} reps · {set.weightKg ?? 0} kg
          </span>
        ))}
      </div>
      <form onSubmit={addSet} className="set-form">
        <label>
          Reps
          <input
            type="number"
            min="1"
            inputMode="numeric"
            value={reps}
            onChange={(e) => setReps(Number(e.target.value))}
          />
        </label>
        <label>
          Charge kg
          <input
            type="number"
            min="0"
            step="0.5"
            inputMode="decimal"
            value={weightKg}
            onChange={(e) => setWeightKg(Number(e.target.value))}
          />
        </label>
        <label>
          Côté
          <select value={side} onChange={(e) => setSide(e.target.value as ExerciseSide)}>
            <option value="BOTH">bilatéral</option>
            <option value="LEFT">gauche</option>
            <option value="RIGHT">droite</option>
          </select>
        </label>
        <button className="large-action">Valider S{nextSet}</button>
      </form>
    </article>
  );
}

function ExerciseList({ exercises }: { exercises: Exercise[] }) {
  return (
    <section className="card">
      <h3>Exercices disponibles</h3>
      <div className="exercise-list">
        {exercises.map((ex) => (
          <div key={ex.id}>
            <b>{ex.name}</b>
            <span>{ex.muscleGroup}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
