import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "PivotaraHub",
  description: "AI destekli dijital danışmanlık platformu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="bg-zinc-50 min-h-screen">
        <Providers>
          <Sidebar />
          <div className="ml-56 min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 pt-14 px-6 pb-8">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
