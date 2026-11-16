"use client";
import Reorder from "./reorder";
import type { TaskStep } from "@/lib/model";

export default function TaskSteps({
  steps,
  onChange,
  disabled,
}: {
  steps: TaskStep[];
  onChange: (steps: TaskStep[]) => void;
  disabled: boolean;
}) {
  return (
    <section className="task-steps">
      <h3>Subpași</h3>
      <Reorder items={steps} onChange={onChange} disabled={disabled}>
        {(step) => (
          <div className="task">
            <label className="check">
              <input
                type="checkbox"
                checked={step.done}
                onChange={(e) =>
                  onChange(
                    steps.map((item) =>
                      item.id === step.id
                        ? { ...item, done: e.target.checked }
                        : item,
                    ),
                  )
                }
              />
              {step.title}
            </label>
            <button
              type="button"
              aria-label={`Șterge subpasul ${step.title}`}
              onClick={() =>
                onChange(steps.filter((item) => item.id !== step.id))
              }
            >
              ×
            </button>
          </div>
        )}
      </Reorder>
      <form
        className="inline"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const title = String(new FormData(form).get("title")).trim();
          if (!title || steps.length >= 100 || disabled) return;
          onChange([...steps, { id: crypto.randomUUID(), title, done: false }]);
          form.reset();
        }}
      >
        <input
          name="title"
          aria-label="Subpas nou"
          placeholder="Subpas nou…"
          maxLength={200}
          required
          disabled={steps.length >= 100}
        />
        <button disabled={steps.length >= 100}>Adaugă subpas</button>
      </form>
    </section>
  );
}
