import { test } from "node:test";
import assert from "node:assert/strict";
import {
  amountToCents,
  totals,
  parseStore,
  newIdea,
  durationFromParts,
  formatDuration,
  ideaTime,
  validDate,
  validTime,
  calculateBreakEven,
  getItemSlots,
} from "../src/lib/model.ts";
test("sume RON exacte și validare", () => {
  assert.equal(amountToCents("10,23"), 1023);
  assert.equal(amountToCents("0.10") + amountToCents("0.20"), 30);
  for (const v of ["-1", "NaN", "1.234", "", "1e3"])
    assert.throws(() => amountToCents(v));
});
test("profitul include cheltuieli și poate fi negativ", () => {
  const i = newIdea("Test");
  i.entries = [
    {
      id: "a",
      kind: "income",
      cents: 100,
      date: "2026-11-03",
      label: "vânzare",
    },
    { id: "b", kind: "expense", cents: 250, date: "2026-11-03", label: "cost" },
  ];
  assert.deepEqual(totals(i), { income: 100, expense: 250, profit: -150 });
});
test("backup round trip și respingerea datelor incompatibile", () => {
  const s = { version: 1, ideas: [newIdea("Test")] };
  assert.deepEqual(parseStore(JSON.stringify(s)), s);
  assert.throws(() => parseStore("{"));
  assert.throws(() => parseStore('{"version":2,"ideas":[]}'));
  s.ideas[0].goalCents = -10;
  assert.throws(() => parseStore(JSON.stringify(s)));
});
test("ID duplicate și tranzacții corupte sunt respinse", () => {
  const i = newIdea("Test");
  assert.throws(() =>
    parseStore(JSON.stringify({ version: 1, ideas: [i, i] })),
  );
  i.entries = [
    { id: "x", kind: "income", cents: 0.5, date: "2026-11-03", label: "x" },
  ];
  assert.throws(() => parseStore(JSON.stringify({ version: 1, ideas: [i] })));
});

test("durate în minute: validare, zero și câmpuri goale", () => {
  assert.equal(durationFromParts("2", "15"), 135);
  assert.equal(durationFromParts("", ""), null);
  assert.equal(durationFromParts("0", "0"), 0);
  assert.equal(formatDuration(135), "2 h 15 min");
  assert.equal(formatDuration(0), "0 min");
  for (const [h, m] of [
    ["-1", "0"],
    ["1.5", "0"],
    ["1", "60"],
    ["87600", "1"],
    ["NaN", ""],
  ])
    assert.throws(() => durationFromParts(h, m));
});
test("totalurile nu dublează estimarea și adună doar efortul suplimentar", () => {
  const i = newIdea("Timp");
  assert.equal(ideaTime(i).actual, null);
  i.tasks = [
    {
      id: "t",
      title: "Pas",
      done: false,
      estimatedMinutes: 90,
      actualMinutes: 60,
    },
    { id: "u", title: "Alt pas", done: true },
  ];
  assert.equal(ideaTime(i).estimated, 90);
  i.estimatedMinutes = 120;
  i.actualMinutes = 15;
  assert.equal(ideaTime(i).estimated, 120);
  assert.equal(ideaTime(i).actual, 75);
  i.estimatedMinutes = 0;
  assert.equal(ideaTime(i).estimated, 0);
});
test("backup vechi neschimbat și durate invalide respinse pe idee și task", () => {
  const i = newIdea("Vechi");
  i.tasks = [{ id: "t", title: "Pas", done: false }];
  const old = { version: 1, ideas: [i] };
  assert.deepEqual(parseStore(JSON.stringify(old)), old);
  for (const v of [-1, 1.5, "60", 5256001]) {
    assert.throws(() =>
      parseStore(
        JSON.stringify({ version: 1, ideas: [{ ...i, actualMinutes: v }] }),
      ),
    );
    assert.throws(() =>
      parseStore(
        JSON.stringify({
          version: 1,
          ideas: [{ ...i, tasks: [{ ...i.tasks[0], estimatedMinutes: v }] }],
        }),
      ),
    );
  }
});

test("validDate validează corect formatul YYYY-MM-DD", () => {
  assert.equal(validDate(null), true);
  assert.equal(validDate(undefined), true);
  assert.equal(validDate("2026-11-04"), true);
  assert.equal(validDate("2026-1-4"), false);
  assert.equal(validDate("invalid"), false);
  assert.equal(validDate(12345), false);
});

