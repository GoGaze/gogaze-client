import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "GoGaze - Media Management",
  description: "Upload, manage, and display media on connected devices",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans`}>
        <AuthProvider>
          <ToastProvider>
            <TooltipProvider delayDuration={200}>
              {children}
            </TooltipProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
