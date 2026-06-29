import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "SIAKAD MINI - Portal Informasi Akademik Kampus",
  description: "Sistem Informasi Akademik Kampus modern dengan desain premium.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} font-sans`}>
      <body className="antialiased font-sans bg-[#f4f4f5] text-[#09090b]">
        {children}
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            style: { borderRadius: '14px', fontFamily: 'var(--font-plus-jakarta-sans)' }
          }}
        />
      </body>
    </html>
  );
}
