import React, { useEffect, useMemo, useState } from "react";
import { api, authStore } from "./api";
import { ExerciseList } from "./components/ExerciseList";
import { UserDashboard } from "./components/UserDashboard";
import type { Exercise, MuscleGroup, User } from "./types";
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
