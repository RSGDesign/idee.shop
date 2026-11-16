import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Idee.Shop — spațiu pentru ideile tale",
  description:
    "Adună ideile, organizează următorii pași și urmărește rezultatele cu Idee.Shop.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var p="dark";try{var v=localStorage.getItem("idee.shop.theme");if(v==="system"||v==="light"||v==="dark")p=v}catch{}document.documentElement.dataset.theme=p==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):p})()`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
