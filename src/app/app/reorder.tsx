"use client";
import { useId, useRef, useState, type DragEvent, type ReactNode } from "react";
import { reorder } from "@/lib/reorder";

export default function Reorder<T extends { id: string; title: string }>({
  items,
  onChange,
  children,
  className,
  disabled,
  inlineHandle,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  children: (item: T, handle?: ReactNode) => ReactNode;
  className?: string;
  disabled?: boolean;
  inlineHandle?: boolean;
}) {
  const scope = useId();
  const touch = useRef<{ id: string; startX: number; startY: number } | null>(
    null,
  );
  function targetAt(x: number, y: number) {
    const row = document
      .elementFromPoint(x, y)
      ?.closest<HTMLElement>("[data-reorder-scope]");
    return row?.dataset.reorderScope === scope
      ? row.dataset.reorderId
      : undefined;
  }
  const [drag, setDrag] = useState<string>();
  const [target, setTarget] = useState<string>();
  const [announcement, setAnnouncement] = useState("");
  function move(id: string, to: number) {
    if (disabled) return;
    const from = items.findIndex((item) => item.id === id);
    if (from < 0 || to < 0 || to >= items.length || from === to) return;
    onChange(reorder(items, from, to));
    setAnnouncement(
      `${items[from].title}: poziția ${to + 1} din ${items.length}.`,
    );
  }
  function reset() {
    setDrag(undefined);
    setTarget(undefined);
  }
  function accepts(e: DragEvent) {
    return (
      !disabled &&
      drag &&
      e.dataTransfer.types.includes("application/x-idee-order")
    );
  }
  return (
    <>
      <div className={className}>
        {items.map((item, index) => (
          <div
            key={item.id}
            className="reorder-row"
            data-reorder-scope={scope}
            data-reorder-id={item.id}
            data-drop={
              target === item.id && drag !== item.id
                ? items.findIndex((i) => i.id === drag) < index
                  ? "after"
                  : "before"
                : undefined
            }
            onDragOver={(e) => {
              if (!accepts(e)) return;
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = "move";
              setTarget(item.id);
            }}
            onDragLeave={(e) => {
              if (
                e.relatedTarget instanceof Node &&
                e.currentTarget.contains(e.relatedTarget)
              )
                return;
              setTarget((current) =>
                current === item.id ? undefined : current,
              );
            }}
            onDrop={(e) => {
              if (!accepts(e)) return;
              e.preventDefault();
              e.stopPropagation();
              if (e.dataTransfer.getData("application/x-idee-order") === scope)
                move(drag!, index);
              reset();
            }}
          >
            {!inlineHandle && items.length > 1 && (
              <div
                className="reorder-controls"
                role="group"
                aria-label={`Reordonează ${item.title}`}
              >
                <span
                  aria-hidden="true"
                  title="Trage pentru a muta"
                  draggable={!disabled}
                  onDragStart={(e) => {
                    e.stopPropagation();
                    e.dataTransfer.setData("application/x-idee-order", scope);
                    e.dataTransfer.effectAllowed = "move";
                    setDrag(item.id);
                  }}
                  onDragEnd={(e) => {
                    e.stopPropagation();
                    reset();
                  }}
                >
                  ⠿
                </span>
                <button
                  type="button"
                  disabled={disabled || index === 0}
                  aria-label={`Mută mai sus: ${item.title}`}
                  onClick={() => move(item.id, index - 1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={disabled || index === items.length - 1}
                  aria-label={`Mută mai jos: ${item.title}`}
                  onClick={() => move(item.id, index + 1)}
                >
                  ↓
                </button>
              </div>
            )}
            {children(
              item,
              inlineHandle && !disabled && items.length > 1 ? (
                <button
                  type="button"
                  className="task-drag-handle"
                  disabled={disabled}
                  draggable={!disabled}
                  aria-label={`Reordonează ${item.title}`}
                  title="Trage pentru a muta. Cu tastatura folosește săgețile."
                  onKeyDown={(event) => {
                    const delta = {
                      ArrowUp: -1,
                      ArrowLeft: -1,
                      ArrowDown: 1,
                      ArrowRight: 1,
                    }[event.key];
                    if (delta === undefined) return;
                    event.preventDefault();
                    move(item.id, index + delta);
                  }}
                  onDragStart={(event) => {
                    if (disabled) return event.preventDefault();
                    event.dataTransfer.setData(
                      "application/x-idee-order",
                      scope,
                    );
                    event.dataTransfer.effectAllowed = "move";
                    setDrag(item.id);
                  }}
                  onDragEnd={reset}
                  onPointerDown={(event) => {
                    if (disabled || event.pointerType === "mouse") return;
                    touch.current = {
                      id: item.id,
                      startX: event.clientX,
                      startY: event.clientY,
                    };
                    event.currentTarget.setPointerCapture(event.pointerId);
                  }}
                  onPointerMove={(event) => {
                    const start = touch.current;
                    if (
                      !start ||
                      Math.hypot(
                        event.clientX - start.startX,
                        event.clientY - start.startY,
                      ) < 6
                    )
                      return;
                    setDrag(start.id);
                    setTarget(targetAt(event.clientX, event.clientY));
                  }}
                  onPointerUp={(event) => {
                    const start = touch.current;
                    if (
                      start &&
                      Math.hypot(
                        event.clientX - start.startX,
                        event.clientY - start.startY,
                      ) >= 6
                    ) {
                      const id = targetAt(event.clientX, event.clientY);
                      move(
                        start.id,
                        items.findIndex((item) => item.id === id),
                      );
                    }
                    touch.current = null;
                    reset();
                  }}
                  onLostPointerCapture={() => {
                    touch.current = null;
                    reset();
                  }}
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="currentColor"
                  >
                    {[6, 12, 18].map((y) => (
                      <g key={y}>
                        <circle cx="9" cy={y} r="1.6" />
                        <circle cx="15" cy={y} r="1.6" />
                      </g>
                    ))}
                  </svg>
                </button>
              ) : null,
            )}
          </div>
        ))}
      </div>
      <span className="sr-only" role="status">
        {announcement}
      </span>
    </>
  );
}
