import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Manrope,
  Instrument_Serif,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/services/auth";
import { RouterBridge } from "@/services/router";
import { Toaster } from "@/components/ui/toaster";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});
const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});
const serif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});
const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Task Manager — Planification augmentée",
  description:
    "Plateforme de gestion de projets et de tâches assistée par l'IA. Du brief à la roadmap, en quelques minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      data-theme="clair"
      data-density="standard"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${serif.variable} ${mono.variable} antialiased`}
    >
      <head>
        {/* Restaure le theme avant l'hydratation pour eviter le flash
            clair→sombre au reload sur un compte en mode sombre. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var cached = sessionStorage.getItem('appearance');
                if (cached) {
                  var p = JSON.parse(cached);
                  if (p && p.theme) document.documentElement.dataset.theme = p.theme;
                  if (p && p.density) document.documentElement.dataset.density = p.density;
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-dvh bg-paper text-ink font-body">
        <RouterBridge />
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
