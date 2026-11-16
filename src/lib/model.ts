import { validPages, type IdeaPage } from "./idea-pages.ts";
export type ScheduleSlot = {
  id: string;
  date: string;
  time?: string | null;
  endTime?: string | null;
};
export type Duration = {
  estimatedMinutes?: number | null;
  actualMinutes?: number | null;
};
export const TASK_PRIORITIES = ["Ridicată", "Medie", "Scăzută"] as const;
export type Occurrence = { done?: boolean; date?: string | null };
export type Recurrence = {
  frequency: "daily" | "weekly" | "monthly";
  interval: number;
  start: string;
  end: string;
  exceptions: Record<string, Occurrence>;
};
export type TaskStep = { id: string; title: string; done: boolean };
export type Task = Duration & {
  id: string;
  title: string;
  done: boolean;
  priority?: (typeof TASK_PRIORITIES)[number];
  labels?: string[];
  steps?: TaskStep[];
  recurrence?: Recurrence;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  schedule?: ScheduleSlot[];
};
export type Entry = {
  id: string;
  kind: "income" | "expense";
  cents: number;
  date: string;
  label: string;
};
export type Idea = Duration & {
  id: string;
  title: string;
  description: string;
  status: "Nouă" | "În lucru" | "Validată" | "Arhivată";
  potential: string;
  goalCents: number;
  notes: string;
  pages?: IdeaPage[];
  pinned: boolean;
  tasks: Task[];
  entries: Entry[];
  category?: string;
  unitPriceCents?: number | null;
  unitCostCents?: number | null;
  scheduledDate?: string | null;
  schedule?: ScheduleSlot[];
};
export type Store = { version: 1; ideas: Idea[]; hourlyRateCents?: number };
export const KEY = "idee.shop.v1";
export function amountToCents(value: string): number {
  if (!/^\d{1,9}([.,]\d{1,2})?$/.test(value.trim()))
    throw new Error("Folosește o sumă pozitivă, cu maximum două zecimale.");
  return Math.round(Number(value.replace(",", ".")) * 100);
}
export function totals(idea: Idea) {
  const income = idea.entries
    .filter((e) => e.kind === "income")
    .reduce((s, e) => s + e.cents, 0);
  const expense = idea.entries
    .filter((e) => e.kind === "expense")
    .reduce((s, e) => s + e.cents, 0);
  return { income, expense, profit: income - expense };
}
export function parseStore(raw: string): Store {
  const data = JSON.parse(raw);
  const text = (v: unknown) => typeof v === "string" && v.length <= 50000;
  const money = (v: unknown) =>
    Number.isSafeInteger(v) && Number(v) >= 0 && Number(v) <= 99999999999;
  if (
    data?.version !== 1 ||
    (data.hourlyRateCents !== undefined && !money(data.hourlyRateCents)) ||
    !Array.isArray(data.ideas) ||
    data.ideas.length > 5000
  )
    throw new Error("Backup incompatibil.");
  const ids = new Set<string>();
  for (const i of data.ideas) {
    if (
      !i ||
      !text(i.id) ||
      ids.has(i.id) ||
      !text(i.title) ||
      !i.title.trim() ||
      !text(i.description) ||
      !text(i.notes) ||
      (i.pages !== undefined && !validPages(i.pages)) ||
      !text(i.potential) ||
      !["Nouă", "În lucru", "Validată", "Arhivată"].includes(i.status) ||
      !money(i.goalCents) ||
      !validDuration(i.estimatedMinutes) ||
      !validDuration(i.actualMinutes) ||
      typeof i.pinned !== "boolean" ||
      !Array.isArray(i.tasks) ||
      !Array.isArray(i.entries) ||
      (i.category != null && (!text(i.category) || i.category.length > 100)) ||
      (i.unitPriceCents != null && !money(i.unitPriceCents)) ||
      (i.unitCostCents != null && !money(i.unitCostCents)) ||
      (i.scheduledDate != null &&
        (!text(i.scheduledDate) ||
          !/^\d{4}-\d{2}-\d{2}$/.test(i.scheduledDate))) ||
      (i.schedule != null &&
        (!Array.isArray(i.schedule) ||
          i.schedule.some(
            (s: ScheduleSlot) =>
              !s ||
              !text(s.id) ||
              !text(s.date) ||
              !/^\d{4}-\d{2}-\d{2}$/.test(s.date) ||
              (s.time != null &&
                (!text(s.time) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(s.time))) ||
              (s.endTime != null &&
                (!text(s.endTime) ||
                  !/^([01]\d|2[0-3]):[0-5]\d$/.test(s.endTime))),
          )))
    )
      throw new Error("Idee invalidă în backup.");
    ids.add(i.id);
    if (
      i.tasks.some(
        (t: Task) =>
          !t ||
          !text(t.id) ||
          !text(t.title) ||
          typeof t.done !== "boolean" ||
          (t.steps !== undefined &&
            (!Array.isArray(t.steps) ||
              t.steps.length > 100 ||
              t.steps.some(
                (step) =>
                  !step ||
                  typeof step.id !== "string" ||
                  !step.id ||
                  typeof step.title !== "string" ||
                  !step.title.trim() ||
                  step.title.length > 200 ||
                  typeof step.done !== "boolean",
              ) ||
              new Set(t.steps.map((step) => step.id)).size !==
                t.steps.length)) ||
          (t.recurrence !== undefined && !validRecurrence(t.recurrence)) ||
          (t.priority !== undefined && !TASK_PRIORITIES.includes(t.priority)) ||
          (t.labels !== undefined &&
            (!Array.isArray(t.labels) ||
              t.labels.length > 8 ||
              t.labels.some(
                (label) =>
                  typeof label !== "string" ||
                  !label.trim() ||
                  label.length > 32,
              ))) ||
          !validDuration(t.estimatedMinutes) ||
          !validDuration(t.actualMinutes) ||
          (t.scheduledDate != null &&
            (!text(t.scheduledDate) ||
              !/^\d{4}-\d{2}-\d{2}$/.test(t.scheduledDate))) ||
          (t.scheduledTime != null &&
            (!text(t.scheduledTime) ||
              !/^([01]\d|2[0-3]):[0-5]\d$/.test(t.scheduledTime))) ||
          (t.schedule != null &&
            (!Array.isArray(t.schedule) ||
              t.schedule.some(
                (s: ScheduleSlot) =>
                  !s ||
                  !text(s.id) ||
                  !text(s.date) ||
                  !/^\d{4}-\d{2}-\d{2}$/.test(s.date) ||
                  (s.time != null &&
                    (!text(s.time) ||
                      !/^([01]\d|2[0-3]):[0-5]\d$/.test(s.time))) ||
                  (s.endTime != null &&
                    (!text(s.endTime) ||
                      !/^([01]\d|2[0-3]):[0-5]\d$/.test(s.endTime))),
              ))),
      )
    )
      throw new Error("Task invalid.");
    if (
      i.entries.some(
        (e: Entry) =>
          !e ||
          !text(e.id) ||
          !text(e.label) ||
          !["income", "expense"].includes(e.kind) ||
          !money(e.cents) ||
          !/^\d{4}-\d{2}-\d{2}$/.test(e.date),
      )
    )
      throw new Error("Tranzacție invalidă.");
  }
  return data as Store;
}
export function newIdea(title: string): Idea {
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    description: "",
    status: "Nouă",
    potential: "",
    goalCents: 0,
    notes: "",
    pinned: true,
    tasks: [],
    entries: [],
  };
}

