import { test } from "node:test";
import assert from "node:assert/strict";
import { type Task } from "../src/lib/model.ts";
import {
  DEFAULT_TASK_VIEW,
  hasTaskFilters,
  visibleTasks,
} from "../src/lib/task-view.ts";
test("task filters intersect and keep absent durations distinct from zero", () => {
  const tasks: Task[] = [
    {
      id: "a",
      title: "Pagină",
      done: false,
      priority: "Ridicată",
      labels: ["Web"],
      estimatedMinutes: 0,
    },
    {
      id: "b",
      title: "Logo",
      done: false,
      priority: "Ridicată",
      labels: ["Web"],
    },
    {
      id: "c",
      title: "Text",
      done: true,
      priority: "Medie",
      labels: ["Web"],
      estimatedMinutes: 45,
    },
  ];
  const view = {
    ...DEFAULT_TASK_VIEW,
    priority: "Ridicată",
    label: "Web",
    duration: "short" as const,
  };
  assert.equal(hasTaskFilters(view), true);
  assert.deepEqual(
    visibleTasks(tasks, view).map((task) => task.id),
    ["a"],
  );
  assert.deepEqual(
    visibleTasks(tasks, { ...DEFAULT_TASK_VIEW, sort: "estimated" }).map(
      (task) => task.id,
    ),
    ["a", "c", "b"],
  );
  assert.deepEqual(
    tasks.map((task) => task.id),
    ["a", "b", "c"],
  );
});
