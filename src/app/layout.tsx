import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { MultiplayerContextProvider } from "./providers/multiplayer-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CatMash",
  description: "Rate cat pics, together.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <MultiplayerContextProvider>
        <body className={inter.className}>{children}</body>
      </MultiplayerContextProvider>
    </html>
  );
}
