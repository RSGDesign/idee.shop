"use client";
import { useState } from "react";
import { type Idea, type Task, getItemSlots, occurrencesOn } from "@/lib/model";

const MONTH_NAMES = [
  "Ianuarie",
  "Februarie",
  "Martie",
  "Aprilie",
  "Mai",
  "Iunie",
  "Iulie",
  "August",
  "Septembrie",
  "Octombrie",
  "Noiembrie",
  "Decembrie",
];

const WEEKDAYS = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"];
const WEEKDAYS_LONG = [
  "Luni",
  "Marți",
  "Miercuri",
  "Joi",
  "Vineri",
  "Sâmbătă",
  "Duminică",
];

function parseYMD(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getMonday(d: Date): Date {
  const copy = new Date(d);
  const day = (copy.getDay() + 6) % 7; // Monday = 0
  copy.setDate(copy.getDate() - day);
  return copy;
}

export type ScheduledEntry =
  | {
      kind: "task";
      ideaId: string;
      ideaTitle: string;
      task: Task;
      occurrence?: string;
      slotId: string;
      date: string;
      time?: string | null;
      endTime?: string | null;
    }
  | {
      kind: "idea";
      idea: Idea;
      slotId: string;
      date: string;
      time?: string | null;
      endTime?: string | null;
    };

export default function CalendarView({
  ideas,
  onSelect,
  onAddSlot,
  onRemoveSlot,
  onMoveSlot,
  onToggleTask,
  onSkipOccurrence,
}: {
  ideas: Idea[];
  onSelect: (id: string) => void;
  onAddSlot: (
    ideaId: string,
    taskId: string | null,
    date: string,
    time?: string | null,
    endTime?: string | null,
  ) => void;
  onRemoveSlot: (ideaId: string, taskId: string | null, slotId: string) => void;
  onMoveSlot: (entry: ScheduledEntry, date: string) => void;
  onToggleTask?: (ideaId: string, taskId: string, occurrence?: string) => void;
  onSkipOccurrence: (entry: ScheduledEntry) => void;
}) {
  const [dragged, setDragged] = useState<ScheduledEntry | null>(null);

  function dragProps(entry: ScheduledEntry) {
    return {
      draggable: true,
      onDragStart: (event: React.DragEvent) => {
        event.dataTransfer.setData("text/plain", entry.slotId);
        event.dataTransfer.effectAllowed = "move";
        setDragged(entry);
      },
      onDragEnd: () => setDragged(null),
    };
  }

  function dropProps(date: string) {
    return {
      onDragOver: (event: React.DragEvent) => {
        if (!dragged) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      },
      onDrop: (event: React.DragEvent) => {
        if (!dragged) return;
        event.preventDefault();
        if (date !== dragged.date) onMoveSlot(dragged, date);
        setDragged(null);
        setSelectedDate(date);
      },
    };
  }
  const today = new Date();
  const todayStr = formatYMD(today);

  const [calendarMode, setCalendarMode] = useState<"month" | "week" | "day">(
    "month",
  );
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [scheduleMode, setScheduleMode] = useState<"task" | "idea">("task");
  const [selectedIdeaIdForTask, setSelectedIdeaIdForTask] =
    useState<string>("");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [selectedTaskTime, setSelectedTaskTime] = useState<string>("10:00");
  const [selectedTaskEndTime, setSelectedTaskEndTime] =
    useState<string>("11:00");
  const [selectedIdeaIdForIdea, setSelectedIdeaIdForIdea] =
    useState<string>("");
  const [selectedIdeaTime, setSelectedIdeaTime] = useState<string>("");
  const [selectedIdeaEndTime, setSelectedIdeaEndTime] = useState<string>("");

  const currDateObj = parseYMD(selectedDate);

  // Navigation handlers
  function prev() {
    const d = parseYMD(selectedDate);
    if (calendarMode === "month") {
      d.setMonth(d.getMonth() - 1);
    } else if (calendarMode === "week") {
      d.setDate(d.getDate() - 7);
    } else {
      d.setDate(d.getDate() - 1);
    }
    setSelectedDate(formatYMD(d));
  }

  function next() {
    const d = parseYMD(selectedDate);
    if (calendarMode === "month") {
      d.setMonth(d.getMonth() + 1);
    } else if (calendarMode === "week") {
      d.setDate(d.getDate() + 7);
    } else {
      d.setDate(d.getDate() + 1);
    }
    setSelectedDate(formatYMD(d));
  }

  function goToToday() {
    setSelectedDate(todayStr);
  }

  // Index scheduled items by date
  const itemsByDate = new Map<string, ScheduledEntry[]>();

  for (const idea of ideas) {
    for (const slot of getItemSlots(idea)) {
      const list = itemsByDate.get(slot.date) || [];
      list.push({
        kind: "idea",
        idea,
        slotId: slot.id,
        date: slot.date,
        time: slot.time,
        endTime: slot.endTime,
      });
      itemsByDate.set(slot.date, list);
    }
    for (const task of idea.tasks) {
      for (const slot of getItemSlots(task)) {
        const list = itemsByDate.get(slot.date) || [];
        list.push({
          kind: "task",
          ideaId: idea.id,
          ideaTitle: idea.title,
          task,
          slotId: slot.id,
          date: slot.date,
          time: slot.time,
          endTime: slot.endTime,
        });
        itemsByDate.set(slot.date, list);
      }
    }
  }

  function getSortedDayItems(dateStr: string): ScheduledEntry[] {
    const raw = [...(itemsByDate.get(dateStr) || [])];
    for (const idea of ideas)
      for (const task of idea.tasks) {
        const rule = task.recurrence;
        if (!rule) continue;
        for (const occurrence of occurrencesOn(rule, dateStr))
          raw.push({
            kind: "task",
            ideaId: idea.id,
            ideaTitle: idea.title,
            task: { ...task, done: rule.exceptions[occurrence]?.done ?? false },
            occurrence,
            slotId: occurrence,
            date: dateStr,
          });
      }
    return [...raw].sort((a, b) => {
      const timeA = a.time || "99:99";
      const timeB = b.time || "99:99";
      return timeA.localeCompare(timeB);
    });
  }

  function formatTimeRange(time?: string | null, endTime?: string | null) {
    if (!time && !endTime) return "Toată ziua";
    if (time && endTime) return `🕒 ${time} – ${endTime}`;
    return `🕒 ${time}`;
  }

  const selectedDayItems = getSortedDayItems(selectedDate);
  const ideasWithTasks = ideas.filter((i) => i.tasks.length > 0);
  const activeIdeaForTask = ideas.find((i) => i.id === selectedIdeaIdForTask);

  // Month grid calculations
  const year = currDateObj.getFullYear();
  const month = currDateObj.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const totalDays = lastDayOfMonth.getDate();
  const startDay = (firstDayOfMonth.getDay() + 6) % 7;

  // Week days calculation
  const monday = getMonday(currDateObj);
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDates.push(formatYMD(d));
  }

  // Header Title
  let headerTitle = "";
  if (calendarMode === "month") {
    headerTitle = `${MONTH_NAMES[month]} ${year}`;
  } else if (calendarMode === "week") {
    const startObj = parseYMD(weekDates[0]);
    const endObj = parseYMD(weekDates[6]);
    if (startObj.getMonth() === endObj.getMonth()) {
      headerTitle = `${startObj.getDate()} – ${endObj.getDate()} ${MONTH_NAMES[startObj.getMonth()]} ${startObj.getFullYear()}`;
    } else {
      headerTitle = `${startObj.getDate()} ${MONTH_NAMES[startObj.getMonth()]} – ${endObj.getDate()} ${MONTH_NAMES[endObj.getMonth()]} ${endObj.getFullYear()}`;
    }
  } else {
    const dayOfWeek = (currDateObj.getDay() + 6) % 7;
    headerTitle = `${WEEKDAYS_LONG[dayOfWeek]}, ${currDateObj.getDate()} ${MONTH_NAMES[currDateObj.getMonth()]} ${currDateObj.getFullYear()}`;
  }

  return (
    <div className="calendar-view">
      <div className="calendar-controls">
        <div className="calendar-nav">
          <button type="button" onClick={prev} aria-label="Înapoi">
            ‹ Înapoi
          </button>
          <h2>{headerTitle}</h2>
          <button type="button" onClick={next} aria-label="Înainte">
            Înainte ›
          </button>
          <button type="button" className="ghost" onClick={goToToday}>
            Astăzi
          </button>
        </div>

        <div className="calendar-mode-toggle" role="tablist">
          <button
            type="button"
            className={calendarMode === "day" ? "active" : ""}
            onClick={() => setCalendarMode("day")}
          >
            Zi
          </button>
          <button
            type="button"
            className={calendarMode === "week" ? "active" : ""}
            onClick={() => setCalendarMode("week")}
          >
            Săptămână
          </button>
          <button
            type="button"
            className={calendarMode === "month" ? "active" : ""}
            onClick={() => setCalendarMode("month")}
          >
            Lună
          </button>
        </div>
      </div>

      <div className="calendar-layout">
        <div className="calendar-main-stage">
          {/* VIZUALIZARE LUNĂ */}
          {calendarMode === "month" && (
            <div className="calendar-grid-container">
              <div className="calendar-weekdays">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="weekday-header">
                    {w}
                  </div>
                ))}
              </div>

              <div className="calendar-grid">
                {Array.from({ length: startDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="calendar-cell empty" />
                ))}

                {Array.from({ length: totalDays }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(
                    2,
                    "0",
                  )}-${String(dayNum).padStart(2, "0")}`;
                  const dayItems = getSortedDayItems(dateStr);
                  const isSelected = dateStr === selectedDate;
                  const isToday = dateStr === todayStr;

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      className={`calendar-cell day ${
                        isSelected ? "selected" : ""
                      } ${isToday ? "today" : ""}`}
                      onClick={() => setSelectedDate(dateStr)}
                      {...dropProps(dateStr)}
                    >
                      <span className="day-number">{dayNum}</span>
                      {dayItems.length > 0 && (
                        <span className="day-count">{dayItems.length}</span>
                      )}
                      {dayItems.slice(0, 2).map((item, idx) => (
                        <span
                          key={idx}
                          className="day-item-pill"
                          {...dragProps(item)}
                        >
                          {item.kind === "task"
                            ? `${item.time ? `${item.time} ` : ""}${item.task.title}`
                            : `${item.time ? `${item.time} ` : ""}${item.idea.title}`}
                        </span>
                      ))}
                      {dayItems.length > 2 && (
                        <small className="day-more">
                          +{dayItems.length - 2} altele
                        </small>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIZUALIZARE SĂPTĂMÂNĂ */}
          {calendarMode === "week" && (
            <div className="calendar-week-container">
              <div className="week-grid">
                {weekDates.map((dateStr, idx) => {
                  const dayDate = parseYMD(dateStr);
                  const dayItems = getSortedDayItems(dateStr);
                  const isSelected = dateStr === selectedDate;
                  const isToday = dateStr === todayStr;

                  return (
                    <div
                      key={dateStr}
                      className={`week-day-col ${isSelected ? "selected" : ""} ${
                        isToday ? "today" : ""
                      }`}
                      onClick={() => setSelectedDate(dateStr)}
                      {...dropProps(dateStr)}
                    >
                      <div className="week-col-header">
                        <span className="week-day-name">{WEEKDAYS[idx]}</span>
                        <strong className="week-day-num">
                          {dayDate.getDate()}
                        </strong>
                      </div>
                      <div className="week-col-items">
                        {dayItems.length === 0 ? (
                          <span className="week-empty">—</span>
                        ) : (
                          dayItems.map((item, i) => (
                            <div
                              key={i}
                              {...dragProps(item)}
                              className={`week-item-card ${
                                item.kind === "task" ? "task-kind" : "idea-kind"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelect(
                                  item.kind === "task"
                                    ? item.ideaId
                                    : item.idea.id,
                                );
                              }}
                            >
                              <span className="week-item-time">
                                {formatTimeRange(item.time, item.endTime)}
                              </span>
                              <strong className="week-item-title">
                                {item.kind === "task"
                                  ? item.task.title
                                  : item.idea.title}
                              </strong>
                              {item.kind === "task" && (
                                <small className="week-item-parent">
                                  {item.ideaTitle}
                                </small>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIZUALIZARE ZI */}
          {calendarMode === "day" && (
            <div className="calendar-day-container">
              <div className="day-view-hero">
                <div>
                  <h3>Programul zilei de {selectedDate}</h3>
                  <p className="time-help">
                    {selectedDayItems.length === 0
                      ? "Nicio activitate programată."
                      : `${selectedDayItems.length} activități ordonate cronologic:`}
                  </p>
                </div>
                {selectedDate === todayStr && (
                  <span className="today-badge">Astăzi</span>
                )}
              </div>

              {selectedDayItems.length === 0 ? (
                <div className="day-empty-state">
                  <p>Nu ai programat nimic pentru această zi.</p>
                  <small>
                    Folosește formularul din dreapta pentru a adăuga pași sau
                    idei cu interval orar (start – sfârșit).
                  </small>
                </div>
              ) : (
                <div className="day-timeline">
                  {selectedDayItems.map((entry, idx) => (
                    <div
                      key={idx}
                      className={`day-timeline-card ${
                        entry.kind === "task" ? "task-entry" : "idea-entry"
                      }`}
                    >
                      <div className="timeline-time-block">
                        <span className="timeline-badge">
                          {formatTimeRange(entry.time, entry.endTime)}
                        </span>
                      </div>
                      <div className="timeline-content-block">
                        <div className="item-title-row">
                          {entry.kind === "task" && onToggleTask && (
                            <input
                              type="checkbox"
                              checked={entry.task.done}
                              onChange={() =>
                                onToggleTask(
                                  entry.ideaId,
                                  entry.task.id,
                                  entry.occurrence,
                                )
                              }
                              title="Bifează pasul"
                            />
                          )}
                          <strong
                            style={{
                              textDecoration:
                                entry.kind === "task" && entry.task.done
                                  ? "line-through"
                                  : "none",
                            }}
                          >
                            {entry.kind === "task"
                              ? entry.task.title
                              : entry.idea.title}
                          </strong>
                        </div>
                        <div className="item-meta-row">
                          {entry.kind === "task" ? (
                            <span className="parent-idea">
                              Din ideea: {entry.ideaTitle}
                            </span>
                          ) : (
                            <span className="status-indicator">
                              Idee completă ({entry.idea.status})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="scheduled-item-actions">
                        <form
                          className="inline"
                          onSubmit={(event) => {
                            event.preventDefault();
                            const date = String(
                              new FormData(event.currentTarget).get("date"),
                            );
                            if (date && date !== entry.date) {
                              onMoveSlot(entry, date);
                              setSelectedDate(date);
                            }
                          }}
                        >
                          <input
                            type="date"
                            name="date"
                            required
                            defaultValue={entry.date}
                            aria-label="Data nouă a programării"
                          />
                          <button type="submit">Mută</button>
                        </form>
                        <button
                          type="button"
                          className="open-btn"
                          onClick={() =>
                            onSelect(
                              entry.kind === "task"
                                ? entry.ideaId
                                : entry.idea.id,
                            )
                          }
                        >
                          Deschide
                        </button>
                        <button
                          type="button"
                          className="remove-btn"
                          title="Elimină programarea"
                          onClick={() =>
                            entry.kind === "task" && entry.occurrence
                              ? onSkipOccurrence(entry)
                              : onRemoveSlot(
                                  entry.kind === "task"
                                    ? entry.ideaId
                                    : entry.idea.id,
                                  entry.kind === "task" ? entry.task.id : null,
                                  entry.slotId,
                                )
                          }
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* PANOU LATERAL: PROGRAMĂRI PE ZIUA SELECTATĂ ȘI FORMULAR DE ADĂUGARE */}
        <div className="calendar-side-panel">
          <div className="selected-day-header">
            <div>
              <h3>Ziua selectată: {selectedDate}</h3>
              <small>{selectedDayItems.length} activități</small>
            </div>
            {selectedDate === todayStr && (
              <span className="today-badge">Astăzi</span>
            )}
          </div>

          {calendarMode !== "day" && (
            <div className="side-day-list">
              {selectedDayItems.length === 0 ? (
                <p className="no-scheduled">Nicio activitate în această zi.</p>
              ) : (
                <div className="scheduled-list">
                  {selectedDayItems.map((entry, idx) => (
                    <div
                      key={`side-${entry.slotId}-${idx}`}
                      className="scheduled-item"
                    >
                      <div className="scheduled-item-info">
                        <div className="item-title-row">
                          {entry.kind === "task" && onToggleTask && (
                            <input
                              type="checkbox"
                              checked={entry.task.done}
                              onChange={() =>
                                onToggleTask(
                                  entry.ideaId,
                                  entry.task.id,
                                  entry.occurrence,
                                )
                              }
                            />
                          )}
                          <strong
                            style={{
                              textDecoration:
                                entry.kind === "task" && entry.task.done
                                  ? "line-through"
                                  : "none",
                            }}
                          >
                            {entry.kind === "task"
                              ? entry.task.title
                              : entry.idea.title}
                          </strong>
                        </div>
                        <span className="time-badge">
                          {formatTimeRange(entry.time, entry.endTime)}
                        </span>
                      </div>
                      <div className="scheduled-item-actions">
                        <button
                          type="button"
                          className="open-btn"
                          onClick={() =>
                            onSelect(
                              entry.kind === "task"
                                ? entry.ideaId
                                : entry.idea.id,
                            )
                          }
                        >
                          Deschide
                        </button>
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={() =>
                            entry.kind === "task" && entry.occurrence
                              ? onSkipOccurrence(entry)
                              : onRemoveSlot(
                                  entry.kind === "task"
                                    ? entry.ideaId
                                    : entry.idea.id,
                                  entry.kind === "task" ? entry.task.id : null,
                                  entry.slotId,
                                )
                          }
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="quick-schedule-box">
            <div className="schedule-mode-tabs">
              <button
                type="button"
                className={scheduleMode === "task" ? "active" : ""}
                onClick={() => setScheduleMode("task")}
              >
                + Programează Pas / Task
              </button>
              <button
                type="button"
                className={scheduleMode === "idea" ? "active" : ""}
                onClick={() => setScheduleMode("idea")}
              >
                + Programează Idee
              </button>
            </div>

            {scheduleMode === "task" ? (
              <form
                className="task-schedule-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (selectedIdeaIdForTask && selectedTaskId) {
                    onAddSlot(
                      selectedIdeaIdForTask,
                      selectedTaskId,
                      selectedDate,
                      selectedTaskTime || null,
                      selectedTaskEndTime || null,
                    );
                    setSelectedTaskId("");
                  }
                }}
              >
                {ideasWithTasks.length === 0 ? (
                  <p className="time-help">
                    Nicio idee nu are încă pași adăugați.
                  </p>
                ) : (
                  <>
                    <label>
                      Alege ideea:
                      <select
                        value={selectedIdeaIdForTask}
                        onChange={(e) => {
                          setSelectedIdeaIdForTask(e.target.value);
                          setSelectedTaskId("");
                        }}
                      >
                        <option value="">Alege o idee…</option>
                        {ideasWithTasks.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.title}
                          </option>
                        ))}
                      </select>
                    </label>

                    {activeIdeaForTask && (
                      <label>
                        Alege pasul / task-ul:
                        <select
                          value={selectedTaskId}
                          onChange={(e) => setSelectedTaskId(e.target.value)}
                          required
                        >
                          <option value="">Alege pasul…</option>
                          {activeIdeaForTask.tasks.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.done ? "✓ " : ""}
                              {t.title}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    <div className="time-range-inputs">
                      <label>
                        Ora de început:
                        <input
                          type="time"
                          value={selectedTaskTime}
                          onChange={(e) => setSelectedTaskTime(e.target.value)}
                          required
                        />
                      </label>
                      <label>
                        Ora de sfârșit (opțional):
                        <input
                          type="time"
                          value={selectedTaskEndTime}
                          onChange={(e) =>
                            setSelectedTaskEndTime(e.target.value)
                          }
                        />
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="primary"
                      disabled={!selectedIdeaIdForTask || !selectedTaskId}
                    >
                      + Programează pentru {selectedDate}
                    </button>
                  </>
                )}
              </form>
            ) : (
              <form
                className="task-schedule-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (selectedIdeaIdForIdea) {
                    onAddSlot(
                      selectedIdeaIdForIdea,
                      null,
                      selectedDate,
                      selectedIdeaTime || null,
                      selectedIdeaEndTime || null,
                    );
                    setSelectedIdeaIdForIdea("");
                    setSelectedIdeaTime("");
                    setSelectedIdeaEndTime("");
                  }
                }}
              >
                <label>
                  Alege ideea:
                  <select
                    value={selectedIdeaIdForIdea}
                    onChange={(e) => setSelectedIdeaIdForIdea(e.target.value)}
                    required
                  >
                    <option value="">Alege o idee…</option>
                    {ideas.map((idea) => (
                      <option key={idea.id} value={idea.id}>
                        {idea.title} {idea.category ? `(${idea.category})` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="time-range-inputs">
                  <label>
                    Ora de început (opțional):
                    <input
                      type="time"
                      value={selectedIdeaTime}
                      onChange={(e) => setSelectedIdeaTime(e.target.value)}
                    />
                  </label>
                  <label>
                    Ora de sfârșit (opțional):
                    <input
                      type="time"
                      value={selectedIdeaEndTime}
                      onChange={(e) => setSelectedIdeaEndTime(e.target.value)}
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  className="primary"
                  disabled={!selectedIdeaIdForIdea}
                >
                  + Programează ideea pentru {selectedDate}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
