import type { Metadata } from "next";
import { Bungee, Press_Start_2P, Rubik } from "next/font/google";
import "./globals.css";

const pixel = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

const display = Bungee({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Rubik({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Overs/Unders",
  description: "Draft NBA teams. Count their wins or losses. Most points wins.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${pixel.variable} ${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
