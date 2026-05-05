import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import QueryClientProviders from "./query-client-providers";
import ToastProvider from "@/components/common/ToastProvider";
import GlobalGenerationWidget from "@/components/common/GlobalGenerationWidget";

const pretendard = localFont({
  src: "../assets/fonts/pretendard/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "45 920",
});

export const metadata: Metadata = {
  title: "Tutti | Instrument Setup",
  description: "Configure your ensemble and generate musical partials with AI",
  icons: {
    icon: "/browser_icon.svg",
  },
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${pretendard.variable} font-sans antialiased`}>
        <QueryClientProviders>
          {children}
          {modal}
          <GlobalGenerationWidget />
        </QueryClientProviders>
        <ToastProvider />
      </body>
    </html>
  );
}
