import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ui/ClientLayout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Cassette: AI Audio Ad Production",
  description:
    "From brief to broadcast in 5 minutes. AI-powered audio ad production for Bauer Media: script generation, voice synthesis, mixing, and multi-station localisation.",
  openGraph: {
    title: "Cassette: AI Audio Ad Production",
    description:
      "From brief to broadcast in 5 minutes. AI-powered audio ad production for Bauer Media.",
    type: "website",
    siteName: "Cassette",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cassette: AI Audio Ad Production",
    description:
      "From brief to broadcast in 5 minutes. AI-powered audio ad production for Bauer Media.",
  },
  keywords: [
    "AI audio production",
    "radio ad generation",
    "voice synthesis",
    "Bauer Media",
    "ElevenLabs",
    "Claude AI",
    "broadcast advertising",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="bg-[#0f0f12] text-white antialiased font-sans flex min-h-screen md:h-screen md:overflow-hidden">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
