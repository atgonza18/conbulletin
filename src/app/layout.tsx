import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { BulletinProvider } from "@/context/BulletinContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Construction Daily Bulletin",
  description: "Track daily progress and manage action items for construction teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <BulletinProvider>
            {children}
          </BulletinProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
