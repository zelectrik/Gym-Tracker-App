import { useState } from "react";
import { api } from "../api";
import type { ImportProgramPayload } from "../types";

export function ImportProgramJson({ onImported }: { onImported: () => void }) {
  const [json, setJson] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    setMessage("");
    setError("");
    setIsImporting(true);

    try {
      const parsed = JSON.parse(json) as ImportProgramPayload;

      const result = await api.importProgramTemplates(parsed);

      setMessage(`${result.importedCount} programme(s) importé(s).`);

      setJson("");
      setIsOpen(false);

      onImported();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "JSON invalide ou import impossible",
      );
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <section className="card import-card">
      <div className="section-title">
        <div>
          <span className="pill">Import rapide</span>

          <h3>Créer mes programmes depuis un JSON</h3>

          <p>
            Colle un fichier contenant une clé <code>program</code>.
          </p>
        </div>

        <button type="button" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? "Fermer" : "Importer JSON"}
        </button>
      </div>

      {message && <p className="success">{message}</p>}

      {error && <p className="error">{error}</p>}

      {isOpen && (
        <form onSubmit={submit} className="import-form">
          <label>
            Programme JSON
            <textarea
              value={json}
              onChange={(e) => setJson(e.target.value)}
              placeholder='{ "program": [] }'
              required
            />
          </label>

          <button className="primary large-action" disabled={isImporting}>
            {isImporting ? "Import..." : "Importer mes programmes"}
          </button>
        </form>
      )}
    </section>
  );
}
