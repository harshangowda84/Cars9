import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { CartProvider } from "@/context/CartContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { CartDrawer } from "@/components/CartDrawer";
import { FloatingCartPill } from "@/components/FloatingCartPill";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CARS9 | Premium Automotive Accessories & Custom Studio",
  description: "India's premier automotive accessory studio. OEM coupler-to-coupler fitment, precision sound engineering, Android touchscreens, and digital lighting.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors">
        <ThemeProvider>
          <SettingsProvider>
            <CartProvider>
              {children}
              <CartDrawer />
              <FloatingCartPill />
            </CartProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
