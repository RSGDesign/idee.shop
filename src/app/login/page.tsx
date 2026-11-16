import type { Metadata } from "next";
import { currentUser } from "@/server/current-user";
import { redirect } from "next/navigation";
import LoginForm from "./login-form";
export const metadata: Metadata = {
  title: "Intră în spațiul tău — Idee.Shop",
  description:
    "Accesează spațiul tău Idee.Shop și continuă să-ți transformi ideile în rezultate.",
};
export default async function LoginPage() {
  if (await currentUser()) redirect("/app");
  return <LoginForm />;
}
