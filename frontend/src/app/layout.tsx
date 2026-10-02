import type { Metadata } from "next";
import { DM_Serif_Display, Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SmoothScroll } from "@/components/lenis";
import { TransitionProvider } from "@/components/TransitionProvider";

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-heading",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-accent",
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
    <html lang="en" className={`${dmSerif.variable} ${inter.variable} ${spaceGrotesk.variable}`}>
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
