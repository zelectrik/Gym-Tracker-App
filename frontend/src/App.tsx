import React, { useEffect, useMemo, useState } from "react";
import { api, authStore } from "./api";
import { modeLabels } from "./utils/workoutLabels";
import { ExerciseList } from "./components/ExerciseList";
import { ExerciseTable } from "./components/ExerciseTable";
import { ActiveWorkout } from "./components/ActiveWorkout";
import { ImportProgramJson } from "./components/ImportProgramJson";
import type {
  Exercise,
  ExerciseSide,
  ImportProgramPayload,
  ExecutionMode,
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
  "UPPER_CHEST",
  "BACK",
  "LATS",
  "TRAPS",
  "SHOULDERS",
  "FRONT_SHOULDERS",
  "REAR_SHOULDERS",
  "BICEPS",
  "TRICEPS",
  "FOREARMS",
  "ABS",
  "OBLIQUES",
  "LOWER_BACK",
  "QUADS",
  "HAMSTRINGS",
  "GLUTES",
  "CALVES",
  "ADDUCTORS",
  "ABDUCTORS",
  "CARDIO",
  "CORE",
  "FULL_BODY",
];

type PlannedExerciseDraft = {
  exerciseId: string;
  targetSets: number;
  targetReps: number;
  executionMode: ExecutionMode;
  targetWeightKg: number;
  leftWeightKg: number;
  rightWeightKg: number;
  restSeconds: number;
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
          Plans d'entraînement, séries préremplies, gauche/droite, charges,
          historique et progression.
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
            Crée un plan, lance une séance, choisis l’exercice dispo en salle et
            valide les lignes préremplies.
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
          <ImportProgramJson onImported={refresh} />
          <CreateTemplate exercises={exercises} onCreated={refresh} />
        </>
      )}

      {!active && (
        <section className="card">
          <h3>Lancer un entraînement enregistré</h3>
          <div className="cards">
            {templates.map((template) => (
              <article className="mini-card" key={template.id}>
                <h4>{template.name}</h4>
                <p>{template.exercises.length} exercices planifiés</p>
                <ul className="template-summary">
                  {template.exercises.slice(0, 4).map((item) => (
                    <li key={item.id}>
                      {item.position}. {item.exercise.name} · {item.targetSets}×
                      {item.targetReps ?? "?"} ·{" "}
                      {modeLabels[item.executionMode]}
                    </li>
                  ))}
                </ul>
                <button className="primary" onClick={() => launch(template)}>
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

function CreateTemplate({
  exercises,
  onCreated,
}: {
  exercises: Exercise[];
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<PlannedExerciseDraft[]>([]);
  const available = exercises.filter(
    (exercise) => !selected.some((item) => item.exerciseId === exercise.id),
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await api.createTemplate({
      name,
      exercises: selected.map((item, index) => ({
        exerciseId: item.exerciseId,
        position: index + 1,
        targetSets: item.targetSets,
        targetReps: item.targetReps,
        restSeconds: item.restSeconds,
        executionMode: item.executionMode,
        targetWeightKg:
          item.executionMode === "BILATERAL" ? item.targetWeightKg : undefined,
        leftWeightKg:
          item.executionMode === "LEFT_RIGHT" ? item.leftWeightKg : undefined,
        rightWeightKg:
          item.executionMode === "LEFT_RIGHT" ? item.rightWeightKg : undefined,
      })),
    });
    setName("");
    setSelected([]);
    onCreated();
  }

  return (
    <section className="card">
      <div className="section-title">
        <div>
          <span className="pill">V1 MVP</span>
          <h3>Créer un entraînement planifié</h3>
          <p>
            Définis les exercices, séries, reps, charges et le mode bilatéral ou
            gauche/droite. L’ordre reste indicatif : pendant la séance tu
            choisis l’exercice disponible.
          </p>
        </div>
      </div>
      <form onSubmit={submit} className="template-builder">
        <label>
          Nom de l'entraînement
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Jambes reprise genou"
          />
        </label>
        <label>
          Ajouter un exercice
          <select
            onChange={(e) => {
              if (e.target.value) {
                setSelected([
                  ...selected,
                  {
                    exerciseId: e.target.value,
                    targetSets: 3,
                    targetReps: 10,
                    executionMode: "BILATERAL",
                    targetWeightKg: 0,
                    leftWeightKg: 0,
                    rightWeightKg: 0,
                    restSeconds: 90,
                  },
                ]);
              }
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

        <div className="planned-exercises">
          {selected.map((item, index) => {
            const exercise = exercises.find(
              (candidate) => candidate.id === item.exerciseId,
            );
            return (
              <article className="planned-line" key={item.exerciseId}>
                <div className="planned-title">
                  <b>
                    {index + 1}. {exercise?.name}
                  </b>
                  <button
                    type="button"
                    onClick={() =>
                      setSelected(
                        selected.filter(
                          (candidate) =>
                            candidate.exerciseId !== item.exerciseId,
                        ),
                      )
                    }
                  >
                    Retirer
                  </button>
                </div>
                <div className="planned-grid">
                  <label>
                    Séries
                    <input
                      type="number"
                      min="1"
                      value={item.targetSets}
                      onChange={(e) =>
                        updateDraft(selected, setSelected, item.exerciseId, {
                          targetSets: Number(e.target.value),
                        })
                      }
                    />
                  </label>
                  <label>
                    Reps
                    <input
                      type="number"
                      min="1"
                      value={item.targetReps}
                      onChange={(e) =>
                        updateDraft(selected, setSelected, item.exerciseId, {
                          targetReps: Number(e.target.value),
                        })
                      }
                    />
                  </label>
                  <label>
                    Mode
                    <select
                      value={item.executionMode}
                      onChange={(e) =>
                        updateDraft(selected, setSelected, item.exerciseId, {
                          executionMode: e.target.value as ExecutionMode,
                        })
                      }
                    >
                      <option value="BILATERAL">bilatéral</option>
                      <option value="LEFT_RIGHT">gauche puis droite</option>
                    </select>
                  </label>
                  {item.executionMode === "BILATERAL" ? (
                    <label>
                      Poids kg
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={item.targetWeightKg}
                        onChange={(e) =>
                          updateDraft(selected, setSelected, item.exerciseId, {
                            targetWeightKg: Number(e.target.value),
                          })
                        }
                      />
                    </label>
                  ) : (
                    <>
                      <label>
                        Poids gauche kg
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={item.leftWeightKg}
                          onChange={(e) =>
                            updateDraft(
                              selected,
                              setSelected,
                              item.exerciseId,
                              { leftWeightKg: Number(e.target.value) },
                            )
                          }
                        />
                      </label>
                      <label>
                        Poids droite kg
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={item.rightWeightKg}
                          onChange={(e) =>
                            updateDraft(
                              selected,
                              setSelected,
                              item.exerciseId,
                              { rightWeightKg: Number(e.target.value) },
                            )
                          }
                        />
                      </label>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <button className="primary large-action" disabled={!selected.length}>
          Enregistrer l'entraînement
        </button>
      </form>
    </section>
  );
}

function updateDraft(
  selected: PlannedExerciseDraft[],
  setSelected: React.Dispatch<React.SetStateAction<PlannedExerciseDraft[]>>,
  exerciseId: string,
  patch: Partial<PlannedExerciseDraft>,
) {
  setSelected(
    selected.map((item) =>
      item.exerciseId === exerciseId ? { ...item, ...patch } : item,
    ),
  );
}
