"use client";
import { useState } from "react";
import {
  FIELD_TYPES,
  validPageData,
  type Field,
  type PageData,
  type RecordValues,
  type SavedView,
} from "@/lib/page-fields";

const EMPTY: PageData = { fields: [], values: {}, responses: [], views: [] };
const VIEW: SavedView = {
  name: "",
  layout: "table",
  field: "",
  query: "",
  descending: false,
};

function Fields({
  fields,
  values,
  required,
}: {
  fields: Field[];
  values?: RecordValues;
  required?: boolean;
}) {
  return (
    <>
      {fields.map((f) => (
        <label key={f.id}>
          {f.label}
          {f.kind === "select" ? (
            <select
              name={f.id}
              required={required && f.required}
              defaultValue={values?.[f.id] ?? ""}
            >
              <option value="">Alege</option>
              {f.options.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          ) : (
            <input
              name={f.id}
              required={required && f.required}
              type={f.kind}
              step={f.kind === "number" ? "any" : undefined}
              maxLength={2000}
              defaultValue={values?.[f.id] ?? ""}
            />
          )}
        </label>
      ))}
    </>
  );
}

export default function PageFields({
  data = EMPTY,
  onChange,
}: {
  data?: PageData;
  onChange: (data: PageData) => void;
}) {
  const [kind, setKind] = useState<Field["kind"]>("text");
  const [view, setView] = useState(VIEW);
  const [message, setMessage] = useState("");
  function save(next: PageData) {
    if (!validPageData(next)) {
      setMessage("Verifică valorile și limitele formularului.");
      return false;
    }
    onChange(next);
    setMessage("");
    return true;
  }
  function readValues(form: HTMLFormElement) {
    const formData = new FormData(form);
    return Object.fromEntries(
      data.fields.map((f) => [f.id, String(formData.get(f.id) ?? "")]),
    );
  }
  const field = data.fields.find((f) => f.id === view.field);
  const query = view.query.trim().toLocaleLowerCase("ro");
  const rows = data.responses.filter(
    (r) =>
      (field ? [r.values[field.id] ?? ""] : Object.values(r.values)).some((v) =>
        v.toLocaleLowerCase("ro").includes(query),
      ) || !query,
  );
  if (field)
    rows.sort((a, b) => {
      const x = a.values[field.id] ?? "",
        y = b.values[field.id] ?? "";
      const order =
        field.kind === "number"
          ? Number(x) - Number(y)
          : x.localeCompare(y, "ro");
      return view.descending ? -order : order;
    });
  return (
    <section className="page-data">
      <h3>Proprietăți și formular</h3>
      <form
        className="task-metadata"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget,
            d = new FormData(form);
          const options =
            kind === "select"
              ? [
                  ...new Set(
                    String(d.get("options"))
                      .split(",")
                      .map((o) => o.trim())
                      .filter(Boolean),
                  ),
                ]
              : [];
          const f: Field = {
            id: crypto.randomUUID(),
            label: String(d.get("label")).trim(),
            kind,
            options,
            required: d.has("required"),
          };
          if (save({ ...data, fields: [...data.fields, f] })) form.reset();
        }}
      >
        <label>
          Nume câmp
          <input name="label" required maxLength={80} />
        </label>
        <label>
          Tip
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as Field["kind"])}
          >
            {Object.entries(FIELD_TYPES).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {kind === "select" && (
          <label>
            Opțiuni separate prin virgulă
            <input name="options" required maxLength={2000} />
          </label>
        )}
        <label className="check">
          <input name="required" type="checkbox" />
          Obligatoriu în formular
        </label>
        <button>Adaugă câmp</button>
      </form>
      <p role="status">{message}</p>
      {!!data.fields.length && (
        <>
          <details>
            <summary>Gestionează câmpurile</summary>
            {data.fields.map((f) => (
              <form
                key={f.id + f.label}
                className="task-metadata"
                onSubmit={(e) => {
                  e.preventDefault();
                  const d = new FormData(e.currentTarget);
                  save({
                    ...data,
                    fields: data.fields.map((item) =>
                      item.id === f.id
                        ? {
                            ...item,
                            label: String(d.get("label")).trim(),
                            required: d.has("required"),
                          }
                        : item,
                    ),
                  });
                }}
              >
                <label>
                  Nume câmp
                  <input
                    name="label"
                    required
                    maxLength={80}
                    defaultValue={f.label}
                  />
                </label>
                <label className="check">
                  <input
                    name="required"
                    type="checkbox"
                    defaultChecked={f.required}
                  />
                  Obligatoriu
                </label>
                <button>Actualizează</button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      !confirm(
                        "Ștergi câmpul și valorile lui din toate răspunsurile?",
                      )
                    )
                      return;
                    const without = (values: RecordValues) =>
                      Object.fromEntries(
                        Object.entries(values).filter(([id]) => id !== f.id),
                      );
                    if (
                      save({
                        ...data,
                        fields: data.fields.filter((item) => item.id !== f.id),
                        values: without(data.values),
                        responses: data.responses.map((r) => ({
                          ...r,
                          values: without(r.values),
                        })),
                        views: data.views.map((v) =>
                          v.field === f.id ? { ...v, field: "" } : v,
                        ),
                      })
                    )
                      setView((v) =>
                        v.field === f.id ? { ...v, field: "" } : v,
                      );
                  }}
                >
                  Șterge câmpul
                </button>
              </form>
            ))}
          </details>
          <details>
            <summary>Valorile paginii</summary>
            <form
              className="task-metadata"
              onSubmit={(e) => {
                e.preventDefault();
                save({ ...data, values: readValues(e.currentTarget) });
              }}
            >
              <Fields fields={data.fields} values={data.values} />
              <button>Salvează valorile</button>
            </form>
          </details>
          <details>
            <summary>Completează formularul</summary>
            <form
              className="task-metadata"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const values = readValues(form);
                if (
                  data.fields.some(
                    (field) => field.required && !values[field.id].trim(),
                  )
                ) {
                  setMessage("Completează toate câmpurile obligatorii.");
                  return;
                }
                if (
                  save({
                    ...data,
                    responses: [
                      ...data.responses,
                      { id: crypto.randomUUID(), values },
                    ],
                  })
                ) {
                  form.reset();
                  setMessage("Răspuns adăugat.");
                }
              }}
            >
              <Fields fields={data.fields} required />
              <button>Salvează răspunsul</button>
            </form>
          </details>
          <h3>Răspunsuri ({rows.length})</h3>
          <div className="task-metadata">
            <label>
              Vizualizare
              <select
                value={view.layout}
                onChange={(e) =>
                  setView({
                    ...view,
                    layout: e.target.value as SavedView["layout"],
                  })
                }
              >
                <option value="table">Tabel</option>
                <option value="cards">Carduri</option>
              </select>
            </label>
            <label>
              Câmp pentru sortare și filtru
              <select
                value={view.field}
                onChange={(e) => setView({ ...view, field: e.target.value })}
              >
                <option value="">Toate câmpurile</option>
                {data.fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Filtru
              <input
                maxLength={200}
                value={view.query}
                onChange={(e) => setView({ ...view, query: e.target.value })}
              />
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={view.descending}
                onChange={(e) =>
                  setView({ ...view, descending: e.target.checked })
                }
              />
              Descrescător
            </label>
            <form
              className="task-metadata"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget,
                  name = String(new FormData(form).get("name")).trim();
                if (
                  save({
                    ...data,
                    views: [
                      ...data.views.filter((v) => v.name !== name),
                      { ...view, name },
                    ],
                  })
                )
                  form.reset();
              }}
            >
              <label>
                Nume vizualizare
                <input name="name" maxLength={80} required />
              </label>
              <button>Salvează vizualizarea</button>
            </form>
            <label>
              Vizualizări salvate
              <select
                value=""
                onChange={(e) => {
                  const saved = data.views.find(
                    (v) => v.name === e.target.value,
                  );
                  if (saved) setView(saved);
                }}
              >
                <option value="">Alege</option>
                {data.views.map((v) => (
                  <option key={v.name}>{v.name}</option>
                ))}
              </select>
            </label>
          </div>
          {view.layout === "table" ? (
            <div className="page-data-table">
              <table>
                <thead>
                  <tr>
                    {data.fields.map((f) => (
                      <th key={f.id} scope="col">
                        {f.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      {data.fields.map((f) => (
                        <td key={f.id}>{r.values[f.id] || "—"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="task-cards">
              {rows.map((r) => (
                <dl className="workspace-block" key={r.id}>
                  {data.fields.map((f) => (
                    <div key={f.id}>
                      <dt>{f.label}</dt>
                      <dd>{r.values[f.id] || "—"}</dd>
                    </div>
                  ))}
                </dl>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
