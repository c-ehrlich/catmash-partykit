import "./globals.css";
import type { Metadata } from "next";
import { MultiplayerContextProvider } from "./providers/multiplayer-context";

export const metadata: Metadata = {
  title: "CatMash",
  description: "Which cat is cuter???",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="flex flex-col items-center w-screen h-screen overflow-scroll py-8 bg-green-400 relative"
    >
      <MultiplayerContextProvider>
        <body className="flex flex-col items-center">{children}</body>
      </MultiplayerContextProvider>
    </html>
  );
}
