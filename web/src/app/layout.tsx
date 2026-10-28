import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BookLeaf Support',
  description: 'Author support portal and support desk for BookLeaf Publishing',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans text-stone-900">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}