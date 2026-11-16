"use client";
import { useId, useState } from "react";
import { durationFromParts, type Duration } from "@/lib/model";
export default function TimeEditor({
  value,
  onSave,
  idea = false,
}: {
  value: Duration;
  onSave: (value: Duration) => void;
  idea?: boolean;
}) {
  const id = useId();
  const [error, setError] = useState("");
  return (
    <form
      className="time-editor"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        try {
          const estimatedMinutes = durationFromParts(
            String(data.get("estimate-hours")),
            String(data.get("estimate-minutes")),
          );
          const actualMinutes = durationFromParts(
            String(data.get("actual-hours")),
            String(data.get("actual-minutes")),
          );
          onSave({ estimatedMinutes, actualMinutes });
          setError("");
        } catch (err) {
          setError((err as Error).message);
        }
      }}
    >
      <div className="time-fields">
        {(["estimate", "actual"] as const).map((kind) => {
          const minutes =
            kind === "estimate" ? value.estimatedMinutes : value.actualMinutes;
          return (
            <fieldset key={kind}>
              <legend>
                {kind === "estimate"
                  ? idea
                    ? "Estimare totală pentru idee"
                    : "Timp estimat"
                  : idea
                    ? "Timp suplimentar, în afara task-urilor"
                    : "Timp efectiv"}
              </legend>
              <div className="time-parts">
                {(["hours", "minutes"] as const).map((part) => (
                  <label key={part} htmlFor={`${id}-${kind}-${part}`}>
                    {part === "hours" ? "Ore" : "Minute"}
                    <input
                      id={`${id}-${kind}-${part}`}
                      name={`${kind}-${part}`}
                      type="number"
                      min="0"
                      max={part === "minutes" ? 59 : 87600}
                      step="1"
                      inputMode="numeric"
                      defaultValue={
                        minutes == null
                          ? ""
                          : part === "hours"
                            ? Math.floor(minutes / 60)
                            : minutes % 60
                      }
                    />
                  </label>
                ))}
              </div>
            </fieldset>
          );
        })}
      </div>
      <p className="time-help">
        Câmpurile goale înseamnă timp nespecificat; 0 înseamnă zero minute.
      </p>
      <p role="status" aria-live="polite">
        {error}
      </p>
      <button type="submit">Salvează timpul</button>
    </form>
  );
}
