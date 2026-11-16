"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
export function LogoutButton() {
  const router = useRouter();
  const [error, setError] = useState("");
  return (
    <div>
      <button
        type="button"
        onClick={async () => {
          try {
            const r = await fetch("/api/auth/logout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: "{}",
            });
            if (!r.ok) throw new Error();
            router.replace("/");
            router.refresh();
          } catch {
            setError("Nu am putut încheia sesiunea. Încearcă din nou.");
          }
        }}
      >
        Ieși
      </button>
      <p role="status">{error}</p>
    </div>
  );
}

export default function AccessGate({
  children,
  admin = false,
}: {
  children: React.ReactNode;
  admin?: boolean;
}) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const r = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await r.json();
        if (!active) return;
        if (!r.ok) {
          setAllowed(false);
          router.replace("/login");
          return;
        }
        if (admin && data.user.role !== "admin") {
          setAllowed(false);
          router.replace("/app");
          return;
        }
        setAllowed(true);
      } catch {
        if (active) setAllowed(false);
      }
    };
    void check();
    const timer = setInterval(() => {
      if (!document.hidden) void check();
    }, 60000);
    window.addEventListener("focus", check);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", check);
    };
  }, [admin, router]);
  return allowed ? (
    children
  ) : (
    <p role="status" className="access-status">
      Se verifică accesul…
    </p>
  );
}
