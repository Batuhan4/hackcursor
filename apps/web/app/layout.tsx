import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniSight Street Intelligence",
  description:
    "Explainable, KVKK-safe physical street analysis for municipal planning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
