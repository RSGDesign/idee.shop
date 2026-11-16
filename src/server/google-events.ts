import { getItemSlots, occurrencesOn, type Store } from "../lib/model.ts";

const DAY = 86400000;
export function googleEvents(store: Store, today: string, zone: string) {
  const events = new Map<string, object>();
  function add(
    key: string[],
    title: string,
    date: string,
    time?: string | null,
    endTime?: string | null,
  ) {
    const midnight = new Date(date + "T00:00:00Z");
    if (
      !Number.isFinite(+midnight) ||
      midnight.toISOString().slice(0, 10) !== date
    )
      throw new Error("Dată de programare invalidă.");
    const end = time ? new Date(date + "T" + time + ":00Z") : midnight;
    end.setTime(+end + (time ? 30 * 60000 : DAY));
    events.set(JSON.stringify(key), {
      summary: title.slice(0, 500),
      start: time
        ? { dateTime: date + "T" + time + ":00", timeZone: zone }
        : { date },
      end: time
        ? {
            dateTime:
              endTime && endTime > time
                ? date + "T" + endTime + ":00"
                : end.toISOString().slice(0, 19),
            timeZone: zone,
          }
        : { date: end.toISOString().slice(0, 10) },
    });
    if (events.size > 1000)
      throw new Error(
        "Prea multe evenimente pentru o singură sincronizare (maximum 1.000).",
      );
  }
  const days = Array.from({ length: 91 }, (_, i) =>
    new Date(Date.parse(today + "T00:00:00Z") + i * DAY)
      .toISOString()
      .slice(0, 10),
  );
  for (const idea of store.ideas) {
    for (const slot of getItemSlots(idea))
      add(
        [idea.id, "idea", slot.id],
        idea.title,
        slot.date,
        slot.time,
        slot.endTime,
      );
    for (const task of idea.tasks) {
      for (const slot of getItemSlots(task))
        add(
          [idea.id, "task", task.id, slot.id],
          task.title,
          slot.date,
          slot.time,
          slot.endTime,
        );
      if (task.recurrence)
        for (const date of days)
          for (const original of occurrencesOn(task.recurrence, date))
            add([idea.id, "repeat", task.id, original], task.title, date);
    }
  }
  return events;
}
