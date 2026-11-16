import assert from "node:assert/strict";
import { test } from "node:test";
import {
  newIdea,
  occurrencesOn,
  parseStore,
  validRecurrence,
  type Recurrence,
} from "../src/lib/model.ts";
import { type IdeaPage } from "../src/lib/idea-pages.ts";

test("monthly appearances clamp to the last day and preserve move/skip exceptions", () => {
  const rule: Recurrence = {
    frequency: "monthly",
    interval: 1,
    start: "2028-01-31",
    end: "2028-04-30",
    exceptions: {},
  };
  assert.equal(validRecurrence(rule), true);
  assert.deepEqual(occurrencesOn(rule, "2028-02-29"), ["2028-02-29"]);
  assert.deepEqual(occurrencesOn(rule, "2028-02-28"), []);
  rule.exceptions["2028-02-29"] = { date: "2028-03-02", done: true };
  rule.exceptions["2028-03-31"] = { date: null };
  assert.deepEqual(occurrencesOn(rule, "2028-02-29"), []);
  assert.deepEqual(occurrencesOn(rule, "2028-03-02"), ["2028-02-29"]);
  assert.deepEqual(occurrencesOn(rule, "2028-03-31"), []);
  assert.deepEqual(occurrencesOn(rule, "2028-04-30"), ["2028-04-30"]);
  assert.equal(validRecurrence({ ...rule, start: "2028-02-30" }), false);
});

test("backup round trip for pages, fields and responses; reject cycles and invalid values", () => {
  const idea = newIdea("Idee");
  const root: IdeaPage = {
    id: "root",
    parent: null,
    title: "Principală",
    columns: 1,
    blocks: [],
    data: {
      fields: [
        { id: "f", label: "Cost", kind: "number", required: true, options: [] },
      ],
      values: { f: "25" },
      responses: [{ id: "r", values: { f: "30.5" } }],
      views: [
        {
          name: "Costuri",
          field: "f",
          query: "",
          layout: "table",
          descending: false,
        },
      ],
    },
  };
  const child: IdeaPage = {
    id: "child",
    parent: "root",
    title: "Subpagină",
    columns: 2,
    blocks: [
      {
        id: "b",
        kind: "check",
        text: "Verifică",
        done: false,
        bold: false,
        depth: 0,
        column: 1,
      },
    ],
  };
  idea.pages = [root, child];
  const store = { version: 1, ideas: [idea] };
  assert.deepEqual(parseStore(JSON.stringify(store)), store);
  root.parent = "child";
  assert.throws(() => parseStore(JSON.stringify(store)));
  root.parent = null;
  root.data!.responses[0].values.f = "invalid";
  assert.throws(() => parseStore(JSON.stringify(store)));
});
