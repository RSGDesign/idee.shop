"use client";
import { TASK_PRIORITIES, type Task } from "@/lib/model";
import {
  DEFAULT_TASK_VIEW,
  hasTaskFilters,
  TASK_DURATIONS,
  TASK_SORTS,
  type TaskView,
} from "@/lib/task-view";

export default function TaskFilters({
  tasks,
  shown,
  view,
  onChange,
}: {
  tasks: Task[];
  shown: number;
  view: TaskView;
  onChange: (view: TaskView) => void;
}) {
  const labels = [...new Set(tasks.flatMap((task) => task.labels ?? []))].sort(
    (a, b) => a.localeCompare(b, "ro"),
  );
  const filtered = hasTaskFilters(view);
  return (
    <div className="next-filters">
      <div className="next-filter-fields">
        <label>
          Caută task-uri
          <input
            type="search"
            value={view.query}
            onChange={(e) => onChange({ ...view, query: e.target.value })}
            placeholder="Titlu sau etichetă"
          />
        </label>
        <label>
          Ordine
          <select
            value={view.sort}
            onChange={(e) =>
              onChange({ ...view, sort: e.target.value as TaskView["sort"] })
            }
          >
            {Object.entries(TASK_SORTS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <details>
        <summary>
          Filtre{" "}
          {filtered && <span className="workspace-priority">Active</span>}
        </summary>
        <div className="next-filter-fields">
          <label>
            Prioritate
            <select
              value={view.priority}
              onChange={(e) => onChange({ ...view, priority: e.target.value })}
            >
              <option value="">Toate prioritățile</option>
              <option value="none">Fără prioritate</option>
              {TASK_PRIORITIES.map((priority) => (
                <option key={priority}>{priority}</option>
              ))}
            </select>
          </label>
          <label>
            Etichetă
            <select
              value={view.label}
              onChange={(e) => onChange({ ...view, label: e.target.value })}
            >
              <option value="">Toate etichetele</option>
              {view.label && !labels.includes(view.label) && (
                <option>{view.label}</option>
              )}
              {labels.map((label) => (
                <option key={label}>{label}</option>
              ))}
            </select>
          </label>
          <label>
            Stare
            <select
              value={view.status}
              onChange={(e) => onChange({ ...view, status: e.target.value })}
            >
              <option value="">Toate stările</option>
              <option value="open">Nefinalizate</option>
              <option value="done">Finalizate</option>
            </select>
          </label>
          <label>
            Tip de durată
            <select
              value={view.basis}
              onChange={(e) =>
                onChange({
                  ...view,
                  basis: e.target.value as TaskView["basis"],
                })
              }
            >
              <option value="estimatedMinutes">Estimare</option>
              <option value="actualMinutes">Timp efectiv</option>
            </select>
          </label>
          <label>
            Durată
            <select
              value={view.duration}
              onChange={(e) =>
                onChange({
                  ...view,
                  duration: e.target.value as TaskView["duration"],
                })
              }
            >
              {Object.entries(TASK_DURATIONS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </details>
      <div className="next-filter-footer">
        <span role="status">
          {shown} din {tasks.length} task-uri
        </span>
        {(filtered || view.sort !== "manual") && (
          <button type="button" onClick={() => onChange(DEFAULT_TASK_VIEW)}>
            Resetează vizualizarea
          </button>
        )}
      </div>
      {(filtered || view.sort !== "manual") && (
        <p className="time-help">
          Pentru a muta cardurile, revino la ordinea manuală și resetează
          filtrele.
        </p>
      )}
    </div>
  );
}
