"use client";
import Link from "next/link";
import IdeaPages from "./idea-pages";
import TaskFilters from "./task-filters";
import {
  DEFAULT_TASK_VIEW,
  hasTaskFilters,
  visibleTasks,
} from "@/lib/task-view";
import Reorder from "./reorder";
import TaskSteps from "./task-steps";
import TimeEditor from "./time-editor";
import WorkTimer from "./work-timer";
import StatusBoard from "./status-board";
import { useSearchParams } from "next/navigation";
import GoogleCalendarPanel from "./google-calendar-panel";
import CalendarView from "./calendar-view";
import { LogoutButton } from "./access-gate";
import ThemeToggle from "../theme-toggle";
import { useState } from "react";
import { useWorkspace } from "@/lib/useWorkspace";
import {
  newIdea,
  ideaTime,
  formatDuration,
  parseStore,
  totals,
  amountToCents,
  calculateBreakEven,
  getItemSlots,
  TASK_PRIORITIES,
  validRecurrence,
  type Recurrence,
  type Occurrence,
  type Task,
  type Idea,
  workSummary,
  MAX_TIME_MINUTES,
} from "@/lib/model";
const money = (c: number) =>
  new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON" }).format(
    c / 100,
  );
const sections = ["Task-uri", "Detalii", "Pagini și note", "Finanțe"] as const;