export const MAX_TIME_MINUTES = 5_256_000;
export function validDuration(value: unknown): boolean {
  return (
    value == null ||
    (Number.isSafeInteger(value) &&
      Number(value) >= 0 &&
      Number(value) <= MAX_TIME_MINUTES)
  );
}
export function durationFromParts(
  hours: string,
  minutes: string,
): number | null {
  if (!hours.trim() && !minutes.trim()) return null;
  if (
    ![hours, minutes].every((v) => /^\d*$/.test(v.trim())) ||
    Number(minutes) > 59
  )
    throw new Error("Completează ore întregi și minute între 0 și 59.");
  const value = Number(hours) * 60 + Number(minutes);
  if (!validDuration(value))
    throw new Error("Durata este prea mare (maximum 87.600 ore).");
  return value;
}
export function formatDuration(value: number | null | undefined): string {
  if (value == null) return "Nespecificat";
  const hours = Math.floor(value / 60),
    minutes = value % 60;
  return hours
    ? `${hours} h${minutes ? ` ${minutes} min` : ""}`
    : `${minutes} min`;
}
export function ideaTime(idea: Idea) {
  const sum = (key: keyof Duration) => {
    const values = idea.tasks.flatMap((t) => (t[key] == null ? [] : [t[key]!]));
    return values.length ? values.reduce((a, b) => a + b, 0) : null;
  };
  const taskEstimated = sum("estimatedMinutes"),
    taskActual = sum("actualMinutes");
  return {
    estimated: idea.estimatedMinutes ?? taskEstimated,
    actual:
      idea.actualMinutes == null && taskActual == null
        ? null
        : (idea.actualMinutes ?? 0) + (taskActual ?? 0),
    taskEstimated,
    taskActual,
  };
}

