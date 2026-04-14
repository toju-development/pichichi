import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Pichichi — El prode del Mundial 2026",
  description:
    "El prode más completo para el Mundial 2026. Creá tu grupo, predecí cada partido, sumá puntos y competí contra amigos. Gratis para iOS y Android.",
  keywords: [
    "prode mundial 2026",
    "prode",
    "predicciones mundial",
    "quiniela mundial 2026",
    "pichichi app",
    "prode futbol",
    "world cup 2026 predictions",
    "prode gratis",
  ],
  openGraph: {
    title: "Pichichi — El prode del Mundial 2026",
    description:
      "El prode más completo para el Mundial 2026. Creá tu grupo, predecí cada partido, sumá puntos y competí contra amigos. Gratis para iOS y Android.",
    type: "website",
    locale: "es_AR",
    siteName: "Pichichi",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pichichi — El prode del Mundial 2026",
    description:
      "El prode más completo para el Mundial 2026. Creá tu grupo, predecí cada partido, sumá puntos y competí contra amigos. Gratis para iOS y Android.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
