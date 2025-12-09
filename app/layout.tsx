import type { Metadata } from "next";

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
      <body>{children}</body>
    </html>
  );
}
