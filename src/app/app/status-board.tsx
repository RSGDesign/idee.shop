"use client";
import { useState } from "react";
import { type Idea, totals, getItemSlots } from "@/lib/model";

const money = (c: number) =>
  new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON" }).format(
    c / 100,
  );

const STATUS_COLUMNS: {
  status: Idea["status"];
  label: string;
  badgeClass: string;
  description: string;
}[] = [
  {
    status: "Nouă",
    label: "Idei Noi",
    badgeClass: "badge-new",
    description: "Concepte inițiale de explorat",
  },
  {
    status: "În lucru",
    label: "În lucru",
    badgeClass: "badge-progress",
    description: "Proiecte în dezvoltare sau validare",
  },
  {
    status: "Validată",
    label: "Finalizate / Validate",
    badgeClass: "badge-done",
    description: "Idei validate cu rezultate concrete",
  },
  {
    status: "Arhivată",
    label: "Arhivate",
    badgeClass: "badge-archived",
    description: "Idei puse în așteptare",
  },
];

export default function StatusBoard({
  ideas,
  onSelect,
  onUpdateStatus,
}: {
  ideas: Idea[];
  onSelect: (id: string) => void;
  onUpdateStatus: (id: string, status: Idea["status"]) => void;
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  return (
    <div className="status-board">
      <p className="board-hint">
        💡 Trage cardurile (drag & drop) între coloane pentru a schimba rapid stadiul.
      </p>
      <div className="board-grid">
        {STATUS_COLUMNS.map((col) => {
          const colIdeas = ideas.filter((i) => i.status === col.status);
          const isOver = dragOverColumn === col.status;

          return (
            <div
              key={col.status}
              className={`board-column ${col.badgeClass} ${
                isOver ? "is-drag-over" : ""
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (dragOverColumn !== col.status) {
                  setDragOverColumn(col.status);
                }
              }}
              onDragLeave={(e) => {
                // Prevent clearing if hovering child
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverColumn(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id =
                  e.dataTransfer.getData("text/plain") || draggedId;
                if (id) {
                  onUpdateStatus(id, col.status);
                }
                setDragOverColumn(null);
                setDraggedId(null);
              }}
            >
              <div className="column-header">
                <div>
                  <h3>{col.label}</h3>
                  <small>{col.description}</small>
                </div>
                <span className="column-count">{colIdeas.length}</span>
              </div>
              <div className="column-cards">
                {colIdeas.length === 0 ? (
                  <p className="column-empty">
                    {isOver ? "Plasează ideea aici" : "Nicio idee în acest stadiu."}
                  </p>
                ) : (
                  colIdeas.map((idea) => {
                    const fin = totals(idea);
                    const doneTasks = idea.tasks.filter((t) => t.done).length;
                    const isDragging = draggedId === idea.id;

                    return (
                      <div
                        key={idea.id}
                        className={`board-card ${isDragging ? "is-dragging" : ""}`}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", idea.id);
                          e.dataTransfer.effectAllowed = "move";
                          setDraggedId(idea.id);
                        }}
                        onDragEnd={() => {
                          setDraggedId(null);
                          setDragOverColumn(null);
                        }}
                        onClick={() => onSelect(idea.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onSelect(idea.id);
                          }
                        }}
                      >
                        <div className="board-card-header">
                          <h4>{idea.title}</h4>
                          <span className="drag-handle" title="Trage pentru a muta">
                            ⠿
                          </span>
                        </div>
                        {idea.category && (
                          <span className="idea-tag">{idea.category}</span>
                        )}
                        {idea.description && (
                          <p className="board-card-desc">{idea.description}</p>
                        )}
                        <div className="board-card-meta">
                          {idea.tasks.length > 0 && (
                            <span>
                              ✓ {doneTasks}/{idea.tasks.length} pași
                            </span>
                          )}
                          {fin.profit !== 0 && (
                            <span
                              className={
                                fin.profit > 0 ? "profit-pos" : "profit-neg"
                              }
                            >
                              {fin.profit > 0 ? "+" : ""}
                              {money(fin.profit)}
                            </span>
                          )}
                          {getItemSlots(idea).length > 0 && (
                            <span className="scheduled-badge">
                              📅{" "}
                              {getItemSlots(idea).length === 1
                                ? getItemSlots(idea)[0].date
                                : `${getItemSlots(idea).length} date`}
                            </span>
                          )}
                        </div>
                        <div
                          className="board-card-actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <label
                            htmlFor={`status-select-${idea.id}`}
                            className="sr-only"
                          >
                            Schimbă stadiul pentru {idea.title}
                          </label>
                          <select
                            id={`status-select-${idea.id}`}
                            value={idea.status}
                            onChange={(e) =>
                              onUpdateStatus(
                                idea.id,
                                e.target.value as Idea["status"],
                              )
                            }
                          >
                            <option value="Nouă">Mută în: Nouă</option>
                            <option value="În lucru">Mută în: În lucru</option>
                            <option value="Validată">Mută în: Finalizată</option>
                            <option value="Arhivată">Mută în: Arhivată</option>
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
