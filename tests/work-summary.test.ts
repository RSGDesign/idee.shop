import { test } from "node:test";
import assert from "node:assert/strict";
import {
  newIdea,
  parseStore,
  workSummary,
  type Store,
} from "../src/lib/model.ts";

test("totalul păstrează timpul istoric al task-urilor și aplică tariful configurat", () => {
  const idea = newIdea("Atelier");
  idea.actualMinutes = 60;
  idea.tasks = [
    {
      id: "t",
      title: "Pregătire",
      done: false,
      estimatedMinutes: 90,
      actualMinutes: 15,
    },
  ];
  const store: Store = { version: 1, ideas: [idea] };
  assert.deepEqual(workSummary(store), {
    minutes: 75,
    hourlyRateCents: 1000,
    valueCents: 1250,
  });
  const configured = parseStore(
    JSON.stringify({ ...store, hourlyRateCents: 2000 }),
  );
  assert.equal(workSummary(configured).valueCents, 2500);
  assert.equal(workSummary({ ...store, hourlyRateCents: 0 }).valueCents, 0);
  assert.throws(() =>
    parseStore(JSON.stringify({ ...store, hourlyRateCents: -1 })),
  );
});
