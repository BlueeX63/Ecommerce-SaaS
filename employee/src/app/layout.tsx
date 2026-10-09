import type { Metadata } from "next";
import { Archivo, Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-accent" });
const archivo = Archivo({ subsets: ["latin"], weight: ["600", "800", "900"], variable: "--font-heading" });

export const metadata: Metadata = {
  title: "Warehouse Panel",
  description: "Manage your warehouse's stock and orders",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${archivo.variable} ${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-full font-body bg-background text-primary selection:bg-accent selection:text-white antialiased">{children}</body>
    </html>
  );
}
