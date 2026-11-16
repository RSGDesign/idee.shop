"use client";
import PageFields from "./page-fields";
import { useState } from "react";
import {
  BLOCK_TYPES,
  validPages,
  type Block,
  type BlockKind,
  type IdeaPage,
} from "@/lib/idea-pages";

export default function IdeaPages({
  pages,
  notes,
  onChange,
}: {
  pages: IdeaPage[];
  notes: string;
  onChange: (pages: IdeaPage[]) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [dragged, setDragged] = useState<string | null>(null);
  const page = pages.find((p) => p.id === selected);
  const parent = page?.parent ?? null;
  function commit(next: IdeaPage[]) {
    if (!validPages(next)) {
      setError(
        "Verifică titlurile și ierarhia paginilor. Limita este de 8 niveluri.",
      );
      return false;
    }
    onChange(next);
    setError("");
    return true;
  }
  function edit(patch: Partial<IdeaPage>) {
    return commit(
      pages.map((p) => (p.id === page?.id ? { ...p, ...patch } : p)),
    );
  }
  function blockEdit(id: string, patch: Partial<Block>) {
    if (page)
      edit({
        blocks: page.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
      });
  }
  function moveBlock(id: string, target: string) {
    if (!page || id === target) return;
    const block = page.blocks.find((b) => b.id === id);
    const index = page.blocks.findIndex((b) => b.id === target);
    if (!block || index < 0) return;
    const blocks = page.blocks.filter((b) => b.id !== id);
    blocks.splice(index, 0, { ...block, column: page.blocks[index].column });
    edit({ blocks });
  }
  const ancestors: IdeaPage[] = [];
  let ancestor = page;
  while (ancestor) {
    ancestors.unshift(ancestor);
    ancestor = pages.find((p) => p.id === ancestor?.parent);
  }
  return (
    <section className="modular-pages">
      <h2>Pagini și blocuri</h2>
      <nav aria-label="Ierarhia paginilor">
        <button type="button" onClick={() => setSelected(null)}>
          Pagini
        </button>
        {ancestors.map((p) => (
          <button key={p.id} type="button" onClick={() => setSelected(p.id)}>
            {p.title}
          </button>
        ))}
      </nav>
      <ul>
        {pages
          .filter((p) => p.parent === (page?.id ?? null))
          .map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => setSelected(p.id)}>
                {p.title}
              </button>
            </li>
          ))}
      </ul>
      <form
        className="inline"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const title = String(new FormData(form).get("title")).trim();
          const id = crypto.randomUUID();
          if (
            commit([
              ...pages,
              { id, parent: page?.id ?? null, title, columns: 1, blocks: [] },
            ])
          ) {
            form.reset();
            setSelected(id);
          }
        }}
      >
        <input
          name="title"
          aria-label="Titlul paginii noi"
          maxLength={200}
          required
        />
        <button>{page ? "Adaugă subpagină" : "Adaugă pagină"}</button>
      </form>
      {notes.trim() && (
        <button
          type="button"
          onClick={() => {
            const id = crypto.randomUUID();
            const blocks: Block[] = [];
            let start = 0;
            while (start < notes.length) {
              let end = Math.min(start + 5000, notes.length);
              if (end < notes.length && /[\uD800-\uDBFF]/.test(notes[end - 1]))
                end--;
              blocks.push({
                id: crypto.randomUUID(),
                kind: "text",
                text: notes.slice(start, end),
                depth: 0,
                done: false,
                column: 0,
                bold: false,
              });
              start = end;
            }
            if (
              commit([
                ...pages,
                {
                  id,
                  parent: page?.id ?? null,
                  title: "Note copiate",
                  columns: 1,
                  blocks,
                },
              ])
            )
              setSelected(id);
          }}
        >
          Copiază nota în blocuri
        </button>
      )}
      <p role="status">{error}</p>
      {page && (
        <>
          <form
            className="inline"
            key={page.id + page.title}
            onSubmit={(event) => {
              event.preventDefault();
              edit({
                title: String(
                  new FormData(event.currentTarget).get("title"),
                ).trim(),
              });
            }}
          >
            <input
              name="title"
              aria-label="Titlul paginii"
              maxLength={200}
              defaultValue={page.title}
              required
            />
            <button>Redenumește</button>
          </form>
          <div className="task-toolbar">
            <label>
              Pagină părinte{" "}
              <select
                value={parent ?? ""}
                onChange={(e) => edit({ parent: e.target.value || null })}
              >
                <option value="">Nivel principal</option>
                {pages
                  .filter((p) => p.id !== page.id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Coloane{" "}
              <select
                value={page.columns}
                onChange={(e) => {
                  const columns = Number(e.target.value);
                  edit({
                    columns,
                    blocks: page.blocks.map((b) => ({
                      ...b,
                      column: Math.min(b.column, columns - 1),
                    })),
                  });
                }}
              >
                {[1, 2, 3].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() =>
                edit({
                  blocks: [
                    ...page.blocks,
                    {
                      id: crypto.randomUUID(),
                      kind: "text",
                      text: "",
                      depth: 0,
                      done: false,
                      column: 0,
                      bold: false,
                    },
                  ],
                })
              }
            >
              Adaugă bloc
            </button>
          </div>
          <div
            className="block-columns"
            style={{ "--columns": page.columns } as React.CSSProperties}
          >
            {Array.from({ length: page.columns }, (_, column) => (
              <div key={column} className="block-column">
                {page.blocks
                  .filter((b) => b.column === column)
                  .map((b, index, items) => (
                    <article
                      key={b.id}
                      className="workspace-block"
                      onDragOver={(e) => {
                        if (dragged) e.preventDefault();
                      }}
                      onDrop={(e) => {
                        if (!dragged) return;
                        e.preventDefault();
                        moveBlock(dragged, b.id);
                        setDragged(null);
                      }}
                    >
                      <div className="task-toolbar">
                        <span
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", b.id);
                            setDragged(b.id);
                          }}
                          onDragEnd={() => setDragged(null)}
                          title="Trage pentru reordonare"
                        >
                          ⠿
                        </span>
                        <label>
                          Tip{" "}
                          <select
                            value={b.kind}
                            onChange={(e) =>
                              blockEdit(b.id, {
                                kind: e.target.value as BlockKind,
                              })
                            }
                          >
                            {Object.entries(BLOCK_TYPES).map(([key, label]) => (
                              <option key={key} value={key}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button
                          type="button"
                          disabled={!index}
                          aria-label="Mută blocul mai sus"
                          onClick={() => moveBlock(b.id, items[index - 1].id)}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={index === items.length - 1}
                          aria-label="Mută blocul mai jos"
                          onClick={() => moveBlock(b.id, items[index + 1].id)}
                        >
                          ↓
                        </button>
                      </div>
                      <textarea
                        aria-label="Conținutul blocului"
                        maxLength={5000}
                        value={b.text}
                        onChange={(e) =>
                          blockEdit(b.id, { text: e.target.value })
                        }
                      />
                      <div
                        style={{
                          paddingInlineStart: b.depth * 12,
                          overflowWrap: "anywhere",
                          fontWeight: b.bold ? 700 : undefined,
                        }}
                      >
                        {b.kind === "heading" ? (
                          <h3>{b.text}</h3>
                        ) : b.kind === "list" ? (
                          <ul>
                            <li>{b.text}</li>
                          </ul>
                        ) : b.kind === "check" ? (
                          <label className="check">
                            <input
                              type="checkbox"
                              checked={b.done}
                              onChange={(e) =>
                                blockEdit(b.id, { done: e.target.checked })
                              }
                            />
                            {b.text || "Bifat"}
                          </label>
                        ) : (
                          <p>{b.text}</p>
                        )}
                      </div>
                      <div className="task-toolbar">
                        <label className="check">
                          <input
                            type="checkbox"
                            checked={b.bold}
                            onChange={(e) =>
                              blockEdit(b.id, { bold: e.target.checked })
                            }
                          />
                          Aldin
                        </label>
                        <label>
                          Indentare{" "}
                          <select
                            value={b.depth}
                            onChange={(e) =>
                              blockEdit(b.id, { depth: Number(e.target.value) })
                            }
                          >
                            {[0, 1, 2].map((n) => (
                              <option key={n}>{n}</option>
                            ))}
                          </select>
                        </label>
                        {page.columns > 1 && (
                          <label>
                            Coloană{" "}
                            <select
                              value={b.column}
                              onChange={(e) =>
                                blockEdit(b.id, {
                                  column: Number(e.target.value),
                                })
                              }
                            >
                              {Array.from({ length: page.columns }, (_, n) => (
                                <option key={n} value={n}>
                                  {n + 1}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Ștergi blocul?"))
                              edit({
                                blocks: page.blocks.filter(
                                  (item) => item.id !== b.id,
                                ),
                              });
                          }}
                        >
                          Șterge blocul
                        </button>
                      </div>
                    </article>
                  ))}
              </div>
            ))}
          </div>
          <PageFields
            key={page.id}
            data={page.data}
            onChange={(data) => edit({ data })}
          />
        </>
      )}
    </section>
  );
}
