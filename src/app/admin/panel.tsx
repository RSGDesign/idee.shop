"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { User } from "@/server/accounts";
import type { Store } from "@/lib/model";
import { totals, ideaTime, formatDuration } from "@/lib/model";
import { LogoutButton } from "@/app/app/access-gate";
import styles from "./panel.module.css";
type Managed = User & {
  sessions: number;
  workspace: { store: Store; revision: number };
};
type Event = {
  id: number;
  action: string;
  target_id: number | null;
  created_at: string;
  actor: string;
};
const money = (cents: number) =>
  new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON" }).format(
    cents / 100,
  );
export default function AdminPanel() {
  const [users, setUsers] = useState<Managed[]>([]),
    [events, setEvents] = useState<Event[]>([]),
    [selected, setSelected] = useState<number | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [ready, setReady] = useState(false);
  const load = useCallback(async () => {
    const result = await fetch("/api/admin", { cache: "no-store" });
    const data = await result.json();
    if (!result.ok) throw new Error(data.error);
    setUsers(data.users);
    setEvents(data.events);
    setReady(true);
  }, []);
  useEffect(() => {
    // Initial asynchronous API load; no synchronous rendering state is derived here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load().catch((e) => setMessage(e.message));
  }, [load]);
  const user = users.find((u) => u.id === selected);
  const ideas = users.flatMap((u) => u.workspace.store.ideas),
    sums = ideas.map(totals);
  async function action(input: Record<string, unknown>) {
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setMessage(
        data.file
          ? `Copie de siguranță creată: ${data.file}`
          : "Modificarea a fost salvată.",
      );
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Operația a eșuat.");
    } finally {
      setBusy(false);
    }
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            {
              users: users.map((u) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                active: u.active,
                store: u.workspace.store,
              })),
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "idee-shop-administrare.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className="eyebrow">IDEE.SHOP · ADMINISTRARE</p>
          <h1>O privire asupra întregii aplicații.</h1>
        </div>
        <nav className={styles.nav}>
          <Link href="/app">Spațiul meu</Link>
          <Link href="/">Site</Link>
          <LogoutButton />
        </nav>
      </header>
      <p role="status" aria-live="polite" className={styles.message}>
        {message}
      </p>
      {!ready ? (
        <p>Se încarcă administrarea…</p>
      ) : (
        <>
          <section className={styles.stats} aria-label="Statistici">
            {[
              ["Utilizatori", users.length],
              ["Idei", ideas.length],
              ["Venituri", money(sums.reduce((n, t) => n + t.income, 0))],
              ["Profit", money(sums.reduce((n, t) => n + t.profit, 0))],
            ].map(([label, value]) => (
              <div key={label}>
                <p>{label}</p>
                <strong>{value}</strong>
              </div>
            ))}
          </section>
          <div className={styles.actions}>
            <button
              disabled={busy}
              onClick={() => {
                if (
                  confirm(
                    "Creezi o copie de siguranță a întregii baze de date?",
                  )
                )
                  void action({ action: "backup" });
              }}
            >
              Creează copie de siguranță
            </button>
            <button onClick={download}>
              Exportă utilizatorii și colecțiile
            </button>
            <button
              onClick={() => void load().catch((e) => setMessage(e.message))}
            >
              Actualizează
            </button>
          </div>
          <section>
            <h2>Utilizatori și acces</h2>
            <div className={styles.table}>
              <table>
                <thead>
                  <tr>
                    <th>Nume / email</th>
                    <th>Rol</th>
                    <th>Stare</th>
                    <th>Idei</th>
                    <th>Sesiuni</th>
                    <th>Acțiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <b>{u.name}</b>
                        <br />
                        {u.email}
                      </td>
                      <td>
                        {u.role === "admin" ? "Administrator" : "Utilizator"}
                      </td>
                      <td>{u.active ? "Activ" : "Blocat"}</td>
                      <td>{u.workspace.store.ideas.length}</td>
                      <td>{u.sessions}</td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            disabled={busy}
                            onClick={() => setSelected(u.id)}
                          >
                            Detalii
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => {
                              if (confirm(`Schimbi rolul pentru ${u.name}?`))
                                void action({
                                  action: "role",
                                  userId: u.id,
                                  role: u.role === "admin" ? "user" : "admin",
                                });
                            }}
                          >
                            {u.role === "admin"
                              ? "Retrage rolul de administrator"
                              : "Fă administrator"}
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => {
                              if (
                                confirm(
                                  `${u.active ? "Blochezi" : "Reactivezi"} accesul pentru ${u.name}? Datele sunt păstrate.`,
                                )
                              )
                                void action({
                                  action: "active",
                                  userId: u.id,
                                  active: !u.active,
                                });
                            }}
                          >
                            {u.active ? "Blochează" : "Reactivează"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          {user && (
            <section className={styles.detail}>
              <h2>{user.name} · colecție și securitate</h2>
              <p>
                {user.email} · creat la{" "}
                {new Date(user.createdAt).toLocaleDateString("ro-RO")}
              </p>
              <div className={styles.actions}>
                <Link href={`/app?userId=${user.id}`}>
                  Deschide și editează colecția →
                </Link>
                <button
                  disabled={busy}
                  onClick={() => {
                    if (confirm(`Închizi toate sesiunile pentru ${user.name}?`))
                      void action({ action: "revoke", userId: user.id });
                  }}
                >
                  Închide toate sesiunile
                </button>
              </div>
              <details>
                <summary>Resetează parola utilizatorului</summary>
                <p>
                  Parola existentă nu poate fi afișată. Alegerea unei parole noi
                  va închide toate sesiunile acestui cont.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget,
                      d = new FormData(form);
                    if (d.get("password") !== d.get("confirmation")) {
                      setMessage("Confirmarea nu coincide cu parola.");
                      return;
                    }
                    if (confirm(`Resetezi parola pentru ${user.name}?`)) {
                      void action({
                        action: "password",
                        userId: user.id,
                        password: d.get("password"),
                      });
                      form.reset();
                    }
                  }}
                >
                  <label>
                    Parolă nouă
                    <input
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={1024}
                      required
                    />
                  </label>
                  <label>
                    Confirmă parola
                    <input
                      name="confirmation"
                      type="password"
                      autoComplete="new-password"
                      required
                    />
                  </label>
                  <button disabled={busy}>Salvează parola nouă</button>
                </form>
              </details>
              <h3>Idei, task-uri, note și bani</h3>
              {!user.workspace.store.ideas.length && (
                <p>Nu există idei în această colecție.</p>
              )}
              {user.workspace.store.ideas.map((i) => (
                <article className={styles.idea} key={i.id}>
                  <h4>
                    {i.title} · {i.status}
                  </h4>
                  <p>{i.description}</p>
                  <p>
                    Potențial: {i.potential || "Nespecificat"} · Obiectiv:{" "}
                    {money(i.goalCents)} · Profit: {money(totals(i).profit)}
                  </p>
                  <p>
                    Estimat: {formatDuration(ideaTime(i).estimated)} · Efectiv:{" "}
                    {formatDuration(ideaTime(i).actual)}
                  </p>
                  <p className={styles.note}>{i.notes}</p>
                  <ul>
                    {i.tasks.map((t) => (
                      <li key={t.id}>
                        {t.done ? "✓" : "○"} {t.title} · Estimat:{" "}
                        {formatDuration(t.estimatedMinutes)} · Efectiv:{" "}
                        {formatDuration(t.actualMinutes)}
                      </li>
                    ))}
                  </ul>
                  <ul>
                    {i.entries.map((t) => (
                      <li key={t.id}>
                        {t.date} · {t.label} · {t.kind === "income" ? "+" : "−"}
                        {money(t.cents)}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </section>
          )}
          <section>
            <h2>Activitate administrativă</h2>
            <ul>
              {events.map((e) => (
                <li key={e.id}>
                  {e.created_at} · {e.actor} ·{" "}
                  {(
                    {
                      backup: "Backup creat",
                      role: "Rol modificat",
                      active: "Stare cont modificată",
                      revoke: "Sesiuni închise",
                      "reset-password": "Parolă resetată",
                      "configure-admin": "Administrator configurat",
                      "update-workspace": "Colecție actualizată",
                    } as Record<string, string>
                  )[e.action] || e.action}
                  {e.target_id ? ` · utilizator #${e.target_id}` : ""}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
