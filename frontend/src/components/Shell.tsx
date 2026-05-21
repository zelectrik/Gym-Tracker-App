import { useState } from "react";
import type { User } from "../types";
import { AdminDashboard } from "./AdminDashboard";
import { UserDashboard } from "./UserDashboard";

export function Shell({
  user,
  onLogout,
  isWorkoutFocus,
}: {
  user: User;
  onLogout: () => void;
  isWorkoutFocus?: boolean;
}) {
  const [page, setPage] = useState<"user" | "admin">(
    user.role === "SUPER_ADMIN" ? "admin" : "user",
  );

  return (
    <>
      {!isWorkoutFocus && (
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
      )}

      {page === "admin" ? <AdminDashboard /> : <UserDashboard user={user} />}
    </>
  );
}
