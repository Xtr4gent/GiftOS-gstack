import type { Metadata } from "next";
import { IBM_Plex_Sans, Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const displayFont = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400"],
  display: "swap",
});

const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const utilityFont = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-utility",
  weight: ["500", "600"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Private Gift Tracker",
  description: "Track gifts, spending, and occasion memory in one private place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${bodyFont.variable} ${utilityFont.variable}`}>{children}</body>
    </html>
  );
}
