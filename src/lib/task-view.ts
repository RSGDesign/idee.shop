import { TASK_PRIORITIES, type Task } from "./model.ts";

export const TASK_SORTS = {
  manual: "Manuală",
  title: "Titlu A–Z",
  priority: "Prioritate ridicată întâi",
  estimated: "Timp estimat, crescător",
  actual: "Timp efectiv, crescător",
} as const;

export const TASK_DURATIONS = {
  any: "Orice durată",
  short: "Sub 30 min",
  medium: "30–59 min",
  long: "Cel puțin 1 h",
  missing: "Nespecificat",
} as const;

export const DEFAULT_TASK_VIEW = {
  query: "",
  priority: "",
  label: "",
  status: "",
  duration: "any" as keyof typeof TASK_DURATIONS,
  basis: "estimatedMinutes" as "estimatedMinutes" | "actualMinutes",
  sort: "manual" as keyof typeof TASK_SORTS,
};

export type TaskView = typeof DEFAULT_TASK_VIEW;
const durations = {
  any: () => true,
  short: (value: number | null | undefined) => value != null && value < 30,
  medium: (value: number | null | undefined) =>
    value != null && value >= 30 && value < 60,
  long: (value: number | null | undefined) => value != null && value >= 60,
  missing: (value: number | null | undefined) => value == null,
};

export function hasTaskFilters(view: TaskView) {
  return Boolean(
    view.query.trim() ||
    view.priority ||
    view.label ||
    view.status ||
    view.duration !== "any",
  );
}

export function visibleTasks(tasks: Task[], view: TaskView) {
  const query = view.query.trim().toLocaleLowerCase("ro");
  const result = tasks.filter(
    (task) =>
      (!query ||
        [task.title, ...(task.labels ?? [])].some((value) =>
          value.toLocaleLowerCase("ro").includes(query),
        )) &&
      (!view.priority || (task.priority ?? "none") === view.priority) &&
      (!view.label || task.labels?.includes(view.label)) &&
      (!view.status || task.done === (view.status === "done")) &&
      durations[view.duration](task[view.basis]),
  );
  const priority = (task: Task) =>
    task.priority
      ? TASK_PRIORITIES.indexOf(task.priority)
      : TASK_PRIORITIES.length;
  const duration = (
    a: number | null | undefined,
    b: number | null | undefined,
  ) => (a == null ? (b == null ? 0 : 1) : b == null ? -1 : a - b);
  switch (view.sort) {
    case "title":
      return result.sort((a, b) =>
        a.title.localeCompare(b.title, "ro", { sensitivity: "base" }),
      );
    case "priority":
      return result.sort((a, b) => priority(a) - priority(b));
    case "estimated":
      return result.sort((a, b) =>
        duration(a.estimatedMinutes, b.estimatedMinutes),
      );
    case "actual":
      return result.sort((a, b) => duration(a.actualMinutes, b.actualMinutes));
    default:
      return result;
  }
}
