import type { Metadata, Viewport } from "next";
import { Playfair_Display, Space_Grotesk } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-context";
import { ThemeScript } from "@/components/theme/theme-script";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  preload: true,
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600"],
  preload: true,
});

export const metadata: Metadata = {
  title: "Zen Machine – Calm Vending Analytics",
  description:
    "A meditative vending machine interface blending tranquil UX with real-time AI economics.",
  applicationName: "Zen Machine",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  keywords: [
    "vending",
    "analytics",
    "calm design",
    "ai economics",
    "zen machine",
  ],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F7F5" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${playfair.variable} ${spaceGrotesk.variable} antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
