import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Registo de Horas",
  description: "App para registo de horas e despesas laborais.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
