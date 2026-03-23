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
  title: "Pichichi — Predecí el Mundial 2026",
  description:
    "Creá tu grupo, predecí los resultados del Mundial 2026 y competí contra tus amigos. Demostrá quién sabe más de fútbol.",
  keywords: [
    "mundial 2026",
    "prode",
    "predicciones",
    "fútbol",
    "world cup",
    "pichichi",
    "quiniela",
  ],
  openGraph: {
    title: "Pichichi — Predecí el Mundial 2026",
    description:
      "Creá tu grupo, predecí los resultados del Mundial 2026 y competí contra tus amigos.",
    type: "website",
    locale: "es_AR",
    siteName: "Pichichi",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pichichi — Predecí el Mundial 2026",
    description:
      "Creá tu grupo, predecí los resultados del Mundial 2026 y competí contra tus amigos.",
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
