import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { CurrencyProvider } from "@/lib/context/CurrencyContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MyFinance Dashboard",
  description: "High density financial dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased bg-brand-bg text-white font-sans h-screen flex relative`}
      >
        <svg style={{ position:'fixed', inset: 0, pointerEvents: 'none', opacity: 0.04, zIndex: 9999, width: '100%', height: '100%' }}>
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
        <CurrencyProvider>
          <Sidebar />
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-10 relative z-10">
            {children}
          </main>
        </CurrencyProvider>
      </body>
    </html>
  );
}
