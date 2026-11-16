import type { Metadata } from "next";
import LoginForm from "@/app/login/login-form";
export const metadata: Metadata = {
  title: "Configurare administrator — Idee.Shop",
  robots: { index: false, follow: false },
};
export default function SetupPage() {
  return <LoginForm setup />;
}
