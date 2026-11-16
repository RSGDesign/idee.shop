import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/server/current-user";
import AccessGate from "@/app/app/access-gate";
import AdminPanel from "./panel";
export const metadata: Metadata = {
  title: "Administrare — Idee.Shop",
  robots: { index: false, follow: false },
};
export default async function AdminPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/app");
  return (
    <AccessGate admin>
      <AdminPanel />
    </AccessGate>
  );
}