export function validDate(value: unknown): boolean {
  return (
    value == null ||
    (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value))
  );
}

export function validTime(value: unknown): boolean {
  return (
    value == null ||
    (typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value))
  );
}

export function calculateBreakEven(
  totalExpenseCents: number,
  unitPriceCents: number | null | undefined,
  unitCostCents?: number | null | undefined,
): { unitsNeeded: number; marginPerUnitCents: number } | null {
  if (!unitPriceCents || unitPriceCents <= 0) return null;
  const cost = unitCostCents && unitCostCents > 0 ? unitCostCents : 0;
  const margin = unitPriceCents - cost;
  if (margin <= 0) return null;
  if (totalExpenseCents <= 0)
    return { unitsNeeded: 0, marginPerUnitCents: margin };
  const unitsNeeded = Math.ceil(totalExpenseCents / margin);
  return { unitsNeeded, marginPerUnitCents: margin };
}

export function getItemSlots(item: {
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  schedule?: ScheduleSlot[];
}): ScheduleSlot[] {
  const result: ScheduleSlot[] = [];
  if (Array.isArray(item.schedule)) {
    for (const slot of item.schedule) {
      if (slot && slot.date) result.push(slot);
    }
  }
  if (
    item.scheduledDate &&
    !result.some(
      (s) =>
        s.date === item.scheduledDate &&
        (s.time ?? null) === (item.scheduledTime ?? null),
    )
  ) {
    result.push({
      id: "legacy",
      date: item.scheduledDate,
      time: item.scheduledTime ?? null,
    });
  }
  return result;
}

function calendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !validDate(value)) return false;
  const date = new Date(value + "T00:00:00Z");
  return Number.isFinite(+date) && date.toISOString().slice(0, 10) === value;
}

export function validRecurrence(value: Recurrence): boolean {
  return (
    !!value &&
    ["daily", "weekly", "monthly"].includes(value.frequency) &&
    Number.isInteger(value.interval) &&
    value.interval >= 1 &&
    value.interval <= 365 &&
    calendarDate(value.start) &&
    calendarDate(value.end) &&
    value.start <= value.end &&
    !!value.exceptions &&
    typeof value.exceptions === "object" &&
    !Array.isArray(value.exceptions) &&
    Object.entries(value.exceptions).every(
      ([key, exception]) =>
        calendarDate(key) &&
        !!exception &&
        typeof exception === "object" &&
        (exception.done === undefined || typeof exception.done === "boolean") &&
        (exception.date == null || calendarDate(exception.date)),
    )
  );
}

export function occursOn(rule: Recurrence, day: string): boolean {
  if (day < rule.start || day > rule.end) return false;
  const start = new Date(rule.start + "T00:00:00Z");
  const target = new Date(day + "T00:00:00Z");
  if (rule.frequency === "monthly") {
    const months =
      (target.getUTCFullYear() - start.getUTCFullYear()) * 12 +
      target.getUTCMonth() -
      start.getUTCMonth();
    const last = new Date(target);
    last.setUTCMonth(last.getUTCMonth() + 1, 0);
    return (
      months % rule.interval === 0 &&
      target.getUTCDate() === Math.min(start.getUTCDate(), last.getUTCDate())
    );
  }
  const days = (+target - +start) / 86400000;
  return days % (rule.interval * (rule.frequency === "weekly" ? 7 : 1)) === 0;
}

export function occurrencesOn(rule: Recurrence, day: string): string[] {
  const dates =
    occursOn(rule, day) && rule.exceptions[day]?.date === undefined
      ? [day]
      : [];
  return dates.concat(
    Object.keys(rule.exceptions).filter(
      (key) => rule.exceptions[key].date === day && occursOn(rule, key),
    ),
  );
}

export const DEFAULT_HOURLY_RATE_CENTS = 1000;

export function workSummary(store: Store) {
  const minutes = store.ideas.reduce(
    (sum, idea) => sum + (ideaTime(idea).actual ?? 0),
    0,
  );
  const hourlyRateCents = store.hourlyRateCents ?? DEFAULT_HOURLY_RATE_CENTS;
  const valueCents = Number(
    (BigInt(minutes) * BigInt(hourlyRateCents) + BigInt(30)) / BigInt(60),
  );
  return { minutes, hourlyRateCents, valueCents };
}
