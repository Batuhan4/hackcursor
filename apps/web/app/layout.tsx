import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Urban Object Inventory",
  description:
    "KVKK-safe urban object inventory demo — Cursor x ALT+TAB Hackathon",
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
