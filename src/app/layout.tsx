import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agent Fleet Command Center",
  description: "Manage AI agents, dispatch tasks, and monitor your projects",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-72x72.png", sizes: "72x72" },
      { url: "/icon-96x96.png", sizes: "96x96" },
      { url: "/icon-128x128.png", sizes: "128x128" },
      { url: "/icon-144x144.png", sizes: "144x144" },
      { url: "/icon-152x152.png", sizes: "152x152" },
      { url: "/icon-192x192.png", sizes: "192x192" },
      { url: "/icon-384x384.png", sizes: "384x384" },
      { url: "/icon-512x512.png", sizes: "512x512" },
    ],
    apple: [
      { url: "/icon-192x192.png", sizes: "192x192" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fleet",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#4f46e5",
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
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
