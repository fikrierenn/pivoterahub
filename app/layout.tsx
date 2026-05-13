import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "ClientBrain - Video Modülü",
  description: "Video analizi ve performans takibi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
        <Sidebar />
        <div className="ml-64 min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 pt-16 px-4 pb-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
