"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type Theme = "system" | "light" | "dark";
const key = "idee.shop.theme";
const themes: Theme[] = ["system", "light", "dark"];
const labels = { system: "Automată", light: "Luminoasă", dark: "Întunecată" };
const subscribe = () => () => {};
function readTheme(): Theme {
  try {
    const value = localStorage.getItem(key);
    if (value === "system" || value === "light" || value === "dark")
      return value;
  } catch {}
  return "dark";
}

export default function ThemeToggle() {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const [choice, setChoice] = useState<Theme | null>(null);
  const [error, setError] = useState(false);
  const theme = choice ?? (hydrated ? readTheme() : "dark");

  useEffect(() => {
    if (!hydrated) return;
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme =
        theme === "system" ? (media.matches ? "dark" : "light") : theme;
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme, hydrated]);

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={`Temă: ${labels[theme]}. Schimbă în ${labels[themes[(themes.indexOf(theme) + 1) % themes.length]]}`}
      onClick={() => {
        const next = themes[(themes.indexOf(theme) + 1) % themes.length];
        setChoice(next);
        try {
          localStorage.setItem(key, next);
          setError(false);
        } catch {
          setError(true);
        }
      }}
    >
      {labels[theme]}
      {error ? " · Preferința nu poate fi salvată" : ""}
    </button>
  );
}
