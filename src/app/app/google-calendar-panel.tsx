"use client";
import { useEffect, useState } from "react";

type Status = { enabled: boolean; connected: boolean; canConnect: boolean };
const endpoint = "/api/google-calendar/";
export default function GoogleCalendarPanel({ dirty }: { dirty: boolean }) {
  const [status, setStatus] = useState<Status>();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(endpoint + "status")
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const status = (await response.json()) as Status;
        if (cancelled) return;
        setStatus(status);
        const result = new URLSearchParams(location.search).get("calendar");
        if (result)
          setMessage(
            result === "connected"
              ? "Cont conectat. Apasă Sincronizează pentru a trimite programările."
              : "Conectarea nu a fost finalizată. Verifică setările Google și încearcă din nou.",
          );
      })
      .catch(() => {
        if (!cancelled)
          setMessage("Starea Google Calendar nu este disponibilă.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function act(action: "connect" | "sync" | "disconnect") {
    if (
      action === "disconnect" &&
      !confirm(
        "Deconectezi contul? Evenimentele exportate rămân în calendarul Google.",
      )
    )
      return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(endpoint + action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error ?? "Operația nu a reușit.");
      if (action === "connect") location.assign(result.url);
      if (action === "sync")
        setMessage(
          `Sincronizare terminată. ${result.count} programări în selecția curentă.`,
        );
      if (action === "disconnect") {
        setStatus((value) => value && { ...value, connected: false });
        setMessage("Cont deconectat de la Idee.Shop.");
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Operația nu a reușit.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="google-calendar-panel" aria-label="Google Calendar">
      <h2>Google Calendar</h2>
      <p>
        Trimite titlul și intervalul programărilor într-un calendar separat
        „Idee.Shop”. Modifică programările aici, apoi sincronizează din nou.
      </p>
      {status && !status.enabled && (
        <p>Conectarea Google Calendar necesită configurarea OAuth.</p>
      )}
      {status?.enabled &&
        !status.connected &&
        (status.canConnect ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void act("connect")}
          >
            Conectează Google Calendar
          </button>
        ) : (
          <p>
            Pentru prima conectare, deschide Idee.Shop de la adresa configurată
            pe Mac.
          </p>
        ))}
      {status?.connected && (
        <div className="task-toolbar">
          <button
            type="button"
            className="primary"
            disabled={busy || dirty || !status.enabled}
            onClick={() => void act("sync")}
          >
            Sincronizează
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void act("disconnect")}
          >
            Deconectează
          </button>
        </div>
      )}
      <p role="status">{busy ? "Se procesează…" : message}</p>
    </section>
  );
}
