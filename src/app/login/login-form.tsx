"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AUTH_KEY,
  SESSION_KEY,
  readAuthRecord,
  isValidEmail,
} from "@/lib/auth";
import styles from "./login.module.css";
type Field = "name" | "email" | "password" | "confirmation" | "code";
export default function LoginForm({ setup = false }: { setup?: boolean }) {
  const router = useRouter(),
    form = useRef<HTMLFormElement>(null);
  const [creating, setCreating] = useState(setup),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [errors, setErrors] = useState<Partial<Record<Field, string>>>({}),
    [adminConfigured, setAdminConfigured] = useState(true),
    [recovery, setRecovery] = useState(false);
  useEffect(() => {
    fetch("/api/auth/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setAdminConfigured(d.adminConfigured))
      .catch(() => {});
  }, []);
  function fail(next: Partial<Record<Field, string>>) {
    setErrors(next);
    const first = (
      ["name", "email", "password", "confirmation", "code"] as Field[]
    ).find((f) => next[f]);
    if (first)
      (
        form.current?.elements.namedItem(first) as HTMLInputElement | null
      )?.focus();
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget),
      name = String(data.get("name") || ""),
      email = String(data.get("email") || ""),
      password = String(data.get("password") || ""),
      code = String(data.get("code") || "").trim();
    const next: Partial<Record<Field, string>> = {};
    if (creating && !name.trim()) next.name = "Completează numele.";
    if (!isValidEmail(email)) next.email = "Introdu o adresă de email validă.";
    if (password.length < 8 || password.length > 1024)
      next.password = "Parola trebuie să aibă între 8 și 1024 de caractere.";
    if (creating && password !== data.get("confirmation"))
      next.confirmation = "Confirmarea nu coincide cu parola.";
    if (setup && !code) next.code = "Introdu cheia de configurare.";
    fail(next);
    setMessage("");
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      let legacy;
      try {
        legacy = readAuthRecord();
      } catch {}
      const result = await fetch(
        `/api/auth/${setup ? "setup" : creating ? "register" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            password,
            code,
            remember: data.get("remember") === "on",
            legacy: creating ? undefined : legacy,
          }),
        },
      );
      const answer = await result.json();
      if (!result.ok) {
        setMessage(answer.error || "Autentificarea a eșuat.");
        if (!creating && result.status === 401)
          fail({ password: "Emailul sau parola sunt incorecte." });
        return;
      }
      // The server has confirmed the database account and HttpOnly session.
      try {
        localStorage.removeItem(AUTH_KEY);
        localStorage.removeItem(SESSION_KEY);
      } catch {}
      form.current?.reset();
      router.replace(setup ? "/admin" : "/app");
      router.refresh();
    } catch {
      setMessage("Nu putem contacta aplicația. Încearcă din nou.");
    } finally {
      setBusy(false);
    }
  }
  const field = (
    key: Field,
    label: string,
    type: string,
    autocomplete: string,
  ) => (
    <label htmlFor={`account-${key}`}>
      {label}
      <input
        id={`account-${key}`}
        name={key}
        type={type}
        autoComplete={autocomplete}
        maxLength={
          key === "password" || key === "confirmation"
            ? 1024
            : key === "name"
              ? 200
              : key === "code"
                ? 128
                : 254
        }
        required
        aria-invalid={Boolean(errors[key])}
        aria-describedby={errors[key] ? `error-${key}` : undefined}
      />
      {errors[key] && (
        <span className={styles.fieldError} id={`error-${key}`}>
          {errors[key]}
        </span>
      )}
    </label>
  );
  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>
        ← Înapoi la site
      </Link>
      <section className={styles.card}>
        <p className="eyebrow">IDEE.SHOP · SPAȚIUL TĂU DE IDEI</p>
        <h1>
          {setup
            ? "Configurează administratorul"
            : creating
              ? "Creează-ți spațiul"
              : "Bine ai revenit."}
        </h1>
        <p>
          {setup
            ? "Alege datele contului care va administra aplicația. Colecția existentă va fi păstrată în acest cont."
            : "Intră în cont pentru a-ți continua ideile și proiectele."}
        </p>
        <form ref={form} noValidate onSubmit={submit}>
          <fieldset disabled={busy}>
            {creating && field("name", "Nume", "text", "name")}
            {field("email", "Email", "email", "email")}
            {field(
              "password",
              "Parolă (minimum 8 caractere)",
              "password",
              creating ? "new-password" : "current-password",
            )}
            {creating &&
              field(
                "confirmation",
                "Confirmă parola",
                "password",
                "new-password",
              )}
            {setup && field("code", "Cheie de configurare", "password", "off")}
            <label className={styles.remember}>
              <input type="checkbox" name="remember" />
              Ține-mă minte timp de 7 zile
            </label>
            <p className={styles.hint}>
              Fără bifă, sesiunea se încheie la închiderea browserului sau după
              cel mult 12 ore.
            </p>
            <button className={styles.primary} type="submit">
              {busy
                ? "Se verifică…"
                : setup
                  ? "Creează administratorul"
                  : creating
                    ? "Creează contul"
                    : "Intră în aplicație"}
            </button>
          </fieldset>
        </form>
        <p role="status" aria-live="polite" className={styles.messages}>
          {message || Object.values(errors).join(" ")}
        </p>
        {!setup && (
          <>
            <button
              type="button"
              onClick={() => {
                setCreating(!creating);
                setErrors({});
                setMessage("");
                form.current?.reset();
              }}
            >
              {creating ? "Ai deja cont? Intră" : "Creează un cont"}
            </button>
            <button
              className={styles.recoveryLink}
              type="button"
              aria-expanded={recovery}
              onClick={() => setRecovery(!recovery)}
            >
              Am uitat parola
            </button>
            {recovery && (
              <p>
                Contactează administratorul pentru resetarea parolei. Colecția
                ta va fi păstrată. Recuperarea prin email nu este încă
                disponibilă.
              </p>
            )}
            {!adminConfigured && (
              <p>
                <Link href="/admin/setup">
                  Configurează contul de administrator
                </Link>
              </p>
            )}
          </>
        )}
        {setup && (
          <p className={styles.hint}>
            Cheia este disponibilă proprietarului aplicației și se folosește o
            singură dată.
          </p>
        )}
      </section>
    </main>
  );
}
