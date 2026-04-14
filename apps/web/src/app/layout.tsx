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
  metadataBase: new URL("https://pichichi.app"),
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
  alternates: {
    canonical: "https://pichichi.app",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: "Pichichi — El prode del Mundial 2026",
    description:
      "El prode más completo para el Mundial 2026. Creá tu grupo, predecí cada partido, sumá puntos y competí contra amigos. Gratis para iOS y Android.",
    type: "website",
    url: "https://pichichi.app",
    locale: "es_AR",
    siteName: "Pichichi",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Pichichi — El prode del Mundial 2026",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pichichi — El prode del Mundial 2026",
    description:
      "El prode más completo para el Mundial 2026. Creá tu grupo, predecí cada partido, sumá puntos y competí contra amigos. Gratis para iOS y Android.",
    images: ["/og-image.png"],
    site: "@pichichi_app",
    creator: "@pichichi_app",
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
      <head>
        <meta name="theme-color" content="#0B6E4F" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Pichichi",
              applicationCategory: "SportsApplication",
              operatingSystem: "iOS, Android",
              description:
                "Armá tu grupo, predecí los scores y demostrá que sabés más de fútbol. El prode oficial del Mundial 2026.",
              url: "https://pichichi.app",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              inLanguage: "es-AR",
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