test("calculateBreakEven calculează pragul de rentabilitate", () => {
  // Fără cheltuieli -> 0 unități necesare
  assert.deepEqual(calculateBreakEven(0, 10000), {
    unitsNeeded: 0,
    marginPerUnitCents: 10000,
  });

  // Cheltuieli 500 RON (50000 cenți), preț 100 RON, marjă 100 RON -> 5 unități
  assert.deepEqual(calculateBreakEven(50000, 10000), {
    unitsNeeded: 5,
    marginPerUnitCents: 10000,
  });

  // Cheltuieli 500 RON, preț 100 RON, cost variabil 40 RON (4000 cenți) -> marjă 60 RON -> 9 unități rotunjite în sus
  assert.deepEqual(calculateBreakEven(50000, 10000, 4000), {
    unitsNeeded: 9,
    marginPerUnitCents: 6000,
  });

  // Preț <= cost -> null (marjă zero sau negativă)
  assert.equal(calculateBreakEven(50000, 10000, 10000), null);
  assert.equal(calculateBreakEven(50000, 10000, 12000), null);
  assert.equal(calculateBreakEven(50000, 0), null);
  assert.equal(calculateBreakEven(50000, null), null);
});

test("câmpuri opționale category, preț/cost unitar și scheduledDate", () => {
  const i = newIdea("Idee Extinsă");
  i.category = "Atelier";
  i.unitPriceCents = 15000;
  i.unitCostCents = 5000;
  i.scheduledDate = "2026-11-05";

  const store = { version: 1 as const, ideas: [i] };
  const parsed = parseStore(JSON.stringify(store));
  assert.deepEqual(parsed, store);

  // Invalide
  assert.throws(() =>
    parseStore(
      JSON.stringify({
        version: 1,
        ideas: [{ ...i, category: "x".repeat(101) }],
      }),
    ),
  );
  assert.throws(() =>
    parseStore(
      JSON.stringify({
        version: 1,
        ideas: [{ ...i, unitPriceCents: -50 }],
      }),
    ),
  );
  assert.throws(() =>
    parseStore(
      JSON.stringify({
        version: 1,
        ideas: [{ ...i, scheduledDate: "2026/11/05" }],
      }),
    ),
  );
});

test("validTime validează formatul HH:MM", () => {
  assert.equal(validTime(null), true);
  assert.equal(validTime(undefined), true);
  assert.equal(validTime("09:30"), true);
  assert.equal(validTime("14:00"), true);
  assert.equal(validTime("23:59"), true);
  assert.equal(validTime("24:00"), false);
  assert.equal(validTime("14:60"), false);
  assert.equal(validTime("9:30"), false);
  assert.equal(validTime("invalid"), false);
});

test("task-urile suportă programare cu data și ora exactă", () => {
  const i = newIdea("Task cu oră");
  i.tasks = [
    {
      id: "t1",
      title: "Comandă ață",
      done: false,
      scheduledDate: "2026-11-04",
      scheduledTime: "14:30",
    },
  ];
  const s = { version: 1 as const, ideas: [i] };
  assert.deepEqual(parseStore(JSON.stringify(s)), s);

  // Oră invalidă
  assert.throws(() =>
    parseStore(
      JSON.stringify({
        version: 1,
        ideas: [
          {
            ...i,
            tasks: [{ ...i.tasks[0], scheduledTime: "25:00" }],
          },
        ],
      }),
    ),
  );
});

test("getItemSlots și programare multiplă pe idee și task", () => {
  const i = newIdea("Recurent");
  i.schedule = [
    { id: "s1", date: "2026-11-04", time: "09:00", endTime: "10:30" },
    { id: "s2", date: "2026-11-06", time: "15:30", endTime: null },
    { id: "s3", date: "2026-11-10", time: null },
  ];
  i.tasks = [
    {
      id: "t1",
      title: "Design",
      done: false,
      schedule: [
        { id: "ts1", date: "2026-11-04", time: "10:00", endTime: "11:00" },
        { id: "ts2", date: "2026-11-05", time: "14:00" },
      ],
    },
  ];

  const s = { version: 1 as const, ideas: [i] };
  assert.deepEqual(parseStore(JSON.stringify(s)), s);

  assert.equal(getItemSlots(i).length, 3);
  assert.equal(getItemSlots(i.tasks[0]).length, 2);

  // Fallback pe scheduledDate vechi
  const legacy = { scheduledDate: "2026-11-04", scheduledTime: "12:00" };
  assert.deepEqual(getItemSlots(legacy), [
    { id: "legacy", date: "2026-11-04", time: "12:00" },
  ]);

  // EndTime invalid
  assert.throws(() =>
    parseStore(
      JSON.stringify({
        version: 1,
        ideas: [
          {
            ...i,
            tasks: [
              {
                ...i.tasks[0],
                schedule: [
                  { id: "ts1", date: "2026-11-04", time: "10:00", endTime: "99:99" },
                ],
              },
            ],
          },
        ],
      }),
    ),
  );
});
