import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
// Stand-in for Berkeley Mono (issue ids, metadata)
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap", weight: ["400"] });

export const metadata: Metadata = {
  title: "Pace",
  description: "SYSVIT work tracking",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} h-full`} style={{ colorScheme: "light" }}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
