export const FIELD_TYPES = {
  text: "Text",
  number: "Număr",
  date: "Dată",
  select: "Selecție",
} as const;
export type Field = {
  id: string;
  label: string;
  kind: keyof typeof FIELD_TYPES;
  required: boolean;
  options: string[];
};
export type RecordValues = Record<string, string>;
export type SavedView = {
  name: string;
  layout: "table" | "cards";
  field: string;
  query: string;
  descending: boolean;
};
export type PageData = {
  fields: Field[];
  values: RecordValues;
  responses: { id: string; values: RecordValues }[];
  views: SavedView[];
};
export function validFieldValue(field: Field, value: string) {
  if (!value) return true;
  if (value.length > 2000) return false;
  if (field.kind === "number")
    return /^-?\d+(\.\d+)?$/.test(value) && Number.isFinite(Number(value));
  if (field.kind === "date")
    return (
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      Number.isFinite(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value
    );
  if (field.kind === "select") return field.options.includes(value);
  return value.length <= 2000;
}
export function validPageData(data: PageData): boolean {
  if (
    !data ||
    !Array.isArray(data.fields) ||
    data.fields.length > 30 ||
    !Array.isArray(data.responses) ||
    data.responses.length > 1000 ||
    !Array.isArray(data.views) ||
    data.views.length > 20
  )
    return false;
  const index = new Map<string, Field>();
  for (const f of data.fields) {
    if (
      !f ||
      typeof f.id !== "string" ||
      index.has(f.id) ||
      typeof f.label !== "string" ||
      !f.label.trim() ||
      f.label.length > 80 ||
      !Object.hasOwn(FIELD_TYPES, f.kind) ||
      typeof f.required !== "boolean" ||
      !Array.isArray(f.options) ||
      f.options.length > 25 ||
      f.options.some(
        (o) => typeof o !== "string" || !o.trim() || o.length > 80,
      ) ||
      (f.kind === "select" && !f.options.length)
    )
      return false;
    index.set(f.id, f);
  }
  const values = (v: RecordValues) =>
    !!v &&
    typeof v === "object" &&
    !Array.isArray(v) &&
    Object.entries(v).every(([id, value]) => {
      const field = index.get(id);
      return (
        !!field && typeof value === "string" && validFieldValue(field, value)
      );
    });
  const ids = new Set<string>();
  return (
    values(data.values) &&
    data.responses.every((r) => {
      if (!r || typeof r.id !== "string" || ids.has(r.id) || !values(r.values))
        return false;
      ids.add(r.id);
      return true;
    }) &&
    data.views.every(
      (v) =>
        !!v &&
        typeof v.name === "string" &&
        !!v.name.trim() &&
        v.name.length <= 80 &&
        ["table", "cards"].includes(v.layout) &&
        (v.field === "" || index.has(v.field)) &&
        typeof v.query === "string" &&
        v.query.length <= 200 &&
        typeof v.descending === "boolean",
    )
  );
}
