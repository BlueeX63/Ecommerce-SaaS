import type { Metadata } from "next";
import { Archivo, Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SmoothScroll } from "@/components/lenis";
import { TransitionProvider } from "@/components/TransitionProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-accent",
});

/** The app's heading font: bold, condensed, grotesk - the same family as the landing page's giant wordmark. */
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["600", "800", "900"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "Ecommerce SaaS Platform",
  description: "The most premium ecommerce SaaS platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${archivo.variable} ${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-full flex flex-col font-body bg-background text-primary selection:bg-accent selection:text-white antialiased">
        <AuthProvider>
          <SmoothScroll />
          <TransitionProvider>
            {children}
          </TransitionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
