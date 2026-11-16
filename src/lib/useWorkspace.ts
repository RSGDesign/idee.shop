"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { KEY, parseStore, type Store } from "./model";
type Snapshot = {
  store: Store;
  revision: number;
  imported?: number;
  owner?: { name: string };
};
const empty: Store = { version: 1, ideas: [] };
async function request(
  method = "GET",
  body?: unknown,
  endpoint = "/api/workspace",
): Promise<Snapshot> {
  const result = await fetch(endpoint, {
    method,
    cache: "no-store",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await result.json();
  if (!result.ok) throw new Error(data.error || "Datele nu pot fi salvate.");
  return { ...data, store: parseStore(JSON.stringify(data.store)) };
}
export function useWorkspace() {
  const [store, setStore] = useState<Store>(empty);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(true);
  const [pending, setPending] = useState(0);
  const [notice, setNotice] = useState("");
  const [legacyRaw, setLegacyRaw] = useState<string | null>(null);
  const revision = useRef(0),
    failed = useRef(false),
    latest = useRef(empty),
    serverReady = useRef(false);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const pendingRef = useRef(0);
  const endpointRef = useRef("/api/workspace");
  const [owner, setOwner] = useState("");
  const persist = useCallback((next: Store) => {
    if (!serverReady.current || failed.current)
      return Promise.reject(new Error("Salvarea este oprită."));
    latest.current = next;
    setStore(next);
    pendingRef.current += 1;
    setPending(pendingRef.current);
    const operation = queue.current
      .then(async () => {
        if (failed.current) throw new Error("Modificări nesalvate.");
        try {
          const snapshot = await request(
            "PUT",
            {
              store: next,
              revision: revision.current,
            },
            endpointRef.current,
          );
          revision.current = snapshot.revision;
        } catch (error) {
          failed.current = true;
          setLocked(true);
          setError(
            error instanceof Error ? error.message : "Salvarea a eșuat.",
          );
          throw error;
        }
      })
      .finally(() => {
        pendingRef.current -= 1;
        setPending(pendingRef.current);
      });
    queue.current = operation.catch(() => {});
    return operation;
  }, []);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const target = new URLSearchParams(window.location.search).get(
          "userId",
        );
        endpointRef.current = target
          ? `/api/workspace?userId=${encodeURIComponent(target)}`
          : "/api/workspace";
        let raw: string | null = null;
        try {
          if (!target) raw = localStorage.getItem(KEY);
        } catch {
          if (active)
            setNotice(
              "Datele vechi din browser nu pot fi citite. Colecția salvată rămâne disponibilă.",
            );
        }
        if (raw && active) setLegacyRaw(raw);
        let snapshot = await request("GET", undefined, endpointRef.current);
        if (active && target)
          setOwner(snapshot.owner?.name || `utilizator #${target}`);
        if (raw) {
          try {
            const legacy = parseStore(raw);
            snapshot = await request(
              "POST",
              { store: legacy },
              endpointRef.current,
            );
            if (active && snapshot.imported)
              setNotice(
                `Datele au fost transferate: ${snapshot.imported} idei. Copia din browser este păstrată.`,
              );
          } catch {
            if (active)
              setNotice(
                "Datele anterioare nu au fost transferate. Copia din browser este păstrată; o poți exporta mai jos.",
              );
          }
        }
        if (!active) return;
        revision.current = snapshot.revision;
        latest.current = snapshot.store;
        serverReady.current = true;
        failed.current = false;
        setStore(snapshot.store);
        setLocked(false);
        setReady(true);
      } catch {
        if (active) {
          setError(
            "Colecția nu poate fi citită. Reîncarcă pagina pentru a încerca din nou.",
          );
          setLocked(true);
          setReady(true);
        }
      }
    })();
    const warn = (event: BeforeUnloadEvent) => {
      if (failed.current || pendingRef.current) {
        event.preventDefault();
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      active = false;
      window.removeEventListener("beforeunload", warn);
    };
  }, []);
  function save(next: Store) {
    void persist(next).catch(() => {});
  }
  async function retry() {
    if (!serverReady.current) {
      window.location.reload();
      return;
    }
    try {
      // A newer revision requires explicit reconciliation, never a forced overwrite.
      const snapshot = await request("GET", undefined, endpointRef.current);
      if (snapshot.revision !== revision.current) {
        setError(
          "Există o versiune mai nouă. Exportă modificările tale, reîncarcă pagina și importă-le după verificare.",
        );
        return;
      }
      failed.current = false;
      setLocked(false);
      setError("");
      await persist(latest.current);
    } catch (error) {
      setLocked(true);
      setError(error instanceof Error ? error.message : "Salvarea a eșuat.");
    }
  }
  return {
    store,
    owner,
    ready,
    error,
    setError,
    locked,
    save,
    persist,
    retry,
    pending,
    notice,
    legacyRaw,
  };
}
