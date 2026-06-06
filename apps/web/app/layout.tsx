import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YolDost — Çevresel Göstergelerle Rota",
  description:
    "Görüntülerden türetilen fiziksel çevre göstergeleriyle daha güvenli rota potansiyeli sunan rota deneyimi. Gerçek dünya güvenliği garanti edilmez.",
};

export const viewport: Viewport = {
  themeColor: "#f3f5f2",
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