export default function Home() {
  const {
    store,
    owner,
    ready,
    error,
    setError,
    locked,
    save,
    persist,
    retry,
    pending,
    notice,
    legacyRaw,
  } = useWorkspace();
  const [selected, setSelectedId] = useState("");
  const [section, setSection] = useState<(typeof sections)[number]>("Task-uri");
  const [taskView, setTaskView] = useState(DEFAULT_TASK_VIEW);
  function setSelected(id: string) {
    setTaskView(DEFAULT_TASK_VIEW);
    setSelectedId(id);
    setSection("Task-uri");
  }
  const searchParams = useSearchParams();
  const [view, setView] = useState(
    searchParams.has("calendar") ? "Calendar" : "Toate ideile",
  );
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Toate");
  const idea = store.ideas.find((i) => i.id === selected);
  const shownTasks = idea ? visibleTasks(idea.tasks, taskView) : [];
  const manualTasks = taskView.sort === "manual" && !hasTaskFilters(taskView);

  const categories = Array.from(
    new Set(
      store.ideas
        .map((i) => i.category?.trim())
        .filter((c): c is string => Boolean(c)),
    ),
  );

  function update(patch: Partial<Idea>) {
    if (idea)
      save({
        ...store,
        ideas: store.ideas.map((i) =>
          i.id === idea.id ? { ...i, ...patch } : i,
        ),
      });
  }
  function updateTask(id: string, patch: Partial<Task>) {
    if (idea)
      update({
        tasks: idea.tasks.map((task) =>
          task.id === id ? { ...task, ...patch } : task,
        ),
      });
  }
  const completedTasks = idea?.tasks.filter((task) => task.done).length ?? 0;
  function updateOccurrence(
    ideaId: string,
    taskId: string,
    occurrence: string,
    patch: Occurrence,
  ) {
    if (locked) return;
    save({
      ...store,
      ideas: store.ideas.map((item) =>
        item.id !== ideaId
          ? item
          : {
              ...item,
              tasks: item.tasks.map((task) => {
                const rule = task.recurrence;
                if (task.id !== taskId || !rule) return task;
                return {
                  ...task,
                  recurrence: {
                    ...rule,
                    exceptions: {
                      ...rule.exceptions,
                      [occurrence]: {
                        ...rule.exceptions[occurrence],
                        ...patch,
                      },
                    },
                  },
                };
              }),
            },
      ),
    });
  }
  const taskPercent = idea?.tasks.length
    ? Math.round((completedTasks * 100) / idea.tasks.length)
    : 0;
  function download(raw: string) {
    const url = URL.createObjectURL(
      new Blob([raw], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `idee-shop-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  const all = store.ideas.map(totals);
  const work = workSummary(store);
  const filtered = store.ideas.filter(
    (i) =>
      (view !== "Frigider" || i.pinned) &&
      (selectedCategory === "Toate" || i.category === selectedCategory) &&
      `${i.title} ${i.description} ${i.category || ""}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  const navIcons: Record<string, string> = {
    "Toate ideile": "◉",
    "Pe stadii": "☷",
    Calendar: "📅",
    Frigider: "▦",
  };

  return (
    <div className="shell workspace">
      <aside>
        <Link className="brand" href="/">
          idee<span>.shop</span>
        </Link>
        <Link className="back-to-site" href="/">
          ← Înapoi la site
        </Link>
        <p className="eyebrow">SPAȚIUL MEU</p>
        <nav aria-label="Vizualizări">
          {["Toate ideile", "Pe stadii", "Calendar", "Frigider"].map((v) => (
            <button
              key={v}
              className={!idea && view === v ? "active" : ""}
              aria-current={!idea && view === v ? "page" : undefined}
              onClick={() => {
                setView(v);
                setSelected("");
              }}
            >
              <span aria-hidden="true">{navIcons[v]}</span> {v}
            </button>
          ))}
        </nav>
        {store.ideas.some((item) => item.pinned) && (
          <details className="workspace-pinned" open>
            <summary>Idei fixate</summary>
            <nav aria-label="Idei fixate">
              {store.ideas
                .filter((item) => item.pinned)
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-current={selected === item.id ? "page" : undefined}
                    className={selected === item.id ? "active" : ""}
                    onClick={() => setSelected(item.id)}
                  >
                    {item.title}
                  </button>
                ))}
            </nav>
          </details>
        )}
        <div className="workspace-settings">
          <ThemeToggle />
          <LogoutButton />
          <details className="local">
            <summary>Copii de siguranță</summary>
            <b>● Salvare automată</b>
            <p>
              Modificările sunt salvate automat. Exportă periodic o copie de
              siguranță.
            </p>
            <button
              disabled={!ready}
              onClick={() => {
                try {
                  download(JSON.stringify(store, null, 2));
                } catch {
                  setError("Exportul nu este disponibil.");
                }
              }}
            >
              ↓ Exportă backup
            </button>
            <label className="import">
              ↑ Importă backup
              <input
                type="file"
                accept="application/json"
                disabled={!ready}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    if (f.size > 5000000)
                      throw new Error("Fișier prea mare (maximum 5 MB).");
                    const next = parseStore(await f.text());
                    if (
                      confirm(
                        "Importul înlocuiește toate datele curente. Ai exportat un backup?",
                      )
                    ) {
                      await persist(next);
                      setSelected("");
                      setError("");
                    }
                  } catch (err) {
                    setError(
                      err instanceof Error ? err.message : "Import eșuat.",
                    );
                  }
                  e.target.value = "";
                }}
              />
            </label>
          </details>
        </div>
      </aside>
      <main>
        {owner && (
          <p className="admin-shortcut">
            Colecția lui {owner} ·{" "}
            <Link href="/admin">Înapoi la administrare</Link>
          </p>
        )}
        <p className="workspace-save" role="status" aria-live="polite">
          {pending
            ? "Se salvează…"
            : locked
              ? "Salvarea este oprită"
              : "Toate modificările sunt salvate"}
        </p>
        {notice && <p role="status">{notice}</p>}
        {legacyRaw && (
          <button type="button" onClick={() => download(legacyRaw)}>
            Exportă copia anterioară din browser
          </button>
        )}
        {locked && ready && (
          <button type="button" onClick={() => void retry()}>
            Reîncearcă salvarea
          </button>
        )}
        <header className="workspace-header">
          <div>
            {idea && (
              <button
                className="workspace-back"
                type="button"
                onClick={() => setSelected("")}
              >
                ← {view}
              </button>
            )}
            <h1>
              {idea
                ? idea.title
                : view === "Frigider"
                  ? "Frigiderul cu idei"
                  : view}
            </h1>
          </div>
          {idea && (
            <fieldset className="idea-top-timer" disabled={locked}>
              <WorkTimer
                key={idea.id}
                label="Timp de lucru pe idee"
                onAddMinutes={(minutes) => {
                  const actualMinutes = (idea.actualMinutes ?? 0) + minutes;
                  if (locked || actualMinutes > MAX_TIME_MINUTES) {
                    setError(
                      "Sesiunea nu poate fi adăugată. Verifică limita timpului salvat.",
                    );
                    return false;
                  }
                  update({ actualMinutes });
                  return true;
                }}
              />
            </fieldset>
          )}
        </header>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {!ready ? (
          <p>Se încarcă spațiul tău…</p>
        ) : (
          <>
            {!idea && view === "Toate ideile" && (
              <section className="stats" aria-label="Sumar colecție">
                {[
                  ["Idei în colecție", store.ideas.length],
                  ["Timp total lucrat", formatDuration(work.minutes)],
                  ["Valoarea timpului", money(work.valueCents)],
                  ["Venituri", money(all.reduce((s, t) => s + t.income, 0))],
                  ["Cheltuieli", money(all.reduce((s, t) => s + t.expense, 0))],
                  [
                    "Profit total",
                    money(all.reduce((s, t) => s + t.profit, 0)),
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p>{label}</p>
                    <strong>{value}</strong>
                  </div>
                ))}
                <form
                  className="hourly-rate"
                  key={work.hourlyRateCents}
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (locked) return;
                    try {
                      const hourlyRateCents = amountToCents(
                        String(new FormData(event.currentTarget).get("rate")),
                      );
                      save({ ...store, hourlyRateCents });
                      setError("");
                    } catch (err) {
                      setError(
                        err instanceof Error ? err.message : "Tarif invalid.",
                      );
                    }
                  }}
                >
                  <label>
                    Tarif orar (RON/oră)
                    <input
                      name="rate"
                      inputMode="decimal"
                      required
                      disabled={locked}
                      defaultValue={(work.hourlyRateCents / 100)
                        .toFixed(2)
                        .replace(".", ",")}
                    />
                  </label>
                  <button type="submit" disabled={locked}>
                    Salvează tariful
                  </button>
                  <p className="time-help">
                    Valoarea se calculează din timpul efectiv înregistrat și
                    tariful curent.
                  </p>
                </form>
              </section>
            )}
            {idea ? (
              <section className="detail">
                <div
                  className="workspace-sections"
                  role="group"
                  aria-label="Secțiunile ideii"
                >
                  {sections.map((label) => (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={section === label}
                      onClick={() => setSection(label)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <fieldset disabled={locked}>
                  <div hidden={section !== "Detalii"}>
                    <div className="fields">
                      <label>
                        Titlu
                        <input
                          maxLength={200}
                          value={idea.title}
                          onChange={(e) => {
                            if (e.target.value.trim())
                              update({ title: e.target.value });
                          }}
                        />
                      </label>
                      <label>
                        Stadiu
                        <select
                          value={idea.status}
                          onChange={(e) =>
                            update({ status: e.target.value as Idea["status"] })
                          }
                        >
                          {["Nouă", "În lucru", "Validată", "Arhivată"].map(
                            (s) => (
                              <option key={s}>{s}</option>
                            ),
                          )}
                        </select>
                      </label>
                    </div>
                    <div className="fields">
                      <label>
                        Categorie
                        <input
                          list="preset-categories"
                          placeholder="ex: E-commerce, Servicii, Atelier…"
                          maxLength={100}
                          value={idea.category || ""}
                          onChange={(e) => update({ category: e.target.value })}
                        />
                        <datalist id="preset-categories">
                          <option value="E-commerce" />
                          <option value="Servicii" />
                          <option value="Atelier" />
                          <option value="Digital" />
                          <option value="SaaS" />
                          <option value="Personal" />
                        </datalist>
                      </label>
                      <div className="schedule-slots-field">
                        <label>
                          Programări în calendar ({getItemSlots(idea).length})
                        </label>
                        <div className="slots-list">
                          {getItemSlots(idea).map((slot) => (
                            <span key={slot.id} className="slot-pill">
                              📅 {slot.date}{" "}
                              {slot.time ? `la ${slot.time}` : ""}
                              <button
                                type="button"
                                className="remove-slot-btn"
                                title="Șterge această programare"
                                onClick={() => {
                                  const remaining = getItemSlots(idea).filter(
                                    (s) => s.id !== slot.id,
                                  );
                                  update({
                                    schedule: remaining,
                                    scheduledDate: null,
                                  });
                                }}
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                        <form
                          className="add-slot-form inline"
                          onSubmit={(e) => {
                            e.preventDefault();
                            const f = e.currentTarget;
                            const d = new FormData(f);
                            const date = String(d.get("date")).trim();
                            const time = String(d.get("time")).trim() || null;
                            if (date) {
                              const newSlot = {
                                id: crypto.randomUUID(),
                                date,
                                time,
                              };
                              update({
                                schedule: [...getItemSlots(idea), newSlot],
                                scheduledDate: null,
                              });
                              f.reset();
                            }
                          }}
                        >
                          <input
                            type="date"
                            name="date"
                            required
                            defaultValue={new Date().toLocaleDateString(
                              "en-CA",
                            )}
                          />
                          <input type="time" name="time" />
                          <button type="submit">+ Adaugă dată</button>
                        </form>
                      </div>
                    </div>
                    <label>
                      Descriere
                      <textarea
                        value={idea.description}
                        onChange={(e) =>
                          update({ description: e.target.value })
                        }
                      />
                    </label>
                    <div className="fields">
                      <label>
                        Potențial estimat
                        <input
                          value={idea.potential}
                          placeholder="De ce merită explorată?"
                          onChange={(e) =>
                            update({ potential: e.target.value })
                          }
                        />
                      </label>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          try {
                            update({
                              goalCents: amountToCents(
                                String(
                                  new FormData(e.currentTarget).get("goal"),
                                ),
                              ),
                            });
                          } catch (err) {
                            setError((err as Error).message);
                          }
                        }}
                      >
                        <label>
                          Obiectiv de venit (RON)
                          <input
                            name="goal"
                            key={`${idea.id}-${idea.goalCents}`}
                            defaultValue={idea.goalCents / 100}
                            inputMode="decimal"
                            required
                          />
                        </label>
                        <button>Salvează obiectivul</button>
                      </form>
                    </div>
                    <p>
                      Obiectiv: {money(totals(idea).income)} /{" "}
                      {money(idea.goalCents)}{" "}
                      {idea.goalCents > 0 &&
                        `(${Math.round((totals(idea).income / idea.goalCents) * 100)}%)`}
                    </p>
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={idea.pinned}
                        onChange={(e) => update({ pinned: e.target.checked })}
                      />
                      Pe frigider
                    </label>
                    <h2>Timpul ideii</h2>
                    <p>
                      Estimat: <b>{formatDuration(ideaTime(idea).estimated)}</b>{" "}
                      · Efectiv: <b>{formatDuration(ideaTime(idea).actual)}</b>
                    </p>
                    <p className="time-help">
                      Estimarea totală include task-urile. Dacă o lași goală,
                      folosim suma estimărilor lor. Timpul efectiv adună
                      task-urile și efortul suplimentar; bifa unui task nu
                      completează automat timpul.
                    </p>
                    <p className="time-help">
                      Din task-uri: estimat{" "}
                      {formatDuration(ideaTime(idea).taskEstimated)} · efectiv{" "}
                      {formatDuration(ideaTime(idea).taskActual)}. Totalurile
                      includ doar duratele completate.
                    </p>
                    <TimeEditor
                      key={`${idea.id}-${idea.estimatedMinutes}-${idea.actualMinutes}`}
                      value={idea}
                      idea
                      onSave={update}
                    />
                  </div>
                  <div className="next-steps" hidden={section !== "Task-uri"}>
                    <h2>Pașii următori</h2>
                    <div className="next-progress">
                      <div>
                        <span id="next-progress-label">
                          Progres: {completedTasks}/{idea.tasks.length}{" "}
                          finalizate
                        </span>
                        <strong>{taskPercent}%</strong>
                      </div>
                      <div
                        className="next-progress-track"
                        role="progressbar"
                        aria-labelledby="next-progress-label"
                        aria-valuenow={taskPercent}
                      >
                        <span style={{ width: `${taskPercent}%` }} />
                      </div>
                    </div>
                    <form
                      className="next-add"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const f = e.currentTarget;
                        const title = String(
                          new FormData(f).get("task"),
                        ).trim();
                        if (title) {
                          update({
                            tasks: [
                              ...idea.tasks,
                              { id: crypto.randomUUID(), title, done: false },
                            ],
                          });
                          f.reset();
                        }
                      }}
                    >
                      <input
                        id="next-task-title"
                        name="task"
                        autoCapitalize="sentences"
                        aria-label="Task nou"
                        placeholder="Un pas mic, concret…"
                        required
                        maxLength={500}
                      />
                      <button className="primary">+ Adaugă</button>
                    </form>
                    {idea.tasks.length === 0 && (
                      <div className="next-empty">
                        <strong>Un proiect începe cu un pas.</strong>
                        <p>Adaugă un task mic și concret ca să pornești.</p>
                        <button
                          type="button"
                          onClick={() =>
                            document.getElementById("next-task-title")?.focus()
                          }
                        >
                          Scrie primul task
                        </button>
                      </div>
                    )}
                    {idea.tasks.length > 0 && (
                      <TaskFilters
                        key={idea.id}
                        tasks={idea.tasks}
                        shown={shownTasks.length}
                        view={taskView}
                        onChange={setTaskView}
                      />
                    )}
                    {idea.tasks.length > 0 && !shownTasks.length && (
                      <div className="next-empty">
                        <strong>Niciun task nu corespunde filtrelor.</strong>
                        <p>Schimbă criteriile sau resetează vizualizarea.</p>
                      </div>
                    )}
                    <Reorder
                      key={idea.id}
                      items={shownTasks}
                      onChange={(tasks) => update({ tasks })}
                      disabled={locked || !manualTasks}
                      className="next-grid"
                      inlineHandle
                    >
                      {(t, handle) => (
                        <article className="next-card" data-done={t.done}>
                          <div className="next-card-head">
                            {handle}
                            <label className="check">
                              <input
                                type="checkbox"
                                checked={t.done}
                                onChange={() =>
                                  update({
                                    tasks: idea.tasks.map((x) =>
                                      x.id === t.id
                                        ? { ...x, done: !x.done }
                                        : x,
                                    ),
                                  })
                                }
                              />
                              <span className="next-task-title">{t.title}</span>
                            </label>
                          </div>
                          <div className="next-card-meta">
                            {getItemSlots(t).length > 0 && (
                              <span
                                className="scheduled-badge"
                                title={getItemSlots(t)
                                  .map(
                                    (s) =>
                                      `${s.date}${s.time ? ` la ${s.time}` : ""}`,
                                  )
                                  .join(", ")}
                              >
                                📅{" "}
                                {getItemSlots(t).length === 1
                                  ? `${getItemSlots(t)[0].date}${
                                      getItemSlots(t)[0].time
                                        ? ` la ${getItemSlots(t)[0].time}`
                                        : ""
                                    }`
                                  : `${getItemSlots(t).length} programări`}
                              </span>
                            )}
                            {t.priority && (
                              <span className="workspace-priority">
                                {t.priority}
                              </span>
                            )}
                          </div>
                          {!!t.labels?.length && (
                            <ul
                              className="workspace-tags"
                              aria-label="Etichete"
                            >
                              {t.labels.map((label) => (
                                <li key={label}>{label}</li>
                              ))}
                            </ul>
                          )}
                          <details className="task-time next-details">
                            <summary aria-label={`Detalii pentru ${t.title}`}>
                              Detalii task
                              <svg
                                aria-hidden="true"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="m6 9 6 6 6-6" />
                              </svg>
                            </summary>
                            <p className="time-help">
                              Estimat {formatDuration(t.estimatedMinutes)} ·
                              Efectiv {formatDuration(t.actualMinutes)}
                            </p>
                            <TaskSteps
                              steps={t.steps ?? []}
                              disabled={locked}
                              onChange={(steps) => updateTask(t.id, { steps })}
                            />
                            <TimeEditor
                              key={`${t.id}-${t.estimatedMinutes}-${t.actualMinutes}`}
                              value={t}
                              onSave={(duration) =>
                                update({
                                  tasks: idea.tasks.map((x) =>
                                    x.id === t.id ? { ...x, ...duration } : x,
                                  ),
                                })
                              }
                            />
                            <div className="task-schedule-container">
                              <strong>
                                📅 Programări în calendar (
                                {getItemSlots(t).length}):
                              </strong>
                              <div className="slots-list">
                                {getItemSlots(t).map((slot) => (
                                  <span key={slot.id} className="slot-pill">
                                    📅 {slot.date}
                                    {slot.time ? ` la ${slot.time}` : ""}
                                    <button
                                      type="button"
                                      className="remove-slot-btn"
                                      title="Șterge această programare"
                                      onClick={() => {
                                        const remaining = getItemSlots(
                                          t,
                                        ).filter((s) => s.id !== slot.id);
                                        update({
                                          tasks: idea.tasks.map((x) =>
                                            x.id === t.id
                                              ? {
                                                  ...x,
                                                  schedule: remaining,
                                                  scheduledDate: null,
                                                  scheduledTime: null,
                                                }
                                              : x,
                                          ),
                                        });
                                      }}
                                    >
                                      ✕
                                    </button>
                                  </span>
                                ))}
                              </div>
                              <form
                                className="add-slot-form"
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  const f = e.currentTarget;
                                  const d = new FormData(f);
                                  const date = String(d.get("date")).trim();
                                  const time =
                                    String(d.get("time")).trim() || null;
                                  const endTime =
                                    String(d.get("endTime")).trim() || null;
                                  if (date) {
                                    const newSlot = {
                                      id: crypto.randomUUID(),
                                      date,
                                      time,
                                      endTime,
                                    };
                                    update({
                                      tasks: idea.tasks.map((x) =>
                                        x.id === t.id
                                          ? {
                                              ...x,
                                              schedule: [
                                                ...getItemSlots(t),
                                                newSlot,
                                              ],
                                              scheduledDate: null,
                                              scheduledTime: null,
                                            }
                                          : x,
                                      ),
                                    });
                                    f.reset();
                                  }
                                }}
                              >
                                <label>
                                  Data
                                  <input
                                    type="date"
                                    name="date"
                                    required
                                    defaultValue={new Date().toLocaleDateString(
                                      "en-CA",
                                    )}
                                  />
                                </label>
                                <label>
                                  Ora de început
                                  <input
                                    type="time"
                                    name="time"
                                    defaultValue="10:00"
                                  />
                                </label>
                                <label>
                                  Ora de sfârșit (opțional)
                                  <input
                                    type="time"
                                    name="endTime"
                                    defaultValue="11:00"
                                  />
                                </label>
                                <button type="submit">
                                  + Adaugă programare
                                </button>
                              </form>
                            </div>
                            <details>
                              <summary>
                                {t.recurrence
                                  ? "Recurență activă"
                                  : "Configurează recurența"}
                              </summary>
                              <form
                                className="task-metadata"
                                key={JSON.stringify(
                                  t.recurrence && [
                                    t.recurrence.frequency,
                                    t.recurrence.interval,
                                    t.recurrence.start,
                                    t.recurrence.end,
                                  ],
                                )}
                                onSubmit={(event) => {
                                  event.preventDefault();
                                  const fields = new FormData(
                                    event.currentTarget,
                                  );
                                  const recurrence: Recurrence = {
                                    frequency: fields.get(
                                      "frequency",
                                    ) as Recurrence["frequency"],
                                    interval: Number(fields.get("interval")),
                                    start: String(fields.get("start")),
                                    end: String(fields.get("end")),
                                    exceptions: t.recurrence?.exceptions ?? {},
                                  };
                                  if (!validRecurrence(recurrence)) {
                                    setError(
                                      "Verifică intervalul și datele recurenței.",
                                    );
                                    return;
                                  }
                                  updateTask(t.id, { recurrence });
                                }}
                              >
                                <label>
                                  Frecvență
                                  <select
                                    name="frequency"
                                    defaultValue={
                                      t.recurrence?.frequency ?? "weekly"
                                    }
                                  >
                                    <option value="daily">Zilnic</option>
                                    <option value="weekly">Săptămânal</option>
                                    <option value="monthly">Lunar</option>
                                  </select>
                                </label>
                                <label>
                                  La fiecare
                                  <input
                                    name="interval"
                                    type="number"
                                    min={1}
                                    max={365}
                                    required
                                    defaultValue={t.recurrence?.interval ?? 1}
                                  />
                                </label>
                                <label>
                                  Început
                                  <input
                                    name="start"
                                    type="date"
                                    required
                                    defaultValue={t.recurrence?.start}
                                  />
                                </label>
                                <label>
                                  Sfârșit
                                  <input
                                    name="end"
                                    type="date"
                                    required
                                    defaultValue={t.recurrence?.end}
                                  />
                                </label>
                                <button>Salvează recurența</button>
                                {t.recurrence && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (
                                        confirm(
                                          "Elimini recurența și istoricul aparițiilor?",
                                        )
                                      )
                                        updateTask(t.id, {
                                          recurrence: undefined,
                                        });
                                    }}
                                  >
                                    Elimină recurența
                                  </button>
                                )}
                              </form>
                            </details>
                            <div className="task-metadata">
                              <label>
                                Prioritate
                                <select
                                  value={t.priority ?? ""}
                                  onChange={(e) =>
                                    updateTask(t.id, {
                                      priority: TASK_PRIORITIES.find(
                                        (priority) =>
                                          priority === e.target.value,
                                      ),
                                    })
                                  }
                                >
                                  <option value="">Fără prioritate</option>
                                  {TASK_PRIORITIES.map((priority) => (
                                    <option key={priority}>{priority}</option>
                                  ))}
                                </select>
                              </label>
                              <form
                                className="inline"
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  const form = e.currentTarget;
                                  const label = String(
                                    new FormData(form).get("label"),
                                  ).trim();
                                  if (
                                    !label ||
                                    t.labels?.some(
                                      (value) =>
                                        value.toLocaleLowerCase("ro") ===
                                        label.toLocaleLowerCase("ro"),
                                    ) ||
                                    (t.labels?.length ?? 0) >= 8
                                  )
                                    return;
                                  updateTask(t.id, {
                                    labels: [...(t.labels ?? []), label],
                                  });
                                  form.reset();
                                }}
                              >
                                <label>
                                  Etichetă
                                  <input
                                    name="label"
                                    required
                                    maxLength={32}
                                    disabled={(t.labels?.length ?? 0) >= 8}
                                  />
                                </label>
                                <button disabled={(t.labels?.length ?? 0) >= 8}>
                                  Adaugă etichetă
                                </button>
                              </form>
                              {!!t.labels?.length && (
                                <ul
                                  className="task-labels"
                                  aria-label="Etichete task"
                                >
                                  {t.labels.map((label) => (
                                    <li key={label}>
                                      <button
                                        type="button"
                                        aria-label={`Elimină eticheta ${label}`}
                                        onClick={() =>
                                          updateTask(t.id, {
                                            labels: t.labels?.filter(
                                              (value) => value !== label,
                                            ),
                                          })
                                        }
                                      >
                                        {label}{" "}
                                        <span aria-hidden="true">×</span>
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                            <button
                              aria-label={`Șterge task ${t.title}`}
                              onClick={() =>
                                update({
                                  tasks: idea.tasks.filter(
                                    (x) => x.id !== t.id,
                                  ),
                                })
                              }
                            >
                              ×
                            </button>
                          </details>
                        </article>
                      )}
                    </Reorder>
                  </div>
                  <div hidden={section !== "Pagini și note"}>
                    <IdeaPages
                      key={idea.id}
                      pages={idea.pages ?? []}
                      notes={idea.notes}
                      onChange={(pages) => update({ pages })}
                    />
                    <h2>Note</h2>
                    <textarea
                      aria-label="Note"
                      placeholder="Gânduri, linkuri, lucruri de ținut minte…"
                      value={idea.notes}
                      onChange={(e) => update({ notes: e.target.value })}
                    />
                  </div>
                  <div hidden={section !== "Finanțe"}>
                    <h2>Banii ideii</h2>
                    <p>
                      Profit:{" "}
                      <b
                        className={
                          totals(idea).profit < 0
                            ? "profit-negative"
                            : "profit-positive"
                        }
                      >
                        {money(totals(idea).profit)}
                      </b>
                    </p>
                    <details className="break-even-calculator">
                      <summary>
                        ⚖ Calculator prag de rentabilitate (Break-Even)
                        {calculateBreakEven(
                          totals(idea).expense,
                          idea.unitPriceCents,
                          idea.unitCostCents,
                        ) && (
                          <span>
                            {" "}
                            · Prag:{" "}
                            <b>
                              {
                                calculateBreakEven(
                                  totals(idea).expense,
                                  idea.unitPriceCents,
                                  idea.unitCostCents,
                                )?.unitsNeeded
                              }{" "}
                              vânzări
                            </b>
                          </span>
                        )}
                      </summary>
                      <div className="break-even-fields">
                        <label>
                          Preț estimat per vânzare / bucată (RON)
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="ex: 150"
                            defaultValue={
                              idea.unitPriceCents
                                ? (idea.unitPriceCents / 100).toString()
                                : ""
                            }
                            onBlur={(e) => {
                              try {
                                const val = e.target.value.trim();
                                update({
                                  unitPriceCents: val
                                    ? amountToCents(val)
                                    : null,
                                });
                              } catch (err) {
                                setError((err as Error).message);
                              }
                            }}
                          />
                        </label>
                        <label>
                          Cost variabil per bucată (opțional) (RON)
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="ex: 45"
                            defaultValue={
                              idea.unitCostCents
                                ? (idea.unitCostCents / 100).toString()
                                : ""
                            }
                            onBlur={(e) => {
                              try {
                                const val = e.target.value.trim();
                                update({
                                  unitCostCents: val
                                    ? amountToCents(val)
                                    : null,
                                });
                              } catch (err) {
                                setError((err as Error).message);
                              }
                            }}
                          />
                        </label>
                      </div>
                      {(() => {
                        const be = calculateBreakEven(
                          totals(idea).expense,
                          idea.unitPriceCents,
                          idea.unitCostCents,
                        );
                        if (!idea.unitPriceCents) {
                          return (
                            <p className="time-help">
                              Introdu un preț de vânzare estimat pentru a
                              calcula câte comenzi acoperă cheltuielile totale.
                            </p>
                          );
                        }
                        if (!be) {
                          return (
                            <p className="error">
                              Prețul de vânzare trebuie să fie mai mare decât
                              costul variabil pentru o marjă pozitivă.
                            </p>
                          );
                        }
                        return (
                          <div className="break-even-result">
                            <p>
                              Marjă brută per unitate:{" "}
                              <b>{money(be.marginPerUnitCents)}</b>
                            </p>
                            <p>
                              Cheltuieli totale înregistrate:{" "}
                              <b>{money(totals(idea).expense)}</b>
                            </p>
                            <p className="highlight">
                              Ai nevoie de{" "}
                              <strong>
                                {be.unitsNeeded}{" "}
                                {be.unitsNeeded === 1 ? "vânzare" : "vânzări"}
                              </strong>{" "}
                              la acest preț pentru a amortiza toate cheltuielile
                              și a intra pe profit.
                            </p>
                          </div>
                        );
                      })()}
                    </details>
                    <form
                      className="transaction"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const f = e.currentTarget;
                        const d = new FormData(f);
                        try {
                          const cents = amountToCents(String(d.get("amount")));
                          if (!cents)
                            throw new Error(
                              "Suma trebuie să fie mai mare decât zero.",
                            );
                          update({
                            entries: [
                              ...idea.entries,
                              {
                                id: crypto.randomUUID(),
                                kind: d.get("kind") as "income" | "expense",
                                cents,
                                date: String(d.get("date")),
                                label: String(d.get("label")).trim(),
                              },
                            ],
                          });
                          f.reset();
                        } catch (err) {
                          setError((err as Error).message);
                        }
                      }}
                    >
                      <select name="kind" aria-label="Tip tranzacție">
                        <option value="income">Venit</option>
                        <option value="expense">Cheltuială</option>
                      </select>
                      <input
                        name="amount"
                        aria-label="Sumă RON"
                        placeholder="Sumă RON"
                        required
                        inputMode="decimal"
                      />
                      <input
                        name="label"
                        aria-label="Descriere tranzacție"
                        placeholder="Pentru ce?"
                        required
                        maxLength={200}
                      />
                      <input
                        name="date"
                        aria-label="Data tranzacției"
                        type="date"
                        defaultValue={new Date().toLocaleDateString("en-CA")}
                        required
                      />
                      <button>Adaugă</button>
                    </form>
                    {idea.entries.map((t) => (
                      <div className="task" key={t.id}>
                        <span>
                          {t.date} · {t.label}{" "}
                          <b>
                            {t.kind === "income" ? "+" : "−"}
                            {money(t.cents)}
                          </b>
                        </span>
                        <button
                          aria-label={`Șterge tranzacție ${t.label}`}
                          onClick={() => {
                            if (confirm("Ștergi tranzacția?"))
                              update({
                                entries: idea.entries.filter(
                                  (x) => x.id !== t.id,
                                ),
                              });
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div hidden={section !== "Detalii"}>
                    <button
                      className="danger"
                      onClick={() => {
                        if (confirm("Ștergi ideea și toate datele ei?")) {
                          save({
                            ...store,
                            ideas: store.ideas.filter((i) => i.id !== idea.id),
                          });
                          setSelected("");
                        }
                      }}
                    >
                      Șterge ideea
                    </button>
                  </div>
                </fieldset>
              </section>
            ) : view === "Pe stadii" ? (
              <StatusBoard
                ideas={store.ideas}
                onSelect={setSelected}
                onUpdateStatus={(id, status) => {
                  save({
                    ...store,
                    ideas: store.ideas.map((i) =>
                      i.id === id ? { ...i, status } : i,
                    ),
                  });
                }}
              />
            ) : view === "Calendar" ? (
              <>
                {!owner && (
                  <GoogleCalendarPanel dirty={pending > 0 || locked} />
                )}
                <CalendarView
                  ideas={store.ideas}
                  onSelect={setSelected}
                  onAddSlot={(ideaId, taskId, date, time, endTime) => {
                    const newSlot = {
                      id: crypto.randomUUID(),
                      date,
                      time: time || null,
                      endTime: endTime || null,
                    };
                    save({
                      ...store,
                      ideas: store.ideas.map((i) => {
                        if (i.id !== ideaId) return i;
                        if (taskId) {
                          return {
                            ...i,
                            tasks: i.tasks.map((t) =>
                              t.id === taskId
                                ? {
                                    ...t,
                                    schedule: [...getItemSlots(t), newSlot],
                                    scheduledDate: null,
                                    scheduledTime: null,
                                  }
                                : t,
                            ),
                          };
                        }
                        return {
                          ...i,
                          schedule: [...getItemSlots(i), newSlot],
                          scheduledDate: null,
                        };
                      }),
                    });
                  }}
                  onSkipOccurrence={(entry) => {
                    if (entry.kind === "task" && entry.occurrence)
                      updateOccurrence(
                        entry.ideaId,
                        entry.task.id,
                        entry.occurrence,
                        { date: null },
                      );
                  }}
                  onMoveSlot={(entry, date) => {
                    if (entry.kind === "task" && entry.occurrence) {
                      updateOccurrence(
                        entry.ideaId,
                        entry.task.id,
                        entry.occurrence,
                        { date },
                      );
                      return;
                    }
                    if (locked) return;
                    const ideaId =
                      entry.kind === "task" ? entry.ideaId : entry.idea.id;
                    const move = (item: Idea | Task) =>
                      getItemSlots(item).map((slot) =>
                        slot.id === entry.slotId ? { ...slot, date } : slot,
                      );
                    save({
                      ...store,
                      ideas: store.ideas.map((item) => {
                        if (item.id !== ideaId) return item;
                        if (entry.kind === "idea")
                          return {
                            ...item,
                            schedule: move(item),
                            scheduledDate: null,
                          };
                        return {
                          ...item,
                          tasks: item.tasks.map((task) =>
                            task.id === entry.task.id
                              ? {
                                  ...task,
                                  schedule: move(task),
                                  scheduledDate: null,
                                  scheduledTime: null,
                                }
                              : task,
                          ),
                        };
                      }),
                    });
                  }}
                  onRemoveSlot={(ideaId, taskId, slotId) => {
                    save({
                      ...store,
                      ideas: store.ideas.map((i) => {
                        if (i.id !== ideaId) return i;
                        if (taskId) {
                          return {
                            ...i,
                            tasks: i.tasks.map((t) =>
                              t.id === taskId
                                ? {
                                    ...t,
                                    schedule: getItemSlots(t).filter(
                                      (s) => s.id !== slotId,
                                    ),
                                    scheduledDate: null,
                                    scheduledTime: null,
                                  }
                                : t,
                            ),
                          };
                        }
                        return {
                          ...i,
                          schedule: getItemSlots(i).filter(
                            (s) => s.id !== slotId,
                          ),
                          scheduledDate: null,
                        };
                      }),
                    });
                  }}
                  onToggleTask={(ideaId, taskId, occurrence) => {
                    if (locked) return;
                    if (occurrence) {
                      const rule = store.ideas
                        .find((item) => item.id === ideaId)
                        ?.tasks.find((task) => task.id === taskId)?.recurrence;
                      updateOccurrence(ideaId, taskId, occurrence, {
                        done: !rule?.exceptions[occurrence]?.done,
                      });
                      return;
                    }
                    save({
                      ...store,
                      ideas: store.ideas.map((i) =>
                        i.id === ideaId
                          ? {
                              ...i,
                              tasks: i.tasks.map((t) =>
                                t.id === taskId ? { ...t, done: !t.done } : t,
                              ),
                            }
                          : i,
                      ),
                    });
                  }}
                />
              </>
            ) : (
              <>
                <div className="toolbar">
                  <div>
                    <h2>
                      {view} <span>{filtered.length}</span>
                    </h2>
                    {categories.length > 0 && (
                      <div className="category-filter">
                        <label htmlFor="category-filter-select">
                          Categorie:
                        </label>
                        <select
                          id="category-filter-select"
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                          <option value="Toate">
                            Toate categoriile ({store.ideas.length})
                          </option>
                          {categories.map((c) => (
                            <option key={c} value={c}>
                              {c} (
                              {
                                store.ideas.filter((i) => i.category === c)
                                  .length
                              }
                              )
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <input
                    aria-label="Caută idei"
                    placeholder="Caută o idee sau categorie…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <form
                  className="new-idea"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = e.currentTarget;
                    const title = String(new FormData(f).get("title")).trim();
                    if (title) {
                      const item = newIdea(title);
                      save({ ...store, ideas: [...store.ideas, item] });
                      f.reset();
                      setSelected(item.id);
                    }
                  }}
                >
                  <input
                    disabled={locked}
                    name="title"
                    placeholder="Ce idee ai astăzi?"
                    aria-label="Titlul ideii noi"
                    required
                    maxLength={200}
                  />
                  <button className="primary" disabled={locked}>
                    + Idee nouă
                  </button>
                </form>
                <section
                  className={view === "Frigider" ? "cards fridge" : "cards"}
                >
                  {filtered.map((i, index) => (
                    <button
                      key={i.id}
                      className={`idea color-${index % 4}`}
                      onClick={() => setSelected(i.id)}
                    >
                      <div className="card-top-badges">
                        <span className="status">{i.status}</span>
                        {i.category && (
                          <span className="idea-tag">{i.category}</span>
                        )}
                      </div>
                      <h2>{i.title}</h2>
                      <p>
                        {i.description ||
                          "O idee bună începe cu un prim pas. Deschide și dă-i contur."}
                      </p>
                      {getItemSlots(i).length > 0 && (
                        <p className="scheduled-badge">
                          📅{" "}
                          {getItemSlots(i).length === 1
                            ? `Planificat: ${getItemSlots(i)[0].date}${
                                getItemSlots(i)[0].time
                                  ? ` la ${getItemSlots(i)[0].time}`
                                  : ""
                              }`
                            : `${getItemSlots(i).length} sesiuni în calendar`}
                        </p>
                      )}
                      <p className="time-help">
                        Estimat: {formatDuration(ideaTime(i).estimated)} ·
                        Efectiv: {formatDuration(ideaTime(i).actual)}
                      </p>
                      <footer>
                        <span>
                          {i.tasks.filter((t) => t.done).length}/
                          {i.tasks.length} pași
                        </span>
                        <b
                          className={
                            totals(i).profit < 0
                              ? "profit-negative"
                              : "profit-positive"
                          }
                        >
                          {money(totals(i).profit)}
                        </b>
                      </footer>
                    </button>
                  ))}
                </section>
                {!filtered.length && (
                  <div className="empty">
                    <span>✳</span>
                    <h2>
                      {store.ideas.length
                        ? "Nicio idee aici încă."
                        : "Lasă loc următoarei idei."}
                    </h2>
                    <p>
                      Adaugă o idee mai sus. Nu trebuie să fie perfectă ca să
                      începi.
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
