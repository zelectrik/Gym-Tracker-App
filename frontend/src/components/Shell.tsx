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
        <header className="topbar app-topbar-v2">
          {user.role === "SUPER_ADMIN" && (
            <button
              className={page === "admin" ? "active" : ""}
              onClick={() => setPage(page === "admin" ? "user" : "admin")}
            >
              {page === "admin" ? "Dashboard" : "Admin"}
            </button>
          )}
          <button onClick={onLogout}>Déconnexion</button>
        </header>
      )}

      {page === "admin" ? <AdminDashboard /> : <UserDashboard user={user} />}
    </>
  );
}
