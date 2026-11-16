import type { Metadata } from "next";
import { currentUser } from "@/server/current-user";
import { redirect } from "next/navigation";
import Link from "next/link";
import AccessGate from "./access-gate";

export const metadata: Metadata = {
  title: "Dashboard — Idee.Shop",
  description:
    "Spațiul tău pentru idei, task-uri, note și venituri sau cheltuieli în RON.",
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  return (
    <AccessGate>
      {user.role === "admin" && (
        <div className="admin-shortcut">
          <Link href="/admin">Administrare →</Link>
        </div>
      )}
      {children}
    </AccessGate>
  );
}
